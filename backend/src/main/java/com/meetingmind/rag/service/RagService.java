package com.meetingmind.rag.service;

import com.meetingmind.rag.model.MeetingCitation;
import com.meetingmind.rag.model.RagQueryRequest;
import com.meetingmind.rag.model.RagResponse;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface RagService {

    /**
     * Chunks, embeds, and stores the transcript of a completed meeting in the vector store.
     */
    void indexMeetingTranscript(UUID meetingId, String title, LocalDate meetingDate, String transcript);

    /**
     * Retrieval-only similarity search returning matching meeting citations without LLM generation.
     */
    List<MeetingCitation> searchHistoricalMeetings(RagQueryRequest request);

    /**
     * Semantic search and grounded answer generation with meeting citations using Grok.
     */
    RagResponse queryHistoricalMeetings(RagQueryRequest request);

    /**
     * Scans and indexes all historical completed meetings stored in PostgreSQL.
     * Returns the total number of meetings indexed.
     */
    int indexAllCompletedMeetings();
}
