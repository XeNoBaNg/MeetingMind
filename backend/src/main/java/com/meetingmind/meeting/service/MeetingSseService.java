package com.meetingmind.meeting.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.meetingmind.meeting.entity.Meeting;
import com.meetingmind.meeting.entity.MeetingStatus;
import com.meetingmind.meeting.event.MeetingStatusChangedEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.Instant;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArraySet;

@Service
public class MeetingSseService {

    private static final Logger logger = LoggerFactory.getLogger(MeetingSseService.class);
    private static final long SSE_TIMEOUT = 30 * 60 * 1000L; // 30 minutes

    private final Map<UUID, Set<SseEmitter>> emitters = new ConcurrentHashMap<>();
    private final MeetingService meetingService;
    private final ObjectMapper objectMapper;

    public MeetingSseService(MeetingService meetingService, ObjectMapper objectMapper) {
        this.meetingService = meetingService;
        this.objectMapper = objectMapper;
    }

    public SseEmitter subscribe(UUID meetingId) {
        // Validate and get current status
        Meeting meeting = meetingService.getMeeting(meetingId);

        SseEmitter emitter = new SseEmitter(SSE_TIMEOUT);
        emitters.computeIfAbsent(meetingId, k -> new CopyOnWriteArraySet<>()).add(emitter);

        Runnable cleanup = () -> removeEmitter(meetingId, emitter);
        emitter.onCompletion(cleanup);
        emitter.onTimeout(cleanup);
        emitter.onError(e -> cleanup.run());

        // Send initial event
        try {
            emitter.send(SseEmitter.event()
                    .name("status")
                    .data(createPayload(meetingId, meeting.getStatus(), Instant.now())));
        } catch (IOException e) {
            logger.warn("Failed to send initial SSE event for meeting {}", meetingId, e);
            emitter.completeWithError(e);
        }

        return emitter;
    }

    @EventListener
    public void onMeetingStatusChanged(MeetingStatusChangedEvent event) {
        UUID meetingId = event.meetingId();
        Set<SseEmitter> meetingEmitters = emitters.get(meetingId);

        if (meetingEmitters != null && !meetingEmitters.isEmpty()) {
            logger.info("Broadcasting status {} to {} subscribers for meeting {}", 
                    event.status(), meetingEmitters.size(), meetingId);
                    
            String payload = createPayload(meetingId, event.status(), event.timestamp());
            
            for (SseEmitter emitter : meetingEmitters) {
                try {
                    emitter.send(SseEmitter.event()
                            .name("status")
                            .data(payload));
                } catch (IOException e) {
                    logger.warn("Failed to send SSE event, removing emitter for meeting {}", meetingId);
                    emitter.complete();
                    removeEmitter(meetingId, emitter);
                }
            }

            if (event.status() == MeetingStatus.COMPLETED || event.status() == MeetingStatus.FAILED) {
                completeAll(meetingId);
            }
        }
    }

    @Scheduled(fixedRate = 15000) // Send heartbeat every 15 seconds
    public void sendHeartbeats() {
        emitters.forEach((meetingId, meetingEmitters) -> {
            for (SseEmitter emitter : meetingEmitters) {
                try {
                    // Send a comment as a keep-alive/heartbeat
                    emitter.send(SseEmitter.event().comment("keep-alive"));
                } catch (IOException e) {
                    logger.debug("Failed to send heartbeat, removing emitter for meeting {}", meetingId);
                    emitter.complete();
                    removeEmitter(meetingId, emitter);
                }
            }
        });
    }

    private void removeEmitter(UUID meetingId, SseEmitter emitter) {
        Set<SseEmitter> meetingEmitters = emitters.get(meetingId);
        if (meetingEmitters != null) {
            meetingEmitters.remove(emitter);
            if (meetingEmitters.isEmpty()) {
                emitters.remove(meetingId);
            }
        }
    }

    private void completeAll(UUID meetingId) {
        Set<SseEmitter> meetingEmitters = emitters.remove(meetingId);
        if (meetingEmitters != null) {
            for (SseEmitter emitter : meetingEmitters) {
                try {
                    emitter.complete();
                } catch (Exception e) {
                    logger.warn("Error completing emitter for meeting {}", meetingId, e);
                }
            }
        }
    }

    private String createPayload(UUID meetingId, MeetingStatus status, Instant timestamp) {
        try {
            return objectMapper.writeValueAsString(Map.of(
                    "meetingId", meetingId,
                    "status", status,
                    "timestamp", timestamp.toString()
            ));
        } catch (Exception e) {
            logger.error("Failed to serialize SSE payload", e);
            return "{}";
        }
    }
}
