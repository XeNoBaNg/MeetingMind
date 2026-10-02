package com.meetingmind.actionitem.dto;

import java.util.List;

public record WorkloadResponseDto(
    String assignee,
    long openCount,
    long doneCount,
    List<ActionItemResponseDto> openItems
) {}
