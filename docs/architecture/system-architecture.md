# MeetingMind System Architecture

MeetingMind is a modular monolith application designed to process meeting transcripts through a sequential, multi-agent AI pipeline. It features an integrated Retrieval-Augmented Generation (RAG) system for querying historical meetings, and Model Context Protocol (MCP) support for both exposing internal tools to external systems and consuming external tools (like Calendars).

## High-Level Component Diagram

```mermaid
graph TD
    UI[React Frontend (Vite, TS)]
    API[Spring Boot REST API]
    DB[(PostgreSQL + pgvector)]
    AI[Spring AI Orchestrator]
    Agents[Four-Agent Pipeline]
    RAG[RAG Retrieval Engine]
    MCPServer[MCP Server]
    MCPClient[MCP Client]
    ExternalMCP[External Calendar MCP]

    UI --> API
    API --> AI
    API --> RAG
    AI --> Agents
    Agents --> DB
    RAG --> DB
    
    ExternalClient[External MCP Inspector] --> MCPServer
    MCPServer --> API
    
    API --> MCPClient
    MCPClient --> ExternalMCP
```

## Backend Modules (Package-by-Feature)

The application is structured using a package-by-feature pattern, ensuring high cohesion and decoupling of business domains:

1. **`meeting`**: Core domain logic for meetings (upload, metadata, transcript storage).
2. **`actionitem`**: Status tracking and assignment management for parsed tasks.
3. **`email`**: Management of drafted follow-up emails.
4. **`ai`**: The AI Orchestrator and the four distinct agents (Summarizer, Extractor, Drafter, Reviewer).
5. **`rag`**: Document chunking, pgvector embedding, and semantic similarity search over historical meetings.
6. **`mcp`**: Both server capabilities (exposing `list_meetings`, etc.) and client integrations (checking external calendar availability).

## The AI Pipeline (Orchestration)

We use an explicit orchestration pattern rather than a reactive event-driven chain. The `MeetingOrchestrator` controls the sequence, executing the agents sequentially using `@Async` threads to free up the HTTP request thread.

1. **Summarizer Agent**: Condenses transcript into an Executive Summary.
2. **Extractor Agent**: Uses transcript + summary to extract strongly-typed Action Items.
3. **Drafter Agent**: Consumes Summary + Action Items to write an email draft.
4. **Reviewer Agent**: Reviews the draft against the original transcript to detect hallucination or missed tasks.

## RAG Architecture

When a meeting completes, the `TranscriptChunker` chunks the text (typically using a TokenTextSplitter). `VectorStore` (pgvector) embeds and stores these chunks. 
Queries execute a similarity search (`MeetingRetriever`) and feed the top chunks as context to the LLM to provide grounded answers.

## Constraints & Technology

- Developed entirely using local/free API models via OpenAI-compatible endpoints (e.g., Grok, xAI, or local Ollama).
- **PostgreSQL** is the single source of truth for both relational entities (Hibernate) and vector embeddings (pgvector).
- **Frontend** relies on TailwindCSS for premium glassmorphism aesthetics, using standard React Router for navigation.
