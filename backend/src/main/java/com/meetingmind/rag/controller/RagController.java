package com.meetingmind.rag.controller;

import com.meetingmind.meeting.entity.Meeting;
import com.meetingmind.meeting.service.MeetingService;
import com.meetingmind.rag.model.MeetingCitation;
import com.meetingmind.rag.model.RagQueryRequest;
import com.meetingmind.rag.model.RagResponse;
import com.meetingmind.rag.service.RagService;
import org.springframework.http.ResponseEntity;
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

    public RagController(RagService ragService, MeetingService meetingService) {
        this.ragService = ragService;
        this.meetingService = meetingService;
    }

    /**
     * Retrieval-only endpoint. Executes similarity search across historical meeting chunks.
     */
    @PostMapping("/search")
    public ResponseEntity<List<MeetingCitation>> searchHistoricalMeetings(@RequestBody RagQueryRequest request) {
        List<MeetingCitation> citations = ragService.searchHistoricalMeetings(request);
        return ResponseEntity.ok(citations);
    }

    /**
     * Retrieval + Grounded LLM answering endpoint. Answers user query citing source meetings.
     */
    @PostMapping("/query")
    public ResponseEntity<RagResponse> queryHistoricalMeetings(@RequestBody RagQueryRequest request) {
        RagResponse response = ragService.queryHistoricalMeetings(request);
        return ResponseEntity.ok(response);
    }

    /**
     * Re-indexes or indexes a specific meeting transcript into the vector store.
     */
    @PostMapping("/index/{meetingId}")
    public ResponseEntity<Map<String, Object>> indexMeeting(@PathVariable UUID meetingId) {
        Meeting meeting = meetingService.getMeeting(meetingId);
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
