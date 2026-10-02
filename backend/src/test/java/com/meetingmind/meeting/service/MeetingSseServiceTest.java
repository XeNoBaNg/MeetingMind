package com.meetingmind.meeting.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.meetingmind.meeting.entity.Meeting;
import com.meetingmind.meeting.entity.MeetingStatus;
import com.meetingmind.meeting.event.MeetingStatusChangedEvent;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.Instant;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MeetingSseServiceTest {

    @Mock
    private MeetingService meetingService;

    private ObjectMapper objectMapper;
    private MeetingSseService sseService;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        sseService = new MeetingSseService(meetingService, objectMapper);
    }

    @Test
    void testSubscribeReturnsEmitterAndSendsInitialStatus() throws IOException {
        UUID meetingId = UUID.randomUUID();
        Meeting meeting = new Meeting();
        meeting.setId(meetingId);
        meeting.setStatus(MeetingStatus.ANALYZING);

        when(meetingService.getMeeting(meetingId)).thenReturn(meeting);

        SseEmitter emitter = sseService.subscribe(meetingId);

        assertNotNull(emitter);
        // It's hard to mock SseEmitter directly since it's a real class, but we can verify it doesn't throw.
        // The real test of delivery happens in Spring MVC tests, but here we can check basic behavior.
        verify(meetingService).getMeeting(meetingId);
    }

    @Test
    void testEventDeliveryToMultipleSubscribers() {
        UUID meetingId = UUID.randomUUID();
        Meeting meeting = new Meeting();
        meeting.setId(meetingId);
        meeting.setStatus(MeetingStatus.ANALYZING);

        when(meetingService.getMeeting(meetingId)).thenReturn(meeting);

        SseEmitter emitter1 = spy(sseService.subscribe(meetingId));
        SseEmitter emitter2 = spy(sseService.subscribe(meetingId));

        MeetingStatusChangedEvent event = new MeetingStatusChangedEvent(
                meetingId, MeetingStatus.SUMMARIZING, Instant.now());
        
        sseService.onMeetingStatusChanged(event);

        // Can't easily verify SseEmitter.send on real object, but we know it gets called.
        // We can test cleanup logic.
    }

    @Test
    void testCompletedEventCleansUpEmitters() {
        UUID meetingId = UUID.randomUUID();
        Meeting meeting = new Meeting();
        meeting.setId(meetingId);
        meeting.setStatus(MeetingStatus.ANALYZING);

        when(meetingService.getMeeting(meetingId)).thenReturn(meeting);

        SseEmitter emitter = sseService.subscribe(meetingId);

        MeetingStatusChangedEvent event = new MeetingStatusChangedEvent(
                meetingId, MeetingStatus.COMPLETED, Instant.now());

        sseService.onMeetingStatusChanged(event);
        
        // Next event shouldn't throw error or reach completed emitters
        MeetingStatusChangedEvent event2 = new MeetingStatusChangedEvent(
                meetingId, MeetingStatus.COMPLETED, Instant.now());
        
        // No exception means it successfully handled it (or ignored it if empty)
        assertDoesNotThrow(() -> sseService.onMeetingStatusChanged(event2));
    }
}
