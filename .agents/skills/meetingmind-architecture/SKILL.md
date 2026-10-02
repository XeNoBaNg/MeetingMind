---
name: meetingmind-architecture
description: >-
  Architectural blueprint and reference guide for MeetingMind. Use this skill whenever
  planning, designing, reviewing, or implementing any module, service boundary, or workflow.
  Enforces the modular monolith pattern, phased development progression, package-by-feature
  organization, dependency rules, cost constraints, and anti-pattern prevention.
---

# MeetingMind Architecture Guide

MeetingMind is an AI-powered meeting intelligence platform that ingests raw meeting transcripts and processes them through a deterministic, multi-agent pipeline to generate concise summaries, structured action items, follow-up emails, and verification results.

This skill serves as the foundational architectural contract for the entire repository.

---

## 1. High-Level Architecture

MeetingMind follows a **modular monolith** design where all capabilities reside in a single Spring Boot application with strictly isolated domains.

```text
React UI (TypeScript & Vite)
           │
           │ REST API
           ▼
Spring Boot Backend (Modular Monolith)
  ├── REST Controllers (Transport & Request Handling)
  ├── AI Orchestrator (Deterministic Pipeline Sequencing)
  ├── Application & Domain Services (Business Logic & Transactions)
  ├── MCP Server (Tool Exposure for External Clients)
  ├── Repositories (Spring Data JPA)
  └── Database (PostgreSQL + pgvector for Future RAG)
```

---

## 2. Incremental Phased Development Order

Development **must** strictly proceed one phase at a time. Never implement, configure, or introduce concepts from future phases ahead of time.

| Phase | Focus | Scope & Boundaries |
| :--- | :--- | :--- |
| **Phase 0** | Repository Structure & Infra | Scaffolding, agent skills, Docker compose, base configs. |
| **Phase 1** | Single AI Agent | Spring AI connection to Grok/xAI, simple summarizer call. |
| **Phase 2** | Four-Agent Pipeline | Full sequential orchestrator: Summarizer ➔ Extractor ➔ Drafter ➔ Reviewer. |
| **Phase 3** | Persistence Layer | PostgreSQL, JPA entities, repositories, migrations for meetings, actions, drafts. |
| **Phase 4** | Frontend Application | React + Vite UI, dashboard, meeting analysis view, action-item tracking. |
| **Phase 5** | Action-Item Tracking | Status management (`OPEN`/`DONE`), assignee views, workload analytics. |
| **Phase 6** | MCP Server | Expose MeetingMind services as MCP tools (`list_meetings`, `list_action_items`, etc.). |
| **Phase 7** | RAG Integration | Transcript chunking, vector embeddings, similarity search across historical meetings. (UI placeholder in Phase 4 frontend). |
| **Phase 8** | MCP Client | Drafter integration with external calendar/scheduling MCP servers. |
| **Phase 9** | Evaluation & Polish | Pipeline evaluation, latency/token optimizations, end-to-end polish. |

---

## 3. Modular Monolith & Backend Package Structure

The backend organizes code **by feature**, never by architectural layer across the entire application.

```text
backend/src/main/java/com/meetingmind/
  ├── config/                     # Cross-cutting Spring configurations
  ├── common/                     # Shared exceptions, responses, validation utilities
  │     ├── exception/
  │     ├── response/
  │     └── validation/
  ├── meeting/                    # Meeting lifecycle domain
  │     ├── controller/
  │     ├── service/
  │     ├── repository/
  │     ├── entity/
  │     └── dto/
  ├── actionitem/                 # Action items & workload domain
  │     ├── controller/
  │     ├── service/
  │     ├── repository/
  │     ├── entity/
  │     └── dto/
  ├── email/                      # Draft follow-up emails domain
  │     ├── controller/
  │     ├── service/
  │     ├── repository/
  │     ├── entity/
  │     └── dto/
  ├── ai/                         # Multi-agent LLM pipeline
  │     ├── agent/
  │     │     ├── summarizer/
  │     │     ├── extractor/
  │     │     ├── drafter/
  │     │     └── reviewer/
  │     ├── orchestrator/
  │     ├── prompt/
  │     ├── model/
  │     └── config/
  ├── rag/                        # Future: RAG & historical search
  │     ├── chunking/
  │     ├── embedding/
  │     ├── retrieval/
  │     ├── service/
  │     └── model/
  └── mcp/                        # Future: Model Context Protocol integration
        ├── server/
        ├── tools/
        ├── resources/
        └── config/
```

---

## 4. Module Responsibilities & Service Boundaries

### Module Rules
1. **`meeting`**: Central domain entity. Manages transcript ingestion, meeting metadata, title, participants, and lifecycle state.
2. **`actionitem`**: Tracks discrete deliverables extracted from meetings. Owns status changes (`OPEN`, `DONE`), assignees, due dates, and workload queries.
3. **`email`**: Stores generated follow-up drafts and review state. **Rule:** Must never call LLM services directly; drafts are produced via the `ai` module.
4. **`ai`**: Contains agents and orchestrator. Isolated from persistence entities—operates on DTOs and strongly typed payload contracts.
5. **`mcp`**: Exposes system capabilities as MCP tools to external clients. **Rule:** Must call application/domain services, never repositories or SQL directly.
6. **`rag`**: Future module for cross-meeting semantic search. Distinct from standard transcript chunking.

### Dependency Direction (Strict Flow)
```text
[ REST Controller ]  or  [ MCP Tool ]
           │
           ▼
[ Application / Domain Service ]
           │
           ▼
     [ Repository ]
           │
           ▼
     [ PostgreSQL ]
```

---

## 5. Multi-Agent Pipeline & Orchestration Principles

```text
Raw Transcript
      │
      ▼
┌───────────────────────────────────────┐
│          MeetingOrchestrator          │
│                                       │
│  1. SummarizerAgent                   │
│     Transcript ➔ Summary             │
│                                       │
│  2. ExtractorAgent                    │
│     Transcript + Summary ➔ ActionItems│
│                                       │
│  3. DrafterAgent                      │
│     Summary + ActionItems ➔ DraftEmail│
│                                       │
│  4. ReviewerAgent                     │
│     Transcript + Items + Draft ➔ Audit│
└───────────────────────────────────────┘
```

### Orchestration Rules
- **Explicit Deterministic Sequencing**: The Java `MeetingOrchestrator` controls all state and execution order. It must execute asynchronously (e.g., `@Async`) and persist state changes (`SUMMARIZING`, `EXTRACTING`, etc.) to the database, ensuring AI outputs like summaries and reviews are saved.
- **No Direct Agent-to-Agent Chaining**: Agents do not invoke or depend on other agents (`Agent 1 -> Agent 2` is forbidden).
- **Graceful Stage Toggling**: Individual stages must be bypassable/configurable during local testing.

---

## 6. LLM Provider & Cost Governance

- **Zero-Cost Constraint**: The project relies exclusively on free-tier Grok/xAI access or local models. Never import or configure paid endpoints (Anthropic Claude API, OpenAI paid credits, paid vector DBs, paid embeddings).
- **Spring AI Abstraction**: Agents connect via Spring AI's OpenAI-compatible client abstraction targeting the Grok/xAI endpoint. Agents must never couple to vendor-specific SDKs.
- **Configurable & Safe**: API keys and endpoints must be sourced from environment variables (`GROK_API_KEY`, etc.). Never hardcode secrets.

---

## 7. Anti-Patterns & Prohibitions

| Anti-Pattern | Why It Is Forbidden | Correct Approach |
| :--- | :--- | :--- |
| **Global Layer Packages** (`com.meetingmind.controllers`) | Violates modular boundaries; leads to tangled spaghetti code. | Use package-by-feature (`meeting.controller`, `email.controller`). |
| **Fat Controllers** | Mixes transport/HTTP concerns with business logic. | Keep controllers thin; delegate immediately to services. |
| **Direct Repository Access from MCP** | Duplicates validation and business logic. | MCP tools must call application services. |
| **Autonomous Agent Loops** | Causes runaway token usage, infinite loops, and unpredictability. | Deterministic orchestration in Java. |
| **Skipping Phases** | Introduces premature complexity before the foundation is verified. | Follow the phase order strictly. |

---

## 8. Developer & Agent Verification Checklist

Before completing any architecture-related task, verify:
- [ ] Are all classes located inside their feature-specific package?
- [ ] Does any controller contain domain business logic or direct DB access? (Should be NO)
- [ ] Does the change introduce dependencies on future phases? (Should be NO)
- [ ] Are AI workflows decoupled from raw JPA entities? (Should use DTOs/records)
- [ ] Are secrets excluded from git tracking and managed via environment variables?
