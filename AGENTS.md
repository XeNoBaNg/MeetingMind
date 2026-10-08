# MeetingMind - Project Architecture and Development Instructions

## 1. Project Overview

MeetingMind is an AI-powered meeting intelligence platform.

The application takes a meeting transcript and processes it through a controlled multi-agent pipeline to produce:

1. A concise meeting summary
2. Structured action items
3. A follow-up email draft
4. A reviewer and verification result

The application will later support:

- Persistent meeting history
- Action-item tracking
- Workload analytics
- RAG over historical meetings
- MCP server integration
- MCP client integration with external tools such as calendars

The project is primarily a learning project focused on:

- Java
- Spring Boot
- Spring AI
- LLM orchestration
- Multi-agent architecture
- PostgreSQL
- JPA and Hibernate
- RAG
- MCP
- React
- TypeScript
- Docker

---

## 2. Critical Development Rule

The project MUST be developed incrementally.

Do NOT implement future phases unless explicitly requested.

Development order:

| Phase | Focus |
| --- | --- |
| Phase 0 | Project structure and infrastructure |
| Phase 1 | Single AI agent |
| Phase 2 | Four-agent pipeline |
| Phase 3 | Persistence |
| Phase 4 | Frontend |
| Phase 5 | Action-item tracking |
| Phase 6 | MCP server |
| Phase 7 | RAG |
| Phase 8 | MCP client and external tools |
| Phase 9 | Evaluation and polish |

---

## 3. Current Task

### PHASE 0A - Repository Structure Only

The repository is currently empty.

For this task, ONLY create the directory and file structure described in this document.

Do NOT:

- Initialize Spring Boot
- Initialize React
- Initialize Vite
- Create Maven configuration
- Create npm configuration
- Create application code
- Create controllers
- Create services
- Create repositories
- Create entities
- Create database schemas
- Create AI agents
- Call any LLM
- Implement RAG
- Implement MCP
- Install dependencies
- Run package managers
- Create Docker configuration
- Create environment files containing secrets

The objective is to establish a clean modular architecture before implementation begins.

---

## 4. High-Level Architecture

MeetingMind will follow this architecture:

```text
React UI
TypeScript and Vite
        |
        | REST API
        v
Spring Boot Backend
        |
        +----------------------+----------------------+------------------+
        |                      |                      |                  |
        v                      v                      v                  |
REST Controllers          AI Pipeline             MCP Server             |
        |                      |                      |                  |
        v                      v                      |                  |
Application Services      Orchestrator              |                  |
        |                      |                      |                  |
        |              +-------+-------+-------+      |                  |
        |              |       |       |       |      |                  |
        |              v       v       v       v      |                  |
        |          Summary Extractor Drafter Reviewer |                  |
        |                                              |                  |
        +--------------------------+-------------------+------------------+
                                   |
                                   v
                            Domain Services
                                   |
                                   v
                             Repositories
                                   |
                                   v
                              PostgreSQL
```

The backend must use a modular service-based architecture.

---

## 5. Backend Architecture

The backend will use a package-by-feature and module structure.

Do NOT create one global package containing all controllers, all services, all repositories, and all entities.

Prefer feature modules such as:

```text
meeting/
actionitem/
email/
ai/
mcp/
```

Each feature owns its related code.

The backend should eventually follow this dependency direction:

```text
Controller
  |
  v
Application or Service Layer
  |
  v
Domain Logic
  |
  v
Repository
  |
  v
PostgreSQL
```

AI orchestration must remain separated from ordinary business services.

MCP integration must use existing application and domain services instead of directly accessing repositories or SQL.

---

## 6. Backend Directory Structure

Create the following structure:

```text
backend/
  src/
    main/
      java/
        com/
          meetingmind/
            MeetingMindApplication.java

            config/

            common/
              exception/
              response/
              validation/

            meeting/
              controller/
              service/
              repository/
              entity/
              dto/

            actionitem/
              controller/
              service/
              repository/
              entity/
              dto/

            email/
              controller/
              service/
              repository/
              entity/
              dto/

            ai/
              agent/
                summarizer/
                extractor/
                drafter/
                reviewer/
              orchestrator/
              prompt/
              model/
              config/

            rag/
              chunking/
              embedding/
              retrieval/
              service/
              model/

            mcp/
              server/
              tools/
              resources/
              config/

      resources/
        prompts/
          summarizer/
          extractor/
          drafter/
          reviewer/
        application.yml

    test/
      java/
        com/
          meetingmind/
```

At this stage, these are architectural directories only.

Do not implement their contents.

---

## 7. Backend Module Responsibilities

### meeting/

The `meeting` module is responsible for the meeting lifecycle.

It will eventually contain:

- Meeting entity
- Meeting repository
- Meeting service
- Meeting REST controller
- Meeting DTOs

Meeting is the central domain object.

### actionitem/

The `actionitem` module is responsible for:

- Action-item creation
- Action-item retrieval
- Status management
- Marking items done
- Workload queries

It will eventually support statuses such as:

```text
OPEN
DONE
```

### email/

The `email` module is responsible for:

- Generated follow-up drafts
- Retrieving drafts
- Editing drafts
- Review status

The email module must not directly call an LLM.

AI generation belongs in the `ai` module.

---

## 8. AI Architecture

The AI module is a core part of MeetingMind.

The intended pipeline is:

```text
Raw Transcript
  |
  v
Summarizer Agent
  |
  v
Meeting Summary
  |
  v
Extractor Agent
  |
  v
Structured Action Items
  |
  v
Drafter Agent
  |
  v
Follow-up Email
  |
  v
Reviewer Agent
  |
  v
Review Result
```

There must be four distinct specialized agents.

### Summarizer Agent

Responsibility:

```text
Transcript -> Summary
```

The Summarizer Agent should focus only on understanding and summarizing the meeting.

### Extractor Agent

Responsibility:

```text
Transcript and Summary -> Structured Action Items
```

The output should eventually map to strongly typed Java objects.

Expected action-item information:

- Task or description
- Assignee
- Due date
- Relevant context

### Drafter Agent

Responsibility:

```text
Summary and Action Items -> Follow-up Email
```

The Drafter Agent should use the extracted action items rather than independently inventing tasks.

### Reviewer Agent

Responsibility:

```text
Original Transcript
Action Items
Draft Email
  |
  v
Verification Result
```

The Reviewer Agent should detect:

- Unsupported claims
- Hallucinated tasks
- Incorrect assignees
- Incorrect dates
- Missed action items
- Inconsistencies

---

## 9. Orchestrator

The Orchestrator controls the sequence of all four agents.

Conceptually:

```text
MeetingOrchestrator
  |
  +-> SummarizerAgent
  |
  +-> ExtractorAgent
  |
  +-> DrafterAgent
  |
  +-> ReviewerAgent
```

The Orchestrator owns workflow sequencing.

It must execute asynchronously (e.g., using Spring's `@Async`) to avoid blocking HTTP threads, updating the granular meeting status as it progresses.

Agents must not call one another directly.

Preferred sequence:

```text
Orchestrator
  |
  v
Summarizer Agent
  |
  v
Extractor Agent
  |
  v
Drafter Agent
  |
  v
Reviewer Agent
```

Do not use this pattern:

```text
Agent 1 -> Agent 2 -> Agent 3 -> Agent 4
```

The application must control the orchestration sequence explicitly and deterministically.

---

## 10. LLM Provider

The initial LLM provider is Grok or xAI.

Use its OpenAI-compatible API through Spring AI's supported abstraction.

The application must not tightly couple every agent to Grok-specific implementation details.

Preferred abstraction:

```text
Agent
  |
  v
Spring AI abstraction
  |
  v
OpenAI-compatible client
  |
  v
Grok or xAI
```

The provider must be configurable.

---

## 11. Cost Constraint

MeetingMind is being developed without paid AI subscriptions.

The primary AI provider is the user's available Grok or xAI free-tier access.

Do NOT introduce paid services unless explicitly requested:

- OpenAI APIs
- Anthropic APIs
- Gemini APIs
- Paid embedding APIs
- Paid vector databases
- Paid cloud infrastructure

Prefer free or local alternatives.

Do not assume unlimited model calls.

The planned four-agent pipeline normally requires approximately:

```text
1 Summarizer call
1 Extractor call
1 Drafter call
1 Reviewer call
```

The implementation should eventually allow individual stages to be disabled during development and testing.

---

## 12. RAG Architecture

RAG is a future feature.

Do NOT implement RAG during the initial project structure task.

The future RAG architecture is:

```text
Meeting Transcript
  |
  v
Chunking
  |
  v
Embedding
  |
  v
Vector Storage
  |
  v
Retrieval
  |
  v
Relevant Meeting Chunks
  |
  v
LLM
```

Important distinction:

- Chunking is not RAG.
- Chunking may later be used to handle long transcripts.
- RAG is mainly intended for queries across historical meetings.

Example future query:

```text
What decisions have we made about the authentication system?
```

The intended future flow:

```text
Question
  |
  v
Query Embedding
  |
  v
Vector Similarity Search
  |
  v
Relevant Historical Meeting Chunks
  |
  v
Context
  |
  v
LLM
  |
  v
Answer
```

PostgreSQL with pgvector is the planned direction for vector storage, subject to decisions made during the RAG phase.

---

## 13. MCP Architecture

MCP is a future feature.

MeetingMind will eventually expose an MCP server.

Conceptually:

```text
External MCP Client
  |
  | MCP
  v
MeetingMind MCP Server
  |
  v
MeetingMind Application Services
  |
  v
PostgreSQL
```

Initial planned MCP tools:

- `list_meetings`
- `get_meeting_summary`
- `list_action_items`
- `mark_action_item_done`
- `get_person_workload`

MCP tools must not contain direct SQL or business logic.

Preferred dependency direction:

```text
MCP Tool
  |
  v
Application Service
  |
  v
Repository
  |
  v
Database
```

This allows REST APIs and MCP tools to reuse the same business logic.

---

## 14. Future MCP Client

The project may eventually also act as an MCP client.

Example future flow:

```text
Drafter Agent
  |
  v
MeetingMind MCP Client
  |
  v
External Calendar MCP Server
  |
  v
Calendar
```

The system may eventually check whether a suggested due date or meeting time conflicts with calendar events.

Do not implement this now.

---

## 15. Frontend Architecture

The frontend will eventually use:

- React
- TypeScript
- Vite
- Tailwind CSS
- React Query
- Axios

The frontend should be modular and feature-oriented.

Create this structure:

```text
frontend/
  src/
    assets/

    components/
      common/
      layout/
      meeting/
      actionitem/
      email/
      ai/

    pages/
      dashboard/
      meetings/
      actionitems/
      drafts/
      search/             # Future: RAG querying

    api/
    hooks/
    types/
    utils/
    lib/
    routes/

    App.tsx
```

Do not implement these files yet.

---

## 16. Planned Frontend Pages

The application will eventually contain the following pages.

### Dashboard

The Dashboard will show:

- Recent meetings
- Open action items
- Completed action items
- Workload overview
- Recent drafts

### New Meeting

The user will provide:

- Meeting title
- Participants
- Transcript

The user will then select:

```text
Analyze Meeting
```

### Meeting Details

The Meeting Details page will display:

```text
Meeting
  - Summary
  - Key Decisions
  - Action Items
  - Follow-up Email
  - AI Review
```

### Action Items

The Action Items page will allow users to:

- View open items
- View completed items
- Filter items
- Mark items done
- View assignees
- View due dates

### Search (Future RAG)

Placeholder area for Phase 7 semantic search.

### Drafts

The Drafts page will show generated follow-up emails.

Eventually, users can:

- Preview drafts
- Edit drafts
- Copy drafts
- Mark drafts as reviewed

---

## 17. Repository-Level Directories

Create this root-level structure:

```text
MeetingMind/
  AGENTS.md
  README.md
  .gitignore

  docs/
    architecture/
    ai/
    rag/
    mcp/
    development/

  backend/

  frontend/

  infrastructure/
    docker/

  scripts/
```

Do not populate implementation files yet.

---

## 18. Documentation Structure

Documentation will eventually include:

```text
docs/
  architecture/
    system-architecture.md
    module-boundaries.md

  ai/
    agent-pipeline.md
    prompts.md
    evaluation.md

  rag/
    rag-architecture.md

  mcp/
    mcp-server.md
    mcp-client.md

  development/
    phases.md
    local-development.md
```

Documentation should explain architectural decisions rather than duplicate source code.

During Phase 0A, only create placeholder Markdown files when explicitly useful.

Do not add implementation documentation or prompts.

---

## 19. Infrastructure

Infrastructure will eventually contain local development infrastructure.

Future planned structure:

```text
infrastructure/
  docker/
    docker-compose.yml
```

It will initially be used mainly for PostgreSQL.

A future optional service may be pgAdmin.

Do not create Docker configuration during the current structure-only task.

---

## 20. Configuration and Secrets

Never commit:

- API keys
- Passwords
- Tokens
- Secrets

Future configuration must use environment variables.

Expected environment variable names may include:

```text
GROK_API_KEY
DATABASE_URL
DATABASE_USERNAME
DATABASE_PASSWORD
```

Actual secret values must never be written into source-controlled files.

A future `.env.example` may contain placeholder names only.

Do not create environment files during Phase 0A.

---

## 21. Service Boundaries

Keep responsibilities separated.

Meeting flow:

```text
MeetingController
  |
  v
MeetingService
  |
  v
MeetingRepository
```

AI flow:

```text
MeetingAnalysisController
  |
  v
MeetingOrchestrator
  |
  v
Agents
```

MCP flow:

```text
MCP Tool
  |
  v
MeetingService or ActionItemService
  |
  v
Repository
```

RAG flow:

```text
RAG Controller
  |
  v
RAG Service
  |
  v
Retriever
  |
  v
Vector Repository
```

Do not create circular dependencies between modules.

---

## 22. Architectural Principles

Follow these principles:

| Principle | Description |
| --- | --- |
| Separation of concerns | Each module has one clear responsibility. |
| Thin controllers | Controllers handle HTTP concerns. Business logic belongs in services. |
| Reusable services | REST, MCP, and AI workflows reuse application services where appropriate. |
| Strong typing | Prefer typed DTOs and domain models over unstructured maps where data has a known schema. |
| Explicit orchestration | The Java application controls the AI pipeline. |
| Provider abstraction | Agents must not be tightly coupled to a single LLM provider. |
| No premature complexity | Do not introduce RAG, MCP, event streaming, microservices, or advanced infrastructure before the relevant phase. |
| Local-first development | The full system should be runnable locally. |

---

## 23. Monolith First

MeetingMind must initially be a modular monolith.

Do NOT create separate backend microservices.

The intended architecture is:

```text
Spring Boot Application
  |
  +-> Meeting
  |
  +-> ActionItem
  |
  +-> Email
  |
  +-> AI
  |
  +-> RAG later
  |
  +-> MCP later
```

All modules initially run inside one Spring Boot application.

This keeps development and debugging simple while maintaining clear module boundaries.

---

## 24. Current Task Instructions

For the CURRENT task:

1. Create the repository directory structure.
2. Create the backend directory structure.
3. Create the frontend directory structure.
4. Create the documentation directory structure.
5. Create the infrastructure directory structure.
6. Create placeholder Markdown files only where explicitly useful.
7. Create the root `AGENTS.md` using these instructions.

Do NOT:

- Write application code
- Initialize frameworks
- Install dependencies
- Create Maven files
- Create npm files
- Create Docker files
- Create database schemas
- Create AI prompts
- Create AI agents
- Implement MCP
- Implement RAG
- Run the application

After creating the structure, stop and report exactly what was created.

Do not continue to Phase 0 implementation without explicit instruction.

---

## Instructions for Antigravity

After creating `AGENTS.md`, open it in Antigravity and send the following prompt:

```text
Read the root AGENTS.md completely before doing anything.

We are currently in PHASE 0A - Repository Structure Only.

The repository is intentionally empty.

Your task is ONLY to create the directory and documentation structure specified by AGENTS.md.

Do not write application code.

Do not initialize Spring Boot.

Do not initialize React or Vite.

Do not install dependencies.

Do not create pom.xml.

Do not create package.json.

Do not create Docker configuration.

Do not create database schemas.

Do not implement AI agents.

Do not implement RAG.

Do not implement MCP.

Do not create prompts.

Do not make any API calls.

Do not make architectural changes beyond what is specified in AGENTS.md.

Use a modular monolith and service-based architecture for the backend.

Use a modular feature-oriented architecture for the frontend.

After creating the structure, stop.

Then report:

1. The exact directories created
2. The exact files created
3. Any architectural decision you made
4. Any deviation from AGENTS.md

Do not proceed to implementation.
```

---

## Expected Result

At the end of Phase 0A, the repository should roughly contain:

```text
MeetingMind/
  AGENTS.md
  README.md
  .gitignore

  docs/
    architecture/
    ai/
    rag/
    mcp/
    development/

  backend/
    src/
      main/
        java/
          com/
            meetingmind/
              config/
              common/
              meeting/
              actionitem/
              email/
              ai/
              rag/
              mcp/
        resources/
      test/

  frontend/
    src/
      assets/
      components/
      pages/
      api/
      hooks/
      types/
      utils/
      lib/
      routes/

  infrastructure/
    docker/

  scripts/
```

---

Document Version: 1.0  
Project: MeetingMind  
Current Status: Phase 0A - Repository Structure Only

# Learning Roadmap — Post Phase 9

MeetingMind is a learning-driven engineering project.

The objective is to progressively explore real-world backend,
distributed systems, cloud, DevOps, infrastructure, and advanced
AI engineering concepts.

Do not add technologies merely for the sake of adding them.
Each phase should introduce a meaningful engineering concept,
integrate it into MeetingMind where appropriate, and include
testing and failure analysis.

## Phase 10 — Redis (COMPLETED)
- Redis fundamentals
- Spring Data Redis
- Cache-aside pattern
- TTL (1 hour default configured)
- Cache invalidation (@CacheEvict on mutations)
- RedisCacheManager with JSON serialization
- DTO cache representation to avoid Hibernate proxy issues
- Distributed caching
- Redis failure handling

## Phase 11 — Kafka
- Kafka fundamentals
- Topics, partitions, offsets
  - **Topic**: A logical channel to which events are published (e.g., `meeting-analysis-requests`).
  - **Partition**: Topics are divided into partitions for scalability and parallel processing.
  - **Offset**: A unique sequential ID assigned to each message within a partition.
- Producers and consumers
  - **Producer**: An application that publishes events to a topic (e.g., `MeetingAnalysisController`).
  - **Consumer**: An application that subscribes to a topic to process events (e.g., `MeetingAnalysisConsumer`).
- Consumer groups
  - **Consumer Group**: A group of consumers (e.g., `meetingmind-analysis-group`) that work together to consume a topic. Each partition is consumed by only one consumer in the group, ensuring parallel but exactly-once delivery within the group.
- Spring Kafka
- Async event processing
- Retry and dead-letter topics (DLT)
  - **Retry**: Mechanisms (like `@RetryableTopic`) to automatically re-attempt processing of a failed message for a specified number of times.
  - **DLT**: A Dead Letter Topic (e.g., `meeting-analysis-requests-dlt`) where messages that repeatedly fail are sent so they are not lost, allowing for manual inspection or later reprocessing.

## Phase 12 — WebSockets / SSE (COMPLETED)
- Real-time communication
- Server-Sent Events
- WebSockets
- Spring WebFlux / MVC integration
- Real-time meeting processing updates

## Phase 13 — Spring Security (COMPLETED)
- Authentication
- Authorization
- Password hashing
- JWT
- Roles and permissions
- Securing REST APIs
- Securing MCP endpoints
  - Implemented OAuth 2.0 PKCE flow for MCP clients (Claude Desktop).
  - The `mcp-stdio-server.js` stdio bridge acts as the OAuth client.
  - Generates PKCE `code_challenge` and `code_verifier`.
  - Proxies authentication through the React frontend via `/mcp-connect`.
  - Spring Boot API (`McpAuthController`) associates authorization codes with user accounts and issues long-lived opaque access tokens.
  - The stdio bridge exchanges the auth code for a token via `/api/mcp/token` using its local `code_verifier`.
  - The `.mcp-token` is persisted locally to bypass re-authentication across restarts.
  - Custom `McpAuthenticationFilter` validates opaque tokens in Redis without disrupting stateless JWT sessions.
  - **Limitation**: Claude Desktop operates synchronously, causing timeouts during the manual authorization flow. The bridge returns a text link to the user and requires them to manually retry the request after completing the authorization loop in the browser.

## Phase 14 — Observability
- Structured logging
- Spring Boot Actuator
- Metrics
- Micrometer
- Distributed tracing
- OpenTelemetry
- Correlation IDs
- Health checks

## Phase 15 — Testcontainers
- PostgreSQL Testcontainer
- Redis Testcontainer
- Kafka Testcontainer
- Integration testing against real infrastructure
- Replace excessive mocking where appropriate

## Phase 16 — Docker
- Backend containerization
- Frontend containerization
- Multi-container development
- Docker Compose
- Container networking
- Environment configuration
- Health checks
- Image optimization

## Phase 17 — CI/CD
- GitHub Actions
- Build automation
- Automated tests
- Docker image builds
- Artifact management
- Deployment pipelines
- Environment separation
- Secrets management

## Phase 18 — AWS
### EC2
- Deploy MeetingMind
- Linux server administration
- Process management

### IAM
- Users
- Roles
- Policies
- Least privilege

### VPC
- Subnets
- Route tables
- Internet gateway
- Networking fundamentals

### Security Groups
- Inbound/outbound rules
- Application security

### S3
- Object storage
- Transcript/file storage
- Application integration

### CloudWatch
- Logs
- Metrics
- Alarms
- Application monitoring

## Phase 19 — Kubernetes
- Pods
- Deployments
- Services
- ConfigMaps
- Secrets
- Ingress
- Health probes
- Scaling

## Phase 20 — Infrastructure as Code
- Terraform
- AWS infrastructure provisioning
- State management
- Variables
- Modules
- Reproducible environments

## Phase 21 — Event-Driven Architecture
- Domain events
- Event producers/consumers
- Kafka-based workflows
- Eventual consistency
- Idempotency
- Retry strategies
- Dead-letter handling

## Phase 22 — Workflow Engines
- Long-running workflows
- Durable execution
- State management
- Retry semantics
- Temporal or equivalent workflow engine
- Compare workflow orchestration with Kafka-based events

## Phase 23 — Advanced AI Patterns
- Agentic workflows
- Tool orchestration
- Agent memory
- Long-term memory
- Planning
- Reflection
- Multi-agent patterns
- Advanced RAG
- Hybrid retrieval
- Re-ranking
- Query expansion
- Evaluation frameworks
- AI observability