package com.meetingmind.observability;

import com.meetingmind.ai.agent.drafter.DrafterAgent;
import com.meetingmind.ai.agent.drafter.EmailDraft;
import com.meetingmind.ai.agent.extractor.ExtractedActionItem;
import com.meetingmind.ai.agent.extractor.ExtractedActionItemList;
import com.meetingmind.ai.agent.extractor.ExtractorAgent;
import com.meetingmind.ai.agent.reviewer.ReviewResult;
import com.meetingmind.ai.agent.reviewer.ReviewerAgent;
import com.meetingmind.ai.agent.summarizer.MeetingSummary;
import com.meetingmind.ai.agent.summarizer.SummarizerAgent;
import com.meetingmind.ai.orchestrator.MeetingOrchestrator;
import com.meetingmind.meeting.entity.Meeting;
import com.meetingmind.meeting.entity.MeetingStatus;
import com.meetingmind.meeting.service.MeetingService;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import io.micrometer.tracing.Tracer;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@SpringBootTest
@ActiveProfiles("test")
public class ObservabilityIntegrationTest {

    @Autowired
    private MeetingOrchestrator meetingOrchestrator;

    @Autowired
    private MeterRegistry meterRegistry;

    @Autowired(required = false)
    private Tracer tracer;

    @MockBean
    private SummarizerAgent summarizerAgent;

    @MockBean
    private ExtractorAgent extractorAgent;

    @MockBean
    private DrafterAgent drafterAgent;

    @MockBean
    private ReviewerAgent reviewerAgent;

    @MockBean
    private MeetingService meetingService;

    @Test
    @DisplayName("1. Tracer bean is present in application context")
    void tracerBeanIsAvailable() {
        assertThat(tracer).isNotNull();
    }

    @Test
    @DisplayName("2. Pipeline execution records custom metrics in MeterRegistry")
    void pipelineExecutionRecordsMetrics() {
        UUID meetingId = UUID.randomUUID();
        Meeting mockMeeting = new Meeting();
        mockMeeting.setId(meetingId);
        mockMeeting.setTitle("Observability Test Meeting");
        mockMeeting.setTranscript("Alice: We need to verify Prometheus metrics and tracing spans.");
        mockMeeting.setStatus(MeetingStatus.ANALYZING);

        when(meetingService.getMeeting(meetingId)).thenReturn(mockMeeting);

        MeetingSummary summary = new MeetingSummary("Test Title", "Exec summary", List.of("Decision 1"), List.of("Topic 1"));
        when(summarizerAgent.summarize(any())).thenReturn(summary);

        ExtractedActionItemList items = new ExtractedActionItemList(List.of(
                new ExtractedActionItem("Verify metrics", "Alice", "Tomorrow", "Observability test")
        ));
        when(extractorAgent.extract(any(), any())).thenReturn(items);

        EmailDraft draft = new EmailDraft("Test Subject", "Test Body", List.of());
        when(drafterAgent.draft(any(), any())).thenReturn(draft);

        ReviewResult review = new ReviewResult(true, List.of(), List.of(), List.of(), "Looks good.");
        when(reviewerAgent.review(any(), any(), any())).thenReturn(review);

        // Execute orchestrator pipeline
        CompletableFuture<Void> future = meetingOrchestrator.processMeeting(meetingId);
        future.join();

        // Verify request counters
        Counter startedCounter = meterRegistry.find("meetingmind.analysis.requests")
                .tag("status", "started")
                .counter();
        assertThat(startedCounter).isNotNull();
        assertThat(startedCounter.count()).isGreaterThanOrEqualTo(1.0);

        Counter completedCounter = meterRegistry.find("meetingmind.analysis.requests")
                .tag("status", "completed")
                .counter();
        assertThat(completedCounter).isNotNull();
        assertThat(completedCounter.count()).isGreaterThanOrEqualTo(1.0);

        // Verify agent latency timers
        Timer summarizerTimer = meterRegistry.find("meetingmind.ai.agent.duration")
                .tag("agent", "summarizer")
                .tag("status", "success")
                .timer();
        assertThat(summarizerTimer).isNotNull();
        assertThat(summarizerTimer.count()).isGreaterThanOrEqualTo(1);

        Timer overallDuration = meterRegistry.find("meetingmind.analysis.duration")
                .timer();
        assertThat(overallDuration).isNotNull();
        assertThat(overallDuration.count()).isGreaterThanOrEqualTo(1);
    }
}
