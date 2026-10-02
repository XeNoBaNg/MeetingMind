package com.meetingmind.actionitem.controller;

import com.meetingmind.actionitem.dto.ActionItemResponseDto;
import com.meetingmind.actionitem.dto.ActionItemStatusUpdateRequest;
import com.meetingmind.actionitem.service.ActionItemService;
import com.meetingmind.common.response.ApiResponse;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/action-items")
public class ActionItemController {

    private final ActionItemService actionItemService;

    public ActionItemController(ActionItemService actionItemService) {
        this.actionItemService = actionItemService;
    }

    @GetMapping
    public ApiResponse<List<ActionItemResponseDto>> getAllActionItems() {
        List<ActionItemResponseDto> actionItems = actionItemService.getAllActionItems();
        return ApiResponse.ok(actionItems);
    }

    @PatchMapping("/{id}/status")
    public ApiResponse<ActionItemResponseDto> updateStatus(
            @PathVariable UUID id,
            @RequestBody ActionItemStatusUpdateRequest request
    ) {
        ActionItemResponseDto updated = actionItemService.updateStatus(id, request.status());
        return ApiResponse.ok(updated);
    }
}
