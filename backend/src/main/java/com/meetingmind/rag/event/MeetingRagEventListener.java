package com.meetingmind.rag.event;

import com.meetingmind.meeting.event.MeetingCompletedEvent;
import com.meetingmind.rag.service.RagService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

@Component
public class MeetingRagEventListener {

    private static final Logger logger = LoggerFactory.getLogger(MeetingRagEventListener.class);

    private final RagService ragService;

    public MeetingRagEventListener(RagService ragService) {
        this.ragService = ragService;
    }

    @Async
    @EventListener
    public void onMeetingCompleted(MeetingCompletedEvent event) {
        logger.info("Received MeetingCompletedEvent for meeting {} ('{}'). Starting async RAG indexing...",
                event.meetingId(), event.title());
        try {
            ragService.indexMeetingTranscript(
                    event.meetingId(),
                    event.title(),
                    event.meetingDate(),
                    event.transcript()
            );
            logger.info("Asynchronous RAG indexing completed for meeting {}", event.meetingId());
        } catch (Exception e) {
            logger.error("Failed to asynchronously index meeting transcript for RAG: {}", event.meetingId(), e);
            // Non-blocking: meeting remains COMPLETED in domain state
        }
    }
}
