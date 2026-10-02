package com.meetingmind.actionitem.dto;

import com.meetingmind.actionitem.entity.ActionItemStatus;

public record ActionItemStatusUpdateRequest(
    ActionItemStatus status
) {}
