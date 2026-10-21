package com.meetingmind.meeting.event;

import java.time.Instant;
import java.util.UUID;

public record MeetingDeletedEvent(UUID meetingId, Instant timestamp) {
}
