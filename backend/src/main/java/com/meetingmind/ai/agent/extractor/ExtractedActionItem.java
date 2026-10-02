package com.meetingmind.ai.agent.extractor;

public record ExtractedActionItem(
    String description,
    String assignee,
    String dueDate,
    String context
) {}
