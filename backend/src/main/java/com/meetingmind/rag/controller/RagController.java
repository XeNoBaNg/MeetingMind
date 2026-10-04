package com.meetingmind.rag.controller;

import com.meetingmind.meeting.entity.Meeting;
import com.meetingmind.meeting.service.MeetingService;
import com.meetingmind.rag.model.MeetingCitation;
import com.meetingmind.rag.model.RagQueryRequest;
import com.meetingmind.rag.model.RagResponse;
import com.meetingmind.rag.service.RagService;
import com.meetingmind.user.entity.User;
import com.meetingmind.user.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/rag")
@CrossOrigin(origins = "*")
public class RagController {

    private final RagService ragService;
    private final MeetingService meetingService;
    private final UserService userService;

    public RagController(RagService ragService, MeetingService meetingService, UserService userService) {
        this.ragService = ragService;
        this.meetingService = meetingService;
        this.userService = userService;
    }

    /**
     * Retrieval-only endpoint. Executes similarity search scoped to current user's meetings.
     */
    @PostMapping("/search")
    public ResponseEntity<List<MeetingCitation>> searchHistoricalMeetings(
            @RequestBody RagQueryRequest request,
            Authentication authentication) {
        User currentUser = userService.getUserByUsername(authentication.getName());
        List<MeetingCitation> citations = ragService.searchHistoricalMeetings(request, currentUser.getId());
        return ResponseEntity.ok(citations);
    }

    /**
     * Retrieval + Grounded LLM answering endpoint scoped to current user's meetings.
     */
    @PostMapping("/query")
    public ResponseEntity<RagResponse> queryHistoricalMeetings(
            @RequestBody RagQueryRequest request,
            Authentication authentication) {
        User currentUser = userService.getUserByUsername(authentication.getName());
        RagResponse response = ragService.queryHistoricalMeetings(request, currentUser.getId());
        return ResponseEntity.ok(response);
    }

    /**
     * Re-indexes or indexes a specific meeting transcript into the vector store.
     * Verifies ownership to prevent IDOR vulnerabilities.
     */
    @PostMapping("/index/{meetingId}")
    public ResponseEntity<Map<String, Object>> indexMeeting(
            @PathVariable UUID meetingId,
            Authentication authentication) {
        User currentUser = userService.getUserByUsername(authentication.getName());
        meetingService.verifyMeetingOwnership(meetingId, currentUser);

        Meeting meeting = meetingService.getMeetingForSystem(meetingId);
        LocalDate meetingDate = meeting.getCreatedAt() != null 
                ? meeting.getCreatedAt().toLocalDate() 
                : LocalDate.now();

        ragService.indexMeetingTranscript(meeting.getId(), meeting.getTitle(), meetingDate, meeting.getTranscript());

        return ResponseEntity.ok(Map.of(
                "status", "SUCCESS",
                "meetingId", meetingId,
                "message", "Meeting transcript indexed successfully"
        ));
    }

    /**
     * Scans and indexes all historical completed meetings in the database.
     */
    @PostMapping("/index-all")
    public ResponseEntity<Map<String, Object>> indexAllMeetings() {
        int count = ragService.indexAllCompletedMeetings();
        return ResponseEntity.ok(Map.of(
                "status", "SUCCESS",
                "indexedMeetings", count,
                "message", "Successfully indexed " + count + " completed meetings into vector store"
        ));
    }
}
