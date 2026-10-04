package com.meetingmind.rag.service;

import com.meetingmind.meeting.entity.Meeting;
import com.meetingmind.meeting.entity.MeetingStatus;
import com.meetingmind.meeting.repository.MeetingRepository;
import com.meetingmind.rag.chunking.TranscriptChunker;
import com.meetingmind.rag.model.MeetingCitation;
import com.meetingmind.rag.model.RagQueryRequest;
import com.meetingmind.rag.model.RagResponse;
import com.meetingmind.rag.retrieval.MeetingRetriever;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class RagServiceImpl implements RagService {

    private static final Logger logger = LoggerFactory.getLogger(RagServiceImpl.class);

    private final TranscriptChunker transcriptChunker;
    private final VectorStore vectorStore;
    private final MeetingRetriever meetingRetriever;
    private final MeetingRepository meetingRepository;
    private final ChatClient chatClient;

    @Value("classpath:prompts/rag/rag-answer-prompt.st")
    private Resource promptTemplate;

    public RagServiceImpl(
            TranscriptChunker transcriptChunker,
            VectorStore vectorStore,
            MeetingRetriever meetingRetriever,
            MeetingRepository meetingRepository,
            ChatClient.Builder chatClientBuilder) {
        this.transcriptChunker = transcriptChunker;
        this.vectorStore = vectorStore;
        this.meetingRetriever = meetingRetriever;
        this.meetingRepository = meetingRepository;
        this.chatClient = chatClientBuilder.build();
    }

    @Override
    public void indexMeetingTranscript(UUID meetingId, String title, LocalDate meetingDate, String transcript) {
        if (transcript == null || transcript.trim().isEmpty()) {
            logger.warn("Skipping indexing for meeting {}: transcript is empty", meetingId);
            return;
        }

        // Authoritatively derive ownerId from the owning Meeting
        UUID ownerId = null;
        Optional<Meeting> meetingOpt = meetingRepository.findById(meetingId);
        if (meetingOpt.isPresent() && meetingOpt.get().getOwner() != null) {
            ownerId = meetingOpt.get().getOwner().getId();
        }

        try {
            logger.info("Indexing transcript for meeting {} ('{}'), ownerId={}", meetingId, title, ownerId);
            List<Document> chunks = transcriptChunker.chunkTranscript(meetingId, ownerId, title, meetingDate, transcript);

            if (chunks.isEmpty()) {
                logger.warn("No chunks generated for meeting {}", meetingId);
                return;
            }

            vectorStore.add(chunks);
            logger.info("Successfully indexed {} chunks for meeting {}", chunks.size(), meetingId);
        } catch (Exception e) {
            logger.error("Failed to index transcript for meeting {}", meetingId, e);
            throw new RuntimeException("RAG indexing failed for meeting " + meetingId + ": " + e.getMessage(), e);
        }
    }

    @Override
    public List<MeetingCitation> searchHistoricalMeetings(RagQueryRequest request) {
        return searchHistoricalMeetings(request, null);
    }

    @Override
    public List<MeetingCitation> searchHistoricalMeetings(RagQueryRequest request, UUID ownerId) {
        if (ownerId == null) {
            logger.warn("searchHistoricalMeetings invoked without ownerId; returning empty citations for security.");
            return List.of();
        }
        return meetingRetriever.retrieve(request.query(), request.topK(), request.minSimilarity(), ownerId);
    }

    @Override
    public RagResponse queryHistoricalMeetings(RagQueryRequest request) {
        return queryHistoricalMeetings(request, null);
    }

    @Override
    public RagResponse queryHistoricalMeetings(RagQueryRequest request, UUID ownerId) {
        if (ownerId == null) {
            logger.warn("queryHistoricalMeetings invoked without ownerId; returning empty response for security.");
            return new RagResponse(
                    request.query(),
                    "Access denied: owner identity required for historical meeting queries.",
                    List.of(),
                    0
            );
        }

        List<MeetingCitation> citations = searchHistoricalMeetings(request, ownerId);

        if (citations.isEmpty()) {
            return new RagResponse(
                    request.query(),
                    "Based on the available historical meetings, there is no record discussing this topic.",
                    List.of(),
                    0
            );
        }

        StringBuilder contextBuilder = new StringBuilder();
        for (int i = 0; i < citations.size(); i++) {
            MeetingCitation citation = citations.get(i);
            contextBuilder.append("--- SOURCE [").append(i + 1).append("] ---\n");
            contextBuilder.append("Meeting: ").append(citation.meetingTitle()).append("\n");
            if (citation.meetingDate() != null) {
                contextBuilder.append("Date: ").append(citation.meetingDate()).append("\n");
            }
            if (citation.speakers() != null && !citation.speakers().isEmpty()) {
                contextBuilder.append("Speakers: ").append(String.join(", ", citation.speakers())).append("\n");
            }
            contextBuilder.append("Excerpt:\n").append(citation.excerpt()).append("\n\n");
        }

        try {
            String answer = chatClient.prompt()
                    .user(u -> u.text(promptTemplate)
                            .param("context", contextBuilder.toString())
                            .param("question", request.query()))
                    .call()
                    .content();

            return new RagResponse(
                    request.query(),
                    answer != null ? answer.trim() : "Unable to generate answer.",
                    citations,
                    citations.size()
            );
        } catch (Exception e) {
            logger.error("Failed to generate grounded RAG answer for query: {}", request.query(), e);
            return new RagResponse(
                    request.query(),
                    "An error occurred while synthesizing the answer: " + e.getMessage(),
                    citations,
                    citations.size()
            );
        }
    }

    @Override
    public int indexAllCompletedMeetings() {
        logger.info("Scanning for all completed meetings to index into vector store...");
        List<Meeting> meetings = meetingRepository.findAll();
        int indexedCount = 0;

        for (Meeting meeting : meetings) {
            // Only index meetings that have an owner; unowned/legacy meetings remain unindexed and inaccessible
            if (meeting.getStatus() == MeetingStatus.COMPLETED 
                    && meeting.getOwner() != null
                    && meeting.getTranscript() != null 
                    && !meeting.getTranscript().isBlank()) {
                LocalDate meetingDate = meeting.getCreatedAt() != null 
                        ? meeting.getCreatedAt().toLocalDate() 
                        : LocalDate.now();
                try {
                    indexMeetingTranscript(meeting.getId(), meeting.getTitle(), meetingDate, meeting.getTranscript());
                    indexedCount++;
                } catch (Exception e) {
                    logger.warn("Could not index meeting {}: {}", meeting.getId(), e.getMessage());
                }
            }
        }

        logger.info("Indexed {} completed meetings into vector store", indexedCount);
        return indexedCount;
    }
}
