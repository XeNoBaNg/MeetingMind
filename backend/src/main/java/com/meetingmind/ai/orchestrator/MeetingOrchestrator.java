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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

    @Value("${meetingmind.ai.pipeline.summarizer-enabled:true}")
    private boolean summarizerEnabled;

    @Value("${meetingmind.ai.pipeline.extractor-enabled:true}")
    private boolean extractorEnabled;

    @Value("${meetingmind.ai.pipeline.drafter-enabled:true}")
    private boolean drafterEnabled;

    @Value("${meetingmind.ai.pipeline.reviewer-enabled:true}")
    private boolean reviewerEnabled;

    public MeetingOrchestrator(
            SummarizerAgent summarizerAgent,
            ExtractorAgent extractorAgent,
            DrafterAgent drafterAgent,
            ReviewerAgent reviewerAgent,
            MeetingService meetingService,
            org.springframework.context.ApplicationEventPublisher eventPublisher) {
        this.summarizerAgent = summarizerAgent;
        this.extractorAgent = extractorAgent;
        this.drafterAgent = drafterAgent;
        this.reviewerAgent = reviewerAgent;
        this.meetingService = meetingService;
        this.eventPublisher = eventPublisher;
    }

    private <T> T executeWithRetry(java.util.function.Supplier<T> action, int maxRetries) {
        int attempt = 0;
        while (attempt < maxRetries) {
            try {
                return action.get();
            } catch (Exception e) {
                attempt++;
                logger.warn("Agent call failed, attempt {}/{}", attempt, maxRetries, e);
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

    @Async
    public CompletableFuture<Void> processMeeting(UUID meetingId) {
        try {
            Meeting meeting = meetingService.getMeeting(meetingId);
            String transcript = meeting.getTranscript();

            MeetingSummary summary = null;
            if (summarizerEnabled) {
                meetingService.updateStatus(meetingId, MeetingStatus.SUMMARIZING);
                try {
                    summary = executeWithRetry(() -> summarizerAgent.summarize(transcript), 3);
                    meetingService.saveSummary(meetingId, summary);
                } catch (Exception e) {
                    logger.error("Summarizer failed critically for meeting {}", meetingId, e);
                    meetingService.updateStatus(meetingId, MeetingStatus.FAILED);
                    return CompletableFuture.completedFuture(null);
                }
            }

            ExtractedActionItemList actionItems = null;
            if (extractorEnabled) {
                meetingService.updateStatus(meetingId, MeetingStatus.EXTRACTING);
                try {
                    final MeetingSummary finalSummary = summary;
                    actionItems = executeWithRetry(() -> extractorAgent.extract(transcript, finalSummary), 3);
                    meetingService.saveActionItems(meetingId, actionItems);
                } catch (Exception e) {
                    logger.error("Extractor failed for meeting {}", meetingId, e);
                    // Continuing without action items, or could fail
                }
            }

            EmailDraft emailDraft = null;
            if (drafterEnabled) {
                meetingService.updateStatus(meetingId, MeetingStatus.DRAFTING);
                try {
                    final MeetingSummary finalSummary = summary;
                    final List<ExtractedActionItem> items = actionItems != null ? actionItems.items() : List.of();
                    emailDraft = executeWithRetry(() -> drafterAgent.draft(finalSummary, items), 3);
                    meetingService.saveEmailDraft(meetingId, emailDraft);
                } catch (Exception e) {
                    logger.error("Drafter failed for meeting {}", meetingId, e);
                }
            }

            ReviewResult reviewResult = null;
            if (reviewerEnabled) {
                meetingService.updateStatus(meetingId, MeetingStatus.REVIEWING);
                try {
                    final EmailDraft finalEmailDraft = emailDraft;
                    final List<ExtractedActionItem> items = actionItems != null ? actionItems.items() : List.of();
                    reviewResult = executeWithRetry(() -> reviewerAgent.review(transcript, items, finalEmailDraft), 3);
                    meetingService.saveReview(meetingId, reviewResult);
                } catch (Exception e) {
                    logger.error("Reviewer failed for meeting {}. Review result will be marked failed, but draft is preserved.", meetingId, e);
                    // Reviewer failed, but we do not discard the successfully generated draft.
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
            
        } catch (Exception e) {
            logger.error("Error processing meeting {}", meetingId, e);
            meetingService.updateStatus(meetingId, MeetingStatus.FAILED);
        }
        
        return CompletableFuture.completedFuture(null);
    }
}
