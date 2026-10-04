package com.meetingmind.ai.orchestrator;

import com.meetingmind.ai.agent.drafter.DrafterAgent;
import com.meetingmind.ai.agent.drafter.EmailDraft;
import com.meetingmind.ai.agent.extractor.ExtractedActionItem;
import com.meetingmind.ai.agent.extractor.ExtractedActionItemList;
import com.meetingmind.ai.agent.extractor.ExtractorAgent;
import com.meetingmind.ai.agent.reviewer.ReviewResult;
import com.meetingmind.ai.agent.reviewer.ReviewerAgent;
import com.meetingmind.ai.agent.summarizer.MeetingSummary;
import com.meetingmind.ai.agent.summarizer.SummarizerAgent;
import com.meetingmind.meeting.entity.Meeting;
import com.meetingmind.meeting.entity.MeetingStatus;
import com.meetingmind.meeting.service.MeetingService;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import io.micrometer.tracing.Span;
import io.micrometer.tracing.Tracer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

@Service
public class MeetingOrchestrator {

    private static final Logger logger = LoggerFactory.getLogger(MeetingOrchestrator.class);

    private final SummarizerAgent summarizerAgent;
    private final ExtractorAgent extractorAgent;
    private final DrafterAgent drafterAgent;
    private final ReviewerAgent reviewerAgent;
    private final MeetingService meetingService;
    private final org.springframework.context.ApplicationEventPublisher eventPublisher;
    private final Tracer tracer;
    private final MeterRegistry meterRegistry;

    @Value("${meetingmind.ai.pipeline.summarizer-enabled:true}")
    private boolean summarizerEnabled;

    @Value("${meetingmind.ai.pipeline.extractor-enabled:true}")
    private boolean extractorEnabled;

    @Value("${meetingmind.ai.pipeline.drafter-enabled:true}")
    private boolean drafterEnabled;

    @Value("${meetingmind.ai.pipeline.reviewer-enabled:true}")
    private boolean reviewerEnabled;

    @Autowired
    public MeetingOrchestrator(
            SummarizerAgent summarizerAgent,
            ExtractorAgent extractorAgent,
            DrafterAgent drafterAgent,
            ReviewerAgent reviewerAgent,
            MeetingService meetingService,
            org.springframework.context.ApplicationEventPublisher eventPublisher,
            @Autowired(required = false) Tracer tracer,
            @Autowired(required = false) MeterRegistry meterRegistry) {
        this.summarizerAgent = summarizerAgent;
        this.extractorAgent = extractorAgent;
        this.drafterAgent = drafterAgent;
        this.reviewerAgent = reviewerAgent;
        this.meetingService = meetingService;
        this.eventPublisher = eventPublisher;
        this.tracer = tracer;
        this.meterRegistry = meterRegistry;
    }

    public MeetingOrchestrator(
            SummarizerAgent summarizerAgent,
            ExtractorAgent extractorAgent,
            DrafterAgent drafterAgent,
            ReviewerAgent reviewerAgent,
            MeetingService meetingService,
            org.springframework.context.ApplicationEventPublisher eventPublisher) {
        this(summarizerAgent, extractorAgent, drafterAgent, reviewerAgent, meetingService, eventPublisher, null, null);
    }

    private <T> T executeWithRetry(java.util.function.Supplier<T> action, int maxRetries, Span span) {
        int attempt = 0;
        while (attempt < maxRetries) {
            try {
                return action.get();
            } catch (Exception e) {
                attempt++;
                if (span != null) {
                    span.tag("retry.count", String.valueOf(attempt));
                }
                logger.warn("Agent call attempt {}/{} failed", attempt, maxRetries, e);
                if (attempt >= maxRetries) {
                    throw e;
                }
                try {
                    Thread.sleep(1000L * attempt); // basic backoff
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    throw new RuntimeException("Interrupted during retry backoff", ie);
                }
            }
        }
        return null;
    }

    private <T> T executeAgent(String agentName, java.util.function.Supplier<T> action) {
        Span span = tracer != null ? tracer.nextSpan().name(agentName + "_agent").tag("agent.name", agentName) : null;
        Tracer.SpanInScope ws = (tracer != null && span != null) ? tracer.withSpan(span.start()) : null;
        Timer.Sample sample = meterRegistry != null ? Timer.start(meterRegistry) : null;

        try {
            logger.info("Executing agent: {}", agentName);
            T result = executeWithRetry(action, 3, span);
            if (sample != null) {
                sample.stop(Timer.builder("meetingmind.ai.agent.duration")
                        .tag("agent", agentName)
                        .tag("status", "success")
                        .register(meterRegistry));
            }
            if (span != null) {
                span.tag("status", "success");
            }
            logger.info("Successfully completed agent: {}", agentName);
            return result;
        } catch (Exception e) {
            if (sample != null) {
                sample.stop(Timer.builder("meetingmind.ai.agent.duration")
                        .tag("agent", agentName)
                        .tag("status", "failure")
                        .register(meterRegistry));
            }
            if (span != null) {
                span.tag("status", "failure");
                span.error(e);
            }
            logger.error("Agent execution failed for agent: {}", agentName, e);
            throw e;
        } finally {
            if (ws != null) {
                ws.close();
            }
            if (span != null) {
                span.end();
            }
        }
    }

    @Async
    public CompletableFuture<Void> processMeeting(UUID meetingId) {
        Span parentSpan = tracer != null ? tracer.nextSpan().name("meeting_analysis").tag("meeting.id", meetingId.toString()) : null;
        Tracer.SpanInScope ws = (tracer != null && parentSpan != null) ? tracer.withSpan(parentSpan.start()) : null;
        Timer.Sample overallSample = meterRegistry != null ? Timer.start(meterRegistry) : null;

        if (meterRegistry != null) {
            meterRegistry.counter("meetingmind.analysis.requests", "status", "started").increment();
        }
        logger.info("Starting meeting analysis processing for meeting ID: {}", meetingId);

        try {
            Meeting meeting = meetingService.getMeeting(meetingId);
            String transcript = meeting.getTranscript();

            MeetingSummary summary = null;
            if (summarizerEnabled) {
                meetingService.updateStatus(meetingId, MeetingStatus.SUMMARIZING);
                try {
                    summary = executeAgent("summarizer", () -> summarizerAgent.summarize(transcript));
                    meetingService.saveSummary(meetingId, summary);
                } catch (Exception e) {
                    logger.error("Summarizer failed critically for meeting ID: {}", meetingId, e);
                    meetingService.updateStatus(meetingId, MeetingStatus.FAILED);
                    if (meterRegistry != null) {
                        meterRegistry.counter("meetingmind.analysis.requests", "status", "failed").increment();
                    }
                    if (parentSpan != null) {
                        parentSpan.tag("status", "failed");
                        parentSpan.error(e);
                    }
                    return CompletableFuture.completedFuture(null);
                }
            }

            ExtractedActionItemList actionItems = null;
            if (extractorEnabled) {
                meetingService.updateStatus(meetingId, MeetingStatus.EXTRACTING);
                try {
                    final MeetingSummary finalSummary = summary;
                    actionItems = executeAgent("extractor", () -> extractorAgent.extract(transcript, finalSummary));
                    meetingService.saveActionItems(meetingId, actionItems);
                } catch (Exception e) {
                    logger.error("Extractor failed for meeting ID: {}", meetingId, e);
                }
            }

            EmailDraft emailDraft = null;
            if (drafterEnabled) {
                meetingService.updateStatus(meetingId, MeetingStatus.DRAFTING);
                try {
                    final MeetingSummary finalSummary = summary;
                    final List<ExtractedActionItem> items = actionItems != null ? actionItems.items() : List.of();
                    emailDraft = executeAgent("drafter", () -> drafterAgent.draft(finalSummary, items));
                    meetingService.saveEmailDraft(meetingId, emailDraft);
                } catch (Exception e) {
                    logger.error("Drafter failed for meeting ID: {}", meetingId, e);
                }
            }

            ReviewResult reviewResult = null;
            if (reviewerEnabled) {
                meetingService.updateStatus(meetingId, MeetingStatus.REVIEWING);
                try {
                    final EmailDraft finalEmailDraft = emailDraft;
                    final List<ExtractedActionItem> items = actionItems != null ? actionItems.items() : List.of();
                    reviewResult = executeAgent("reviewer", () -> reviewerAgent.review(transcript, items, finalEmailDraft));
                    meetingService.saveReview(meetingId, reviewResult);
                } catch (Exception e) {
                    logger.error("Reviewer failed for meeting ID: {}. Draft preserved.", meetingId, e);
                    reviewResult = new ReviewResult(false, List.of("Reviewer agent failed to complete the review process due to an error."), List.of(), List.of(), "System: Review failed.");
                    meetingService.saveReview(meetingId, reviewResult);
                }
            }

            meetingService.updateStatus(meetingId, MeetingStatus.COMPLETED);
            
            java.time.LocalDate meetingDate = meeting.getCreatedAt() != null 
                    ? meeting.getCreatedAt().toLocalDate() 
                    : java.time.LocalDate.now();
            eventPublisher.publishEvent(new com.meetingmind.meeting.event.MeetingCompletedEvent(
                    meeting.getId(),
                    meeting.getTitle(),
                    meetingDate,
                    transcript
            ));

            if (meterRegistry != null) {
                meterRegistry.counter("meetingmind.analysis.requests", "status", "completed").increment();
            }
            if (parentSpan != null) {
                parentSpan.tag("status", "completed");
            }
            logger.info("Successfully completed meeting analysis for meeting ID: {}", meetingId);

        } catch (Exception e) {
            if (meterRegistry != null) {
                meterRegistry.counter("meetingmind.analysis.requests", "status", "failed").increment();
            }
            if (parentSpan != null) {
                parentSpan.tag("status", "failed");
                parentSpan.error(e);
            }
            logger.error("Error processing meeting ID: {}", meetingId, e);
            meetingService.updateStatus(meetingId, MeetingStatus.FAILED);
        } finally {
            if (overallSample != null) {
                overallSample.stop(Timer.builder("meetingmind.analysis.duration").register(meterRegistry));
            }
            if (ws != null) {
                ws.close();
            }
            if (parentSpan != null) {
                parentSpan.end();
            }
        }
        
        return CompletableFuture.completedFuture(null);
    }
}
