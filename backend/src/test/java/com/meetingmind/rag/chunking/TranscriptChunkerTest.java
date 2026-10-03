package com.meetingmind.rag.chunking;

import org.junit.jupiter.api.Test;
import org.springframework.ai.document.Document;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class TranscriptChunkerTest {

    @Test
    void testEmptyTranscriptReturnsEmptyList() {
        TranscriptChunker chunker = new TranscriptChunker();
        List<Document> docs = chunker.chunkTranscript(UUID.randomUUID(), "Test", LocalDate.now(), "");
        assertTrue(docs.isEmpty());
    }

    @Test
    void testSpeakerPreservationAndMetadata() {
        TranscriptChunker chunker = new TranscriptChunker(new ChunkingStrategy(200, 500, 0.2, true));
        UUID meetingId = UUID.randomUUID();
        LocalDate date = LocalDate.of(2026, 9, 19);

        String transcript = """
                Alice: Good morning team, today we need to decide on our database architecture for MeetingMind.
                Bob: I investigated PostgreSQL with pgvector. It looks like a great fit because it avoids separate vector databases.
                Alice: That sounds very efficient and aligns with our zero-cost constraint.
                Charlie: What about the embedding model? Can we run all-MiniLM-L6-v2 locally?
                Bob: Yes, via Spring AI Transformers using ONNX runtime on the CPU directly.
                Alice: Perfect. Let's make sure our chunking preserves speaker context so citations are clear.
                Charlie: Agreed, I will configure the index with HNSW and cosine distance.
                """;

        List<Document> chunks = chunker.chunkTranscript(meetingId, "Architecture Sync", date, transcript);

        assertFalse(chunks.isEmpty());
        for (Document doc : chunks) {
            assertEquals(meetingId.toString(), doc.getMetadata().get("meetingId"));
            assertEquals("Architecture Sync", doc.getMetadata().get("meetingTitle"));
            assertEquals("2026-09-19", doc.getMetadata().get("meetingDate"));
            assertNotNull(doc.getMetadata().get("speakers"));
            String text = doc.getText();
            assertNotNull(text);
            assertFalse(text.isBlank());
        }
    }
}
