package com.meetingmind.mcp.tools;

import com.meetingmind.actionitem.dto.ActionItemResponseDto;
import com.meetingmind.actionitem.dto.WorkloadResponseDto;
import com.meetingmind.actionitem.entity.ActionItemStatus;
import com.meetingmind.actionitem.service.ActionItemService;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.tool.annotation.ToolParam;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
public class ActionItemTools {

    private final ActionItemService actionItemService;

    public ActionItemTools(ActionItemService actionItemService) {
        this.actionItemService = actionItemService;
    }

    @Tool(description = "Lists action items filtered by completion status or assignee.")
    public List<ActionItemResponseDto> list_action_items(
            @ToolParam(description = "Filter by status: OPEN or DONE") String status,
            @ToolParam(description = "Filter by assignee name") String assignee) {
        
        List<ActionItemResponseDto> all = actionItemService.getAllActionItems();
        return all.stream()
                .filter(item -> status == null || status.isBlank() || item.status().name().equalsIgnoreCase(status))
                .filter(item -> assignee == null || assignee.isBlank() || (item.assignee() != null && item.assignee().equalsIgnoreCase(assignee)))
                .collect(Collectors.toList());
    }

    @Tool(description = "Updates the status of an action item to completed (DONE).")
    public ActionItemResponseDto mark_action_item_done(
            @ToolParam(description = "The UUID of the action item") String actionItemId) {
        return actionItemService.updateStatus(UUID.fromString(actionItemId), ActionItemStatus.DONE);
    }

    @Tool(description = "Aggregates deliverable statistics and counts for a specific person.")
    public WorkloadResponseDto get_person_workload(
            @ToolParam(description = "Name of the individual") String assignee) {
        return actionItemService.getWorkloadForAssignee(assignee);
    }
}
