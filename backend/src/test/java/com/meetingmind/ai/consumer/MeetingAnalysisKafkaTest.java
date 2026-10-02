package com.meetingmind.ai.consumer;

import com.meetingmind.ai.orchestrator.MeetingOrchestrator;
import com.meetingmind.meeting.event.MeetingAnalysisRequestedEvent;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.test.context.EmbeddedKafka;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@SpringBootTest
@EmbeddedKafka(partitions = 1)
@DirtiesContext
@ActiveProfiles("test")
@TestPropertySource(properties = {
    "spring.kafka.listener.auto-startup=true",
    "spring.kafka.consumer.auto-offset-reset=earliest"
})
public class MeetingAnalysisKafkaTest {

    @Autowired
    private KafkaTemplate<String, Object> kafkaTemplate;

    @MockBean
    private MeetingOrchestrator meetingOrchestrator;

    @Test
    public void testMeetingAnalysisEventConsumption() throws Exception {
        UUID meetingId = UUID.randomUUID();
        MeetingAnalysisRequestedEvent event = new MeetingAnalysisRequestedEvent(meetingId);

        when(meetingOrchestrator.processMeeting(any(UUID.class)))
                .thenReturn(CompletableFuture.completedFuture(null));

        // Allow consumer time to fully connect to embedded Kafka
        Thread.sleep(3000);

        kafkaTemplate.send("meeting-analysis-requests", meetingId.toString(), event).get(10, TimeUnit.SECONDS);

        // Wait for consumer to process
        verify(meetingOrchestrator, timeout(20000).times(1)).processMeeting(meetingId);
    }

    @Test
    public void testRetryAndDltBehavior() throws Exception {
        UUID meetingId = UUID.randomUUID();
        MeetingAnalysisRequestedEvent event = new MeetingAnalysisRequestedEvent(meetingId);

        // Simulate failure in orchestrator, causing Kafka to retry
        CompletableFuture<Void> failedFuture = new CompletableFuture<>();
        failedFuture.completeExceptionally(new RuntimeException("Simulated failure"));
        
        when(meetingOrchestrator.processMeeting(any(UUID.class)))
                .thenReturn(failedFuture);

        kafkaTemplate.send("meeting-analysis-requests", meetingId.toString(), event).get(10, TimeUnit.SECONDS);

        // Verify retries (1 initial + 2 retries = 3 total attempts based on @RetryableTopic(attempts = "3"))
        verify(meetingOrchestrator, timeout(25000).times(3)).processMeeting(meetingId);
    }
}
