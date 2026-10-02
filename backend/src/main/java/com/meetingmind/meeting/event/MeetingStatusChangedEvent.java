package com.meetingmind.meeting.event;

import com.meetingmind.meeting.entity.MeetingStatus;
import java.time.Instant;
import java.util.UUID;

public record MeetingStatusChangedEvent(
    UUID meetingId,
    MeetingStatus status,
    Instant timestamp
) {}
