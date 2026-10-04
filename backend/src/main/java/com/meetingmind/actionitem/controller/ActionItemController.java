package com.meetingmind.actionitem.controller;

import com.meetingmind.actionitem.dto.ActionItemResponseDto;
import com.meetingmind.actionitem.dto.ActionItemStatusUpdateRequest;
import com.meetingmind.actionitem.service.ActionItemService;
import com.meetingmind.common.response.ApiResponse;
import com.meetingmind.user.entity.User;
import com.meetingmind.user.service.UserService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/action-items")
public class ActionItemController {

    private final ActionItemService actionItemService;
    private final UserService userService;

    public ActionItemController(ActionItemService actionItemService, UserService userService) {
        this.actionItemService = actionItemService;
        this.userService = userService;
    }

    @GetMapping
    public ApiResponse<List<ActionItemResponseDto>> getAllActionItems(Authentication authentication) {
        User currentUser = userService.getUserByUsername(authentication.getName());
        List<ActionItemResponseDto> actionItems = actionItemService.getAllActionItems(currentUser);
        return ApiResponse.ok(actionItems);
    }

    @PatchMapping("/{id}/status")
    public ApiResponse<ActionItemResponseDto> updateStatus(
            @PathVariable UUID id,
            @RequestBody ActionItemStatusUpdateRequest request,
            Authentication authentication
    ) {
        User currentUser = userService.getUserByUsername(authentication.getName());
        ActionItemResponseDto updated = actionItemService.updateStatus(id, request.status(), currentUser);
        return ApiResponse.ok(updated);
    }
}
