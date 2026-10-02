package com.meetingmind.rag.model;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record MeetingCitation(
        UUID meetingId,
        String meetingTitle,
        LocalDate meetingDate,
        List<String> speakers,
        String excerpt,
        Double similarityScore
) {}
