package com.meetingmind.ai.consumer;

import com.meetingmind.ai.orchestrator.MeetingOrchestrator;
import com.meetingmind.meeting.event.MeetingAnalysisRequestedEvent;
import com.meetingmind.testcontainers.BaseKafkaIntegrationTest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.test.annotation.DirtiesContext;

import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * End-to-end integration test validating MeetingAnalysis consumer and retry/DLT pipeline
 * running against a live Kafka broker managed by Testcontainers.
 */
@SpringBootTest
@DirtiesContext
public class MeetingAnalysisKafkaContainerTest extends BaseKafkaIntegrationTest {

    @Autowired
    private KafkaTemplate<String, Object> kafkaTemplate;

    @MockBean
    private MeetingOrchestrator meetingOrchestrator;

    @Test
    @DisplayName("Verify meeting analysis event published to Kafka container is consumed and triggers orchestrator")
    public void testMeetingAnalysisEventConsumptionWithContainer() throws Exception {
        UUID meetingId = UUID.randomUUID();
        MeetingAnalysisRequestedEvent event = new MeetingAnalysisRequestedEvent(meetingId);

        when(meetingOrchestrator.processMeeting(any(UUID.class)))
                .thenReturn(CompletableFuture.completedFuture(null));

        kafkaTemplate.send("meeting-analysis-requests", meetingId.toString(), event).get(10, TimeUnit.SECONDS);

        // Verify consumer processes message from Kafka Testcontainer
        verify(meetingOrchestrator, timeout(20000).times(1)).processMeeting(meetingId);
    }

    @Test
    @DisplayName("Verify simulated failure triggers automatic retries and DLT routing on Kafka container")
    public void testRetryAndDltBehaviorWithContainer() throws Exception {
        UUID meetingId = UUID.randomUUID();
        MeetingAnalysisRequestedEvent event = new MeetingAnalysisRequestedEvent(meetingId);

        CompletableFuture<Void> failedFuture = new CompletableFuture<>();
        failedFuture.completeExceptionally(new RuntimeException("Simulated failure for Testcontainers"));

        when(meetingOrchestrator.processMeeting(any(UUID.class)))
                .thenReturn(failedFuture);

        kafkaTemplate.send("meeting-analysis-requests", meetingId.toString(), event).get(10, TimeUnit.SECONDS);

        // Verify 3 total attempts (1 initial + 2 retries via @RetryableTopic)
        verify(meetingOrchestrator, timeout(25000).times(3)).processMeeting(meetingId);
    }
}
