package com.meetingmind.actionitem.dto;

import com.meetingmind.actionitem.entity.ActionItemStatus;
import java.util.UUID;

public record ActionItemResponseDto(
    UUID id,
    String description,
    String assignee,
    String dueDate,
    String context,
    ActionItemStatus status,
    UUID meetingId,
    String meetingTitle
) {}
