package com.meetingmind.mcp.client.domain;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonPropertyDescription;

public record CalendarAvailabilityRequest(
    @JsonProperty(required = true) @JsonPropertyDescription("The date to check (e.g., Friday, 2023-10-27)") String date,
    @JsonProperty(required = true) @JsonPropertyDescription("The time to check (e.g., 2:00 PM)") String time
) {}
