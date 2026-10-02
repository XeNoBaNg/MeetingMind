package com.meetingmind.ai.agent.reviewer;

import java.util.List;

public record ReviewResult(
    boolean verified,
    List<String> hallucinatedItems,
    List<String> missedItems,
    List<String> dateOrAssigneeDiscrepancies,
    String commentary
) {}
