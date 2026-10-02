package com.meetingmind.meeting.controller;

import com.meetingmind.ai.orchestrator.MeetingOrchestrator;
import com.meetingmind.common.response.ApiResponse;
import com.meetingmind.actionitem.dto.ActionItemDto;
import com.meetingmind.email.dto.EmailDraftDto;
import com.meetingmind.meeting.dto.*;
import com.meetingmind.meeting.entity.Meeting;
import com.meetingmind.meeting.service.MeetingService;
import com.meetingmind.meeting.event.MeetingAnalysisRequestedEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
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
    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final MeetingSseService meetingSseService;

    public MeetingAnalysisController(MeetingService meetingService, KafkaTemplate<String, Object> kafkaTemplate, MeetingSseService meetingSseService) {
        this.meetingService = meetingService;
        this.kafkaTemplate = kafkaTemplate;
        this.meetingSseService = meetingSseService;
    }

    @PostMapping
    public ApiResponse<MeetingResponse> createMeeting(@RequestBody MeetingRequest request) {
        Meeting meeting = meetingService.createMeeting(request.getTitle(), request.getTranscript());
        
        MeetingAnalysisRequestedEvent event = new MeetingAnalysisRequestedEvent(meeting.getId());
        kafkaTemplate.send("meeting-analysis-requests", meeting.getId().toString(), event)
                .whenComplete((result, ex) -> {
                    if (ex == null) {
                        logger.info("Sent event producer -> topic: {} -> partition: {} -> offset: {}",
                                result.getRecordMetadata().topic(),
                                result.getRecordMetadata().partition(),
                                result.getRecordMetadata().offset());
                    } else {
                        logger.error("Failed to send meeting analysis request for {}", meeting.getId(), ex);
                    }
                });

        MeetingResponse response = mapToResponse(meeting);
        return ApiResponse.ok(response);
    }

    @GetMapping
    public ApiResponse<List<MeetingResponse>> getAllMeetings() {
        List<MeetingResponse> meetings = meetingService.getAllMeetings().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
        return ApiResponse.ok(meetings);
    }

    @GetMapping("/{id}")
    public ApiResponse<MeetingDetailDto> getMeeting(@PathVariable UUID id) {
        MeetingDetailDto detailDto = meetingService.getMeetingDetail(id);
        return ApiResponse.ok(detailDto);
    }

    @GetMapping(value = "/{id}/events", produces = "text/event-stream")
    public SseEmitter streamMeetingEvents(@PathVariable UUID id) {
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

    private MeetingDetailDto mapToDetailDto(Meeting meeting) {
        MeetingSummaryDto summaryDto = null;
        if (meeting.getSummary() != null) {
            summaryDto = new MeetingSummaryDto(
                meeting.getSummary().getId(),
                meeting.getSummary().getTitle(),
                meeting.getSummary().getOverview(),
                meeting.getSummary().getKeyDecisions(),
                meeting.getSummary().getDiscussionTopics()
            );
        }

        MeetingReviewDto reviewDto = null;
        if (meeting.getReview() != null) {
            reviewDto = new MeetingReviewDto(
                meeting.getReview().getId(),
                meeting.getReview().isVerified(),
                meeting.getReview().getHallucinatedItems(),
                meeting.getReview().getMissedItems(),
                meeting.getReview().getDateOrAssigneeDiscrepancies(),
                meeting.getReview().getCommentary()
            );
        }

        EmailDraftDto emailDraftDto = null;
        if (meeting.getEmailDraft() != null) {
            emailDraftDto = new EmailDraftDto(
                meeting.getEmailDraft().getId(),
                meeting.getEmailDraft().getSubject(),
                meeting.getEmailDraft().getBody(),
                meeting.getEmailDraft().getRecipientSuggestions(),
                meeting.getEmailDraft().isReviewed()
            );
        }

        List<ActionItemDto> actionItems = null;
        if (meeting.getActionItems() != null) {
            actionItems = meeting.getActionItems().stream().map(ai -> new ActionItemDto(
                ai.getId(),
                ai.getDescription(),
                ai.getAssignee(),
                ai.getDueDate(),
                ai.getContext(),
                ai.getStatus()
            )).collect(Collectors.toList());
        }

        return new MeetingDetailDto(
            meeting.getId(),
            meeting.getTitle(),
            meeting.getTranscript(),
            meeting.getStatus(),
            meeting.getCreatedAt(),
            meeting.getUpdatedAt(),
            summaryDto,
            reviewDto,
            emailDraftDto,
            actionItems
        );
    }
}
