package com.meetingmind.meeting.event;

import java.time.LocalDate;
import java.util.UUID;

public record MeetingCompletedEvent(
        UUID meetingId,
        String title,
        LocalDate meetingDate,
        String transcript
) {}
