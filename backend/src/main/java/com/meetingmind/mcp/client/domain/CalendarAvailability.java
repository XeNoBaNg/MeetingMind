package com.meetingmind.mcp.client.domain;

public record CalendarAvailability(
    boolean isAvailable,
    String reason,
    boolean serverReachable
) {}
