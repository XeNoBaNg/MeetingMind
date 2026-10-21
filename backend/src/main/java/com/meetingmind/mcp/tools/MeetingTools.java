package com.meetingmind.mcp.tools;

import com.meetingmind.common.exception.ResourceNotFoundException;
import com.meetingmind.meeting.entity.Meeting;
import com.meetingmind.meeting.service.MeetingService;
import com.meetingmind.user.entity.User;
import com.meetingmind.user.service.UserService;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.tool.annotation.ToolParam;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
public class MeetingTools {

    private final MeetingService meetingService;
    private final UserService userService;

    public MeetingTools(MeetingService meetingService, UserService userService) {
        this.meetingService = meetingService;
        this.userService = userService;
    }

    /**
     * MCP tools currently operate as trusted system-level operations because
     * the current local/stdio MCP architecture does not propagate browser JWT identity.
     * These calls explicitly target the separated system service methods to prevent
     * bypassing user-scoped authorization boundaries.
     */
    @Tool(description = "Returns a list of recently analyzed meetings with identifiers, dates, and titles.")
    public List<MeetingSummaryDto> list_meetings(
            @ToolParam(description = "Maximum items to return") Integer limit) {
        
        int actualLimit = (limit != null && limit > 0) ? limit : 10;
        return meetingService.getAllMeetings().stream()
                .limit(actualLimit)
                .map(m -> new MeetingSummaryDto(m.getId().toString(), m.getTitle(), m.getCreatedAt().toString(), m.getStatus().name()))
                .collect(Collectors.toList());
    }

    @Tool(description = "Retrieves the executive summary and key decisions for a specific meeting.")
    public com.meetingmind.meeting.dto.MeetingSummaryDto get_meeting_summary(
            @ToolParam(description = "The UUID of the meeting") String meetingId) {
        Meeting meeting = meetingService.getMeeting(UUID.fromString(meetingId));
        if (meeting.getSummary() == null) throw new IllegalArgumentException("No summary available for this meeting yet.");
        return new com.meetingmind.meeting.dto.MeetingSummaryDto(
            meeting.getSummary().getId(),
            meeting.getSummary().getTitle(),
            meeting.getSummary().getOverview(),
            meeting.getSummary().getKeyDecisions(),
            meeting.getSummary().getDiscussionTopics()
        );
    }

    @Tool(description = "Permanently deletes a meeting and all associated data including summaries, action items, email drafts, review audits, and RAG search index. Requires explicit confirmation.")
    public DeleteMeetingResult delete_meeting(
            @ToolParam(description = "The UUID of the meeting to permanently delete") String meetingId,
            @ToolParam(description = "Explicit confirmation to permanently delete this meeting. Must be true to proceed.") Boolean confirm) {

        if (confirm == null || !confirm) {
            return new DeleteMeetingResult(false,
                "Deletion aborted: Confirmation required. Please confirm that you want to permanently delete meeting "
                + meetingId + " and all associated summaries, action items, drafts, reviews, and search embeddings by passing confirm=true.");
        }

        if (meetingId == null || meetingId.trim().isEmpty()) {
            return new DeleteMeetingResult(false, "Meeting ID is required.");
        }

        UUID uuid;
        try {
            uuid = UUID.fromString(meetingId.trim());
        } catch (IllegalArgumentException e) {
            return new DeleteMeetingResult(false, "Invalid meeting ID format: " + meetingId);
        }

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getName())) {
            return new DeleteMeetingResult(false, "Authentication required to delete meetings.");
        }

        try {
            User currentUser = userService.getUserByUsername(auth.getName());
            meetingService.deleteMeeting(uuid, currentUser);
            return new DeleteMeetingResult(true, "Meeting " + meetingId + " and all associated data were successfully and permanently deleted.");
        } catch (ResourceNotFoundException e) {
            return new DeleteMeetingResult(false, "Meeting not found or access denied: " + meetingId);
        } catch (Exception e) {
            return new DeleteMeetingResult(false, "Failed to delete meeting: " + e.getMessage());
        }
    }

    public record DeleteMeetingResult(boolean success, String message) {}

    public record MeetingSummaryDto(String id, String title, String date, String status) {}
}
