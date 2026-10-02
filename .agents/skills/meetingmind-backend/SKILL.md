---
name: meetingmind-backend
description: >-
  Implementation guide and conventions for the Spring Boot backend in MeetingMind.
  Use when developing, modifying, or testing REST controllers, application and domain services,
  Spring Data JPA repositories, entities, DTOs, transaction management, and error handling.
---

# MeetingMind Backend Implementation Guide

This skill defines the development standards, layering conventions, and domain boundaries for the Spring Boot backend in MeetingMind.

---

## 1. Package-by-Feature Structure

The backend organizes code strictly by feature modules rather than global technical layers.

```text
com.meetingmind/
  ├── config/                     # Global Spring configurations (Security, CORS, Jackson)
  ├── common/                     # Cross-cutting foundational utilities
  │     ├── exception/            # Global exceptions & @RestControllerAdvice handler
  │     ├── response/             # Standard API response envelope (ApiResponse<T>)
  │     └── validation/           # Custom validation constraints
  ├── meeting/                    # Meeting lifecycle domain
  │     ├── controller/           # Thin REST controllers
  │     ├── service/              # Domain & application service logic
  │     ├── repository/           # Spring Data JPA repositories
  │     ├── entity/               # JPA entities
  │     └── dto/                  # Request/response records
  ├── actionitem/                 # Deliverables and task tracking domain
  │     ├── controller/
  │     ├── service/
  │     ├── repository/
  │     ├── entity/
  │     └── dto/
  ├── email/                      # Generated follow-up drafts domain
  │     ├── controller/
  │     ├── service/
  │     ├── repository/
  │     ├── entity/
  │     └── dto/
  ├── ai/                         # Multi-agent LLM pipeline
  ├── rag/                        # Future: Semantic search & retrieval
  └── mcp/                        # Future: Model Context Protocol tools
```

**Rule**: Never create a top-level `com.meetingmind.controllers` or `com.meetingmind.services` package. Each domain owns its full vertical stack.

---

## 2. Layering & Dependency Flow

Dependencies must flow inward and downward in a strict single direction:

```text
[ REST Controller ]  or  [ MCP Tool ]
           │
           ▼
[ Application / Domain Service Layer ]
           │
           ▼
     [ Repository ]
           │
           ▼
  [ PostgreSQL Database ]
```

### Layer Rules
1. **Controllers**:
   - Must remain **thin**.
   - Responsible only for HTTP status codes, request validation (`@Valid`), and invoking services.
   - Must return typed DTOs/records, never raw JPA entities.
2. **Services**:
   - Contain all business logic, workflow orchestration, and domain rules.
   - Demarcate transactions using Spring's `@Transactional`.
   - Act as reusable entry points for REST controllers, MCP tools, and orchestrator callbacks.
3. **Repositories**:
   - Spring Data JPA interfaces extending `JpaRepository<T, UUID/Long>`.
   - Never write direct SQL queries in controllers or MCP handlers.

---

## 3. Domain Modules Detail

### 3.1 Meeting Module (`meeting/`)
- **Core Entity**: `Meeting` (UUID id, title, transcript, meetingDate, createdAt, status).
- **AI Entities**: `MeetingSummary` and `MeetingReview` (persists outputs from the AI pipeline, kept separate from AI DTOs).
- **Status Mapping**: Status uses granular states: `ANALYZING`, `SUMMARIZING`, `EXTRACTING`, `DRAFTING`, `REVIEWING`, `COMPLETED`, `FAILED`.
- **Responsibilities**:
  - Ingest raw transcripts.
  - Manage meeting metadata and participants.
  - Coordinate with `ai` module to trigger meeting analysis.
- **DTOs**: `CreateMeetingRequest`, `MeetingResponse`, `MeetingDetailResponse`.

### 3.2 Action Item Module (`actionitem/`)
- **Core Entity**: `ActionItem` (UUID id, meetingId, description, assignee, dueDate, status).
- **Status Model**:
  ```java
  public enum ActionItemStatus {
      OPEN,
      DONE
  }
  ```
- **Responsibilities**:
  - Bulk persist extracted items from the analysis pipeline.
  - Update status (`OPEN` ➔ `DONE`).
  - Query deliverables filtered by status, assignee, or meeting.
  - Provide workload aggregations per team member.

### 3.3 Email Module (`email/`)
- **Core Entity**: `EmailDraft` (UUID id, meetingId, subject, body, recipientSuggestions, reviewed, createdAt).
- **Responsibilities**:
  - Persist generated follow-up drafts.
  - Allow users to retrieve, edit, and mark drafts as reviewed.
- **Critical Boundary Rule**: The `email` module **must not** directly invoke LLM APIs. Drafts are produced by the `ai` module and handed to `EmailService` for persistence.

---

## 4. Entity Modeling & Persistence Standards

### 4.1 JPA Entity Conventions
- Use standard audit columns where applicable (`createdAt`, `updatedAt`).
- Use appropriate ID strategies (e.g., `UUID` or `Long` with sequence).
- Avoid bidirectional relationships with cascade-all unless strictly necessary to avoid cyclic serialization and lazy-loading issues.

### 4.2 Transaction Management
- Apply `@Transactional(readOnly = true)` at the class level for read-heavy services.
- Annotate write methods with `@Transactional` to enforce atomic state changes.
- Do not keep database transactions open across external LLM network calls. Complete LLM calls in the AI pipeline before initiating database transactions. The `MeetingOrchestrator` must be executed asynchronously (e.g., via `@Async`) so it does not block the HTTP thread.

---

## 5. REST API Standards & Error Handling

### 5.1 Standard Response Envelope
All controller endpoints return a standardized `ApiResponse<T>`:

```java
public record ApiResponse<T>(
    boolean success,
    String message,
    T data,
    Instant timestamp
) {
    public static <T> ApiResponse<T> ok(T data) {
        return new ApiResponse<>(true, "Operation successful", data, Instant.now());
    }

    public static <T> ApiResponse<T> error(String message) {
        return new ApiResponse<>(false, message, null, Instant.now());
    }
}
```

### 5.2 Global Exception Handling (`common/exception/`)
- Centralized via `@RestControllerAdvice`.
- Domain exceptions:
  - `ResourceNotFoundException` ➔ `404 NOT FOUND`
  - `InvalidInputException` / `MethodArgumentNotValidException` ➔ `400 BAD REQUEST`
  - `BusinessRuleException` ➔ `422 UNPROCESSABLE ENTITY`
  - `AiPipelineException` ➔ `502 BAD GATEWAY` or `500 INTERNAL SERVER ERROR`

---

## 6. Cross-Module Interaction Guidelines

1. **No Circular Dependencies**: A module must never have bidirectional dependencies on another module (`meeting` ➔ `email` and `email` ➔ `meeting`).
2. **Service Delegation**: When `MeetingService` needs to create action items or drafts post-analysis, it calls `ActionItemService` or `EmailService` through clear service interfaces.
3. **DTO Decoupling**: Modules exchange immutable records/DTOs rather than sharing detached JPA entities.

---

## 7. Configuration & Environment Management

All configurations must reference environment variables with sane local defaults for development:

```yaml
# application.yml
spring:
  datasource:
    url: ${DATABASE_URL:jdbc:postgresql://localhost:5432/meetingmind}
    username: ${DATABASE_USERNAME:meetingmind}
    password: ${DATABASE_PASSWORD:meetingmind}
  jpa:
    hibernate:
      ddl-auto: validate
    open-in-view: false
```

- **Open-Session-In-View (OSIV)**: Must be set to `false` (`spring.jpa.open-in-view=false`) to ensure clean transaction boundaries and avoid hidden queries in controller views.
- **Secrets**: Never commit passwords, tokens, or credentials into repository files.

---

## 8. Verification Checklist

Before completing backend implementations:
- [ ] Is the code placed in a feature package (`meeting`, `actionitem`, `email`) rather than a global layer?
- [ ] Are controller endpoints returning `ApiResponse<T>` with typed DTOs?
- [ ] Is business logic contained in services, leaving controllers thin?
- [ ] Is `open-in-view` disabled?
- [ ] Are LLM network calls executed outside database transactions?
- [ ] Do MCP tools and controllers reuse the same service methods?
