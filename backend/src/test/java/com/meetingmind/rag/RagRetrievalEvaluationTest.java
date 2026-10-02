package com.meetingmind.rag;

import com.meetingmind.rag.model.MeetingCitation;
import com.meetingmind.rag.retrieval.MeetingRetriever;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

public class RagRetrievalEvaluationTest {

    private VectorStore vectorStore;
    private MeetingRetriever meetingRetriever;

    @BeforeEach
    void setUp() {
        vectorStore = mock(VectorStore.class);
        meetingRetriever = new MeetingRetriever(vectorStore);
    }

    @Test
    void testRelevantRetrieval() {
        UUID meetingId = UUID.randomUUID();
        Document mockDoc = new Document("The new authentication system will use JWT.",
                Map.of("meetingId", meetingId.toString(), "meetingTitle", "Auth Sync"));
        
        when(vectorStore.similaritySearch(argThat((SearchRequest r) -> 
            r.getQuery().contains("authentication"))))
            .thenReturn(List.of(mockDoc));

        List<MeetingCitation> citations = meetingRetriever.retrieve("How does authentication work?", 5, 0.0);

        assertEquals(1, citations.size());
        assertEquals("Auth Sync", citations.get(0).meetingTitle());
        assertTrue(citations.get(0).excerpt().contains("JWT"));
    }

    @Test
    void testIrrelevantRetrieval() {
        when(vectorStore.similaritySearch(any(SearchRequest.class)))
            .thenReturn(List.of()); // Simulating no matched documents passing threshold

        List<MeetingCitation> citations = meetingRetriever.retrieve("What is the recipe for pancakes?", 5, 0.7);

        assertTrue(citations.isEmpty(), "Should return empty citations when no chunks match");
    }

    @Test
    void testMissingContextBehavior() {
        when(vectorStore.similaritySearch(any(SearchRequest.class)))
            .thenReturn(null); // Simulated error or empty

        List<MeetingCitation> citations = meetingRetriever.retrieve("Some random query", 5, 0.7);
        assertTrue(citations.isEmpty(), "Null return from vector store should be handled gracefully");
    }
}
