package com.meetingmind.mcp.tools;


import com.meetingmind.meeting.entity.Meeting;
import com.meetingmind.meeting.service.MeetingService;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.tool.annotation.ToolParam;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
public class MeetingTools {

    private final MeetingService meetingService;

    public MeetingTools(MeetingService meetingService) {
        this.meetingService = meetingService;
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

    public record MeetingSummaryDto(String id, String title, String date, String status) {}
}
