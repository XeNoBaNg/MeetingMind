package com.meetingmind.meeting.dto;

import java.util.List;
import java.util.UUID;

public record MeetingSummaryDto(
    UUID id,
    String title,
    String overview,
    List<String> keyDecisions,
    List<String> discussionTopics
) {}
