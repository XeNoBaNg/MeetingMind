package com.meetingmind.meeting.controller;

import com.meetingmind.common.response.ApiResponse;
import com.meetingmind.meeting.dto.*;
import com.meetingmind.meeting.entity.Meeting;
import com.meetingmind.meeting.service.MeetingService;
import com.meetingmind.meeting.event.MeetingAnalysisRequestedEvent;
import com.meetingmind.user.entity.User;
import com.meetingmind.user.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import com.meetingmind.meeting.service.MeetingSseService;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/meetings")
public class MeetingAnalysisController {

    private static final Logger logger = LoggerFactory.getLogger(MeetingAnalysisController.class);

    private final MeetingService meetingService;
    private final UserService userService;
    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final MeetingSseService meetingSseService;

    public MeetingAnalysisController(
            MeetingService meetingService,
            UserService userService,
            KafkaTemplate<String, Object> kafkaTemplate,
            MeetingSseService meetingSseService
    ) {
        this.meetingService = meetingService;
        this.userService = userService;
        this.kafkaTemplate = kafkaTemplate;
        this.meetingSseService = meetingSseService;
    }

    @PostMapping
    public ApiResponse<MeetingResponse> createMeeting(
            @RequestBody MeetingRequest request,
            Authentication authentication
    ) {
        User currentUser = userService.getUserByUsername(authentication.getName());
        Meeting meeting = meetingService.createMeeting(request.getTitle(), request.getTranscript(), currentUser);
        
        MeetingAnalysisRequestedEvent event = new MeetingAnalysisRequestedEvent(meeting.getId());
        kafkaTemplate.send("meeting-analysis-requests", meeting.getId().toString(), event)
                .whenComplete((result, ex) -> {
                    if (ex == null) {
                        logger.info("Kafka producer published analysis request for meeting ID: {}, topic: {}, partition: {}, offset: {}",
                                meeting.getId(),
                                result.getRecordMetadata().topic(),
                                result.getRecordMetadata().partition(),
                                result.getRecordMetadata().offset());
                    } else {
                        logger.error("Failed to send meeting analysis request for meeting ID: {}", meeting.getId(), ex);
                    }
                });

        MeetingResponse response = mapToResponse(meeting);
        return ApiResponse.ok(response);
    }

    @GetMapping
    public ApiResponse<List<MeetingResponse>> getAllMeetings(Authentication authentication) {
        User currentUser = userService.getUserByUsername(authentication.getName());
        List<MeetingResponse> meetings = meetingService.getAllMeetings(currentUser).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
        return ApiResponse.ok(meetings);
    }

    @GetMapping("/{id}")
    public ApiResponse<MeetingDetailDto> getMeeting(
            @PathVariable UUID id,
            Authentication authentication
    ) {
        User currentUser = userService.getUserByUsername(authentication.getName());
        MeetingDetailDto detailDto = meetingService.getMeetingDetail(id, currentUser);
        return ApiResponse.ok(detailDto);
    }

    @GetMapping(value = "/{id}/events", produces = "text/event-stream")
    public SseEmitter streamMeetingEvents(
            @PathVariable UUID id,
            Authentication authentication
    ) {
        User currentUser = userService.getUserByUsername(authentication.getName());
        // Enforce ownership check prior to establishing SSE stream subscription
        meetingService.verifyMeetingOwnership(id, currentUser);
        return meetingSseService.subscribe(id);
    }

    private MeetingResponse mapToResponse(Meeting meeting) {
        MeetingResponse response = new MeetingResponse();
        response.setId(meeting.getId());
        response.setTitle(meeting.getTitle());
        response.setStatus(meeting.getStatus());
        response.setCreatedAt(meeting.getCreatedAt());
        response.setUpdatedAt(meeting.getUpdatedAt());
        return response;
    }
}
