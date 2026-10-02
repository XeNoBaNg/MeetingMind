package com.meetingmind.meeting.dto;

import com.meetingmind.actionitem.dto.ActionItemDto;
import com.meetingmind.email.dto.EmailDraftDto;
import com.meetingmind.meeting.entity.MeetingStatus;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record MeetingDetailDto(
    UUID id,
    String title,
    String transcript,
    MeetingStatus status,
    LocalDateTime createdAt,
    LocalDateTime updatedAt,
    MeetingSummaryDto summary,
    MeetingReviewDto review,
    EmailDraftDto emailDraft,
    List<ActionItemDto> actionItems
) {}
