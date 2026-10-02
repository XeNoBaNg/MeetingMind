package com.meetingmind.ai;

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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;

import java.util.List;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.argThat;

import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
public class MeetingPipelineIntegrationTest {

    @Autowired
    private MeetingOrchestrator meetingOrchestrator;

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

    private Meeting testMeeting;
    private UUID meetingId;

    @BeforeEach
    void setUp() {
        meetingId = UUID.randomUUID();
        testMeeting = new Meeting();
        testMeeting.setId(meetingId);
        testMeeting.setTitle("Test Meeting");
        testMeeting.setTranscript("Test transcript");
        testMeeting.setStatus(MeetingStatus.ANALYZING);

        when(meetingService.getMeeting(meetingId)).thenReturn(testMeeting);
    }

    @Test
    void testSuccessfulPipeline() throws Exception {
        MeetingSummary summary = new MeetingSummary("Test Title", "Exec summary", List.of("Point 1"), List.of("Topic"));
        ExtractedActionItemList actionItems = new ExtractedActionItemList(List.of(
                new ExtractedActionItem("Task 1", "Alice", "Next week", "Context 1")
        ));
        EmailDraft draft = new EmailDraft("Subject", "Body", List.of());
        ReviewResult review = new ReviewResult(true, List.of(), List.of(), List.of(), "Looks good");

        when(summarizerAgent.summarize(anyString())).thenReturn(summary);
        when(extractorAgent.extract(anyString(), any(MeetingSummary.class))).thenReturn(actionItems);
        when(drafterAgent.draft(any(MeetingSummary.class), anyList())).thenReturn(draft);
        when(reviewerAgent.review(anyString(), anyList(), any(EmailDraft.class))).thenReturn(review);

        CompletableFuture<Void> future = meetingOrchestrator.processMeeting(meetingId);
        future.join();

        verify(meetingService).updateStatus(meetingId, MeetingStatus.SUMMARIZING);
        verify(meetingService).saveSummary(meetingId, summary);
        verify(meetingService).updateStatus(meetingId, MeetingStatus.EXTRACTING);
        verify(meetingService).saveActionItems(meetingId, actionItems);
        verify(meetingService).updateStatus(meetingId, MeetingStatus.DRAFTING);
        verify(meetingService).saveEmailDraft(meetingId, draft);
        verify(meetingService).updateStatus(meetingId, MeetingStatus.REVIEWING);
        verify(meetingService).saveReview(meetingId, review);
        verify(meetingService).updateStatus(meetingId, MeetingStatus.COMPLETED);
    }

    @Test
    void testSummarizerCriticalFailure() throws Exception {
        when(summarizerAgent.summarize(anyString())).thenThrow(new RuntimeException("API limits"));

        CompletableFuture<Void> future = meetingOrchestrator.processMeeting(meetingId);
        future.join();

        verify(meetingService).updateStatus(meetingId, MeetingStatus.SUMMARIZING);
        verify(meetingService, never()).saveSummary(any(), any());
        verify(meetingService).updateStatus(meetingId, MeetingStatus.FAILED);
        // Pipeline should abort, so EXTRACTING should not happen
        verify(meetingService, never()).updateStatus(meetingId, MeetingStatus.EXTRACTING);
    }

    @Test
    void testReviewerGracefulDegradation() throws Exception {
        MeetingSummary summary = new MeetingSummary("Test Title", "Exec summary", List.of("Point 1"), List.of("Topic"));
        ExtractedActionItemList actionItems = new ExtractedActionItemList(List.of());
        EmailDraft draft = new EmailDraft("Subject", "Body", List.of());

        when(summarizerAgent.summarize(anyString())).thenReturn(summary);
        when(extractorAgent.extract(anyString(), any(MeetingSummary.class))).thenReturn(actionItems);
        when(drafterAgent.draft(any(MeetingSummary.class), anyList())).thenReturn(draft);
        when(reviewerAgent.review(anyString(), anyList(), any(EmailDraft.class))).thenThrow(new RuntimeException("Reviewer failed"));

        CompletableFuture<Void> future = meetingOrchestrator.processMeeting(meetingId);
        future.join();

        verify(meetingService).saveEmailDraft(meetingId, draft); // Draft is preserved
        verify(meetingService).saveReview(eq(meetingId), argThat(r -> 
            r.verified() == false && r.commentary().contains("Review failed")
        ));
        verify(meetingService).updateStatus(meetingId, MeetingStatus.COMPLETED);
    }
}
