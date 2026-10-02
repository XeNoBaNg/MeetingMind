package com.meetingmind.rag.retrieval;

import com.meetingmind.rag.model.MeetingCitation;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Component
public class MeetingRetriever {

    private static final Logger logger = LoggerFactory.getLogger(MeetingRetriever.class);

    private final VectorStore vectorStore;

    public MeetingRetriever(VectorStore vectorStore) {
        this.vectorStore = vectorStore;
    }

    @SuppressWarnings("unchecked")
    public List<MeetingCitation> retrieve(String query, int topK, double minSimilarity) {
        logger.debug("Executing similarity search for query='{}', topK={}, minSimilarity={}", query, topK, minSimilarity);

        SearchRequest.Builder builder = SearchRequest.builder()
                .query(query)
                .topK(topK);

        if (minSimilarity > 0.0) {
            builder.similarityThreshold(minSimilarity);
        }

        SearchRequest request = builder.build();

        List<Document> matchedDocs;
        try {
            matchedDocs = vectorStore.similaritySearch(request);
        } catch (Exception e) {
            logger.error("Failed to execute similarity search in vector store", e);
            return List.of();
        }

        if (matchedDocs == null || matchedDocs.isEmpty()) {
            return List.of();
        }

        List<MeetingCitation> citations = new ArrayList<>();
        for (Document doc : matchedDocs) {
            Map<String, Object> meta = doc.getMetadata();

            UUID meetingId = null;
            if (meta.get("meetingId") != null) {
                try {
                    meetingId = UUID.fromString(meta.get("meetingId").toString());
                } catch (IllegalArgumentException ignored) {}
            }

            String meetingTitle = meta.get("meetingTitle") != null ? meta.get("meetingTitle").toString() : "Unknown Meeting";

            LocalDate meetingDate = null;
            if (meta.get("meetingDate") != null) {
                try {
                    meetingDate = LocalDate.parse(meta.get("meetingDate").toString());
                } catch (Exception ignored) {
                    meetingDate = LocalDate.now();
                }
            }

            List<String> speakers = List.of();
            if (meta.get("speakers") instanceof List<?> list) {
                speakers = list.stream().map(Object::toString).toList();
            }

            Double score = doc.getScore();

            citations.add(new MeetingCitation(
                    meetingId,
                    meetingTitle,
                    meetingDate,
                    speakers,
                    doc.getText(),
                    score
            ));
        }

        return citations;
    }
}
