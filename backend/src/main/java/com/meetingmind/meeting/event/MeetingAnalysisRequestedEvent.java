package com.meetingmind.meeting.event;

import java.util.UUID;

public record MeetingAnalysisRequestedEvent(UUID meetingId) {}
