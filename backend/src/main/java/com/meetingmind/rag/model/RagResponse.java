package com.meetingmind.rag.model;

import java.util.List;

public record RagResponse(
        String query,
        String answer,
        List<MeetingCitation> citations,
        int chunksRetrieved
) {}
