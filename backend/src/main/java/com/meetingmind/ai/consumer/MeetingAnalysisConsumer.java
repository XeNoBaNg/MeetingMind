package com.meetingmind.ai.consumer;

import com.meetingmind.ai.orchestrator.MeetingOrchestrator;
import com.meetingmind.meeting.event.MeetingAnalysisRequestedEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.annotation.RetryableTopic;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.stereotype.Component;

@Component
public class MeetingAnalysisConsumer {

    private static final Logger logger = LoggerFactory.getLogger(MeetingAnalysisConsumer.class);

    private final MeetingOrchestrator meetingOrchestrator;

    public MeetingAnalysisConsumer(MeetingOrchestrator meetingOrchestrator) {
        this.meetingOrchestrator = meetingOrchestrator;
    }

    @RetryableTopic(attempts = "3", dltTopicSuffix = "-dlt")
    @KafkaListener(topics = "meeting-analysis-requests", groupId = "meetingmind-analysis-group")
    public void consumeMeetingAnalysisRequest(
            MeetingAnalysisRequestedEvent event,
            @Header(KafkaHeaders.RECEIVED_PARTITION) int partition,
            @Header(KafkaHeaders.OFFSET) long offset) {
        
        logger.info("Consumer received event for meeting {} from consumer group -> topic: meeting-analysis-requests -> partition: {} -> offset: {} -> orchestrator flow started", 
                event.meetingId(), partition, offset);

        // processMeeting is @Async, so we join to wait for completion.
        // This ensures the Kafka consumer waits for the pipeline to finish,
        // allowing Kafka's retry and DLT mechanisms to properly detect failures.
        meetingOrchestrator.processMeeting(event.meetingId()).join();
        
        logger.info("Successfully completed orchestrator flow for meeting {}", event.meetingId());
    }
}
