package com.meetingmind.meeting.dto;

import java.util.List;
import java.util.UUID;

public record MeetingReviewDto(
    UUID id,
    boolean verified,
    List<String> hallucinatedItems,
    List<String> missedItems,
    List<String> dateOrAssigneeDiscrepancies,
    String commentary
) {}
