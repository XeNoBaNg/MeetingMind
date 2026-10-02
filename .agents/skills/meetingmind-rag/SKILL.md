---
name: meetingmind-rag
description: >-
  Architectural guide and implementation reference for Retrieval-Augmented Generation (RAG)
  in MeetingMind (Phase 7). Use when designing, configuring, or modifying transcript chunking,
  vector embeddings, pgvector storage, similarity retrieval, and historical cross-meeting querying.
---

# MeetingMind RAG Implementation Guide

This skill defines the architecture, data structures, and operational boundaries for Retrieval-Augmented Generation (RAG) across historical meeting records in MeetingMind.

---

## 1. Scope & Core Architectural Distinction

In MeetingMind, **RAG is strictly intended for cross-meeting intelligence and historical querying**, not for standard single-transcript analysis.

```text
┌─────────────────────────────────────────────────────────────┐
│                    Single-Meeting Analysis                  │
│  Raw Transcript ➔ 4-Agent Pipeline ➔ Summary, Items, Draft  │
│  (Does NOT require RAG; processed deterministically in memory)│
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   Historical Cross-Meeting RAG              │
│  "What decisions did we make regarding authentication?"     │
│  Query ➔ Vector Search across all past meetings ➔ Answer    │
└─────────────────────────────────────────────────────────────┘
```

**Rule**: Do not conflate basic transcript token chunking (for long inputs in Phase 1/2) with cross-meeting RAG (Phase 7).

---

## 2. RAG Architecture & Data Pipeline

```text
=== Ingestion & Indexing Pipeline ===
Meeting Transcript
        │
        ▼
[ Token & Speaker Chunking ] ──> Chunk metadata (meetingId, title, date, speaker)
        │
        ▼
[ Embedding Generation ] (Local / Free Model via Spring AI)
        │
        ▼
[ PostgreSQL + pgvector ] (VectorStore table)


=== Retrieval & Query Pipeline ===
User Historical Question
        │
        ▼
[ Query Embedding ]
        │
        ▼
[ Vector Similarity Search ] (pgvector Cosine Distance <->)
        │
        ▼
[ Relevant Historical Chunks + Metadata ]
        │
        ▼
[ Context Assembly & Prompt Construction ]
        │
        ▼
[ LLM Generation (Grok/xAI) ]
        │
        ▼
Synthesized Answer with Meeting Citations
```

---

## 3. Package Structure (`com.meetingmind.rag/`)

```text
backend/src/main/java/com/meetingmind/rag/
  ├── chunking/                   # Text splitting & speaker-aware chunkers
  │     ├── TranscriptChunker.java
  │     └── ChunkingStrategy.java
  ├── embedding/                  # Embedding model integration & configuration
  │     └── EmbeddingConfig.java
  ├── retrieval/                  # Similarity search & metadata filtering
  │     ├── MeetingRetriever.java
  │     └── RetrievalFilter.java
  ├── service/                    # Application service coordinating RAG queries
  │     ├── RagService.java
  │     └── RagServiceImpl.java
  └── model/                      # Records for queries, citations, and chunks
        ├── RagQueryRequest.java
        ├── RagResponse.java
        └── MeetingCitation.java
```

---

## 4. Vector Storage: PostgreSQL + `pgvector`

MeetingMind uses PostgreSQL with the **`pgvector`** extension to store document embeddings within the primary application database, avoiding external vector database operational overhead.

### 4.1 Schema Expectations
Spring AI's `PgVectorStore` manages or integrates with a schema structured around:
- `id`: UUID chunk identifier
- `content`: Extracted text snippet
- `metadata`: JSONB containing `meetingId`, `meetingTitle`, `meetingDate`, `speakers`
- `embedding`: `vector(dim)` representing the semantic dense vector

### 4.2 Indexing Strategy
- Use **HNSW** (`vector_cosine_ops`) or **IVFFlat** indexes for sub-linear similarity search queries:
  ```sql
  CREATE INDEX IF NOT EXISTS meeting_chunks_embedding_hnsw_idx 
  ON vector_store USING hnsw (embedding vector_cosine_ops);
  ```

---

## 5. Chunking Strategy (`rag/chunking/`)

Transcripts differ from standard prose because they contain dialogue turns.
- **Chunk Sizing**: Target 400–800 tokens per chunk with a 10–15% overlap.
- **Dialogue Awareness**: Preserve complete speaker statements where possible to avoid cutting context mid-sentence.
- **Enriched Metadata**: Every chunk must carry metadata tags:
  - `meetingId` (UUID linking back to the `Meeting` entity)
  - `title`
  - `meetingDate`
  - `speaker` (if transcript provides speaker labels)

---

## 6. Embedding Strategy & Cost Constraints

In accordance with MeetingMind's **zero-cost constraint**:
- **Prohibited**: Paid embedding APIs (such as paid OpenAI `text-embedding-3-small`, Cohere, or Voyage AI).
- **Approved Approaches**:
  1. **Spring AI Local Embedding**: Local ONNX embedding models (e.g., `all-MiniLM-L6-v2` run locally on CPU).
  2. **Free-Tier / Local Provider**: Locally hosted Ollama embedding endpoint or free-tier community models.

---

## 7. RAG Service Contract & Integration Boundaries

The RAG module communicates with external callers through a typed service interface:

```java
public interface RagService {
    /**
     * Ingests and indexes all chunks of a completed meeting transcript.
     */
    void indexMeetingTranscript(UUID meetingId, String title, LocalDate meetingDate, String transcript);

    /**
     * Executes semantic search across historical meetings and synthesizes an answer.
     */
    RagResponse queryHistoricalMeetings(RagQueryRequest request);
}
```

### Result Record
```java
public record RagResponse(
    String answer,
    List<MeetingCitation> citations,
    int chunksRetrieved
) {}

public record MeetingCitation(
    UUID meetingId,
    String meetingTitle,
    LocalDate meetingDate,
    String excerpt
) {}
```

---

## 8. Anti-Patterns & Pitfalls

| Anti-Pattern | Why It Fails | Recommended Pattern |
| :--- | :--- | :--- |
| **Paid Vector Clouds** (Pinecone / Weaviate Cloud) | Violates educational/cost constraints; adds external point of failure. | Local PostgreSQL with `pgvector`. |
| **Blocking Transcript Ingestion** | Embedding hundreds of chunks synchronously freezes the user analysis pipeline. | Index transcripts asynchronously via background tasks or post-processing events. |
| **RAG on a Single Transcript** | Single meeting analysis fits in context; RAG introduces loss of complete context. | Send full transcript to Summarizer and Extractor directly; reserve RAG for multi-meeting queries. |
| **Unattributed Answers** | Users cannot verify which past meeting originated a decision or action. | Always include `MeetingCitation` metadata in RAG responses. |

---

## 9. Verification Checklist

When working on the RAG subsystem (Phase 7):
- [ ] Is `pgvector` enabled and running in the PostgreSQL container?
- [ ] Are embeddings generated using free/local models without paid API keys?
- [ ] Do chunks retain `meetingId`, `title`, and `date` metadata?
- [ ] Does `RagResponse` provide citations back to original meetings?
- [ ] Is RAG strictly decoupled from the core 4-agent single-transcript pipeline?
