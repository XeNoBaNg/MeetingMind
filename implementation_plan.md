# Phase 13E Implementation Plan: Authorization & Meeting Ownership

## 1. User ↔ Meeting Relationship & Data Migration
- **Schema Change**: Introduce a `@ManyToOne(fetch = FetchType.LAZY)` relationship on `Meeting` named `owner` referencing the `User` entity, mapped to `owner_id` column in the `meetings` table.
- **Migration & Legacy Data Strategy**:
  - The column will be added as `nullable = true` (`@JoinColumn(name = "owner_id", nullable = true)`) so existing PostgreSQL records are preserved without breaking Hibernate `ddl-auto: update`.
  - **Inaccessibility of Legacy Data**: Legacy meetings where `owner == null` will remain in the database (not deleted), but will be inaccessible to regular authenticated users because all user queries filter strictly by `owner == authenticatedUser`.
  - Legacy meetings will **not** be silently or arbitrarily backfilled to any user.
  - All new meetings created going forward will strictly require and persist an authenticated `owner`.
  - Re-indexing existing owned meetings: When re-indexing is triggered, only meetings with non-null owners will be indexed with `ownerId` metadata. Legacy unowned meetings will remain unindexed and inaccessible.

## 2. Meeting Creation Authorization
- **Identity Source**: The authenticated identity is obtained server-side from `SecurityContextHolder.getContext().getAuthentication().getName()` (or `@AuthenticationPrincipal UserDetails`).
- **No Client Manipulation**: The `MeetingRequest` DTO will **not** include an `ownerId` or `userId`. Any client-supplied identity will be ignored/disallowed. The server looks up the authenticated `User` from `UserRepository` by username and assigns it as `meeting.setOwner(currentUser)`.

## 3. Meeting Read Authorization (404 Enumeration Protection)
- **404 Not Found over 403 Forbidden**: If a user requests a meeting ID that does not exist or belongs to another user, the API will respond with **404 Not Found** (via `ResourceNotFoundException`). This prevents attackers from enumerating valid meeting UUIDs.
- **Ownership-Aware Repository Queries**:
  - `MeetingRepository.findByIdAndOwner(UUID id, User owner)`
  - `MeetingRepository.findAllByOwnerOrderByCreatedAtDesc(User owner)`
- **User-Facing Service**:
  - `meetingService.getMeetingDetail(id, currentUser)` fetches only if `owner == currentUser`.
  - `meetingService.getAllMeetings(currentUser)` returns only meetings owned by `currentUser`.

## 4. Meeting Mutation Authorization & System vs User Separation
- **Separation of Concerns (User vs System)**:
  - Authorization is **not** designed as "if HTTP request -> check owner, else bypass."
  - **User Operations**: Endpoints called by users require authenticated user context and enforce ownership at the service/repository boundary:
    $$\text{JWT} \longrightarrow \text{Ownership Authorization} \longrightarrow \text{Business Operation}$$
  - **Internal System Operations**: Background tasks (Kafka consumers, `MeetingOrchestrator`) operate as trusted system processes processing an already-authorized pipeline event. System operations (such as `saveSummary`, `saveActionItems`, `saveEmailDraft`, `saveReview`, and updating status during analysis) are explicitly separate service methods reserved for internal system processing:
    $$\text{Kafka Event} \longrightarrow \text{Trusted Internal Processing} \longrightarrow \text{System Operation}$$
  - Ownership enforcement is structural and never depends on whether `SecurityContext` happens to exist.

## 5. Method-Level Security & Roles
- **Enable Method Security**: Add `@EnableMethodSecurity` to `SecurityConfig`.
- **Minimal Authority Model**: Assign `ROLE_USER` as the baseline granted authority in `CustomUserDetailsService` upon authentication.
- **Ownership over Roles**: Avoid scattering `@PreAuthorize("hasRole('USER')")` on every endpoint. Use `@PreAuthorize` selectively only where method-level access guards add clarity, while keeping resource ownership verification authoritative in the domain/repository layer.
  - *Role-based*: "Is the caller an authenticated user?" (e.g. handled by URL filters or baseline checks).
  - *Ownership*: "Does this specific resource belong to this caller?" (handled via `findByIdAndOwner` / explicit user checks).

## 6. Action Items Authorization
- **Hierarchical Ownership Boundary**: Action items belong to a `Meeting`, and the `Meeting` belongs to a `User`.
  $$\text{User} \longrightarrow \text{Meeting} \longrightarrow \text{ActionItem}$$
- **Verification**:
  - `ActionItemController.getAllActionItems(user)` returns action items belonging to meetings owned by `currentUser` (e.g. via `actionItemRepository.findAllByMeetingOwner(currentUser)`).
  - `ActionItemController.updateStatus(id, status, user)` resolves the action item, verifies that `actionItem.getMeeting().getOwner().equals(currentUser)`, and throws a 404/not found if it does not match.
- Action items do not need a redundant direct `User` foreign key; the meeting boundary is the single source of truth.

## 7. Ownership-Aware RAG
- **Authoritative Ownership**: Derived strictly from `Meeting -> owner -> User` during indexing. Never rely on client-supplied user parameters.
- **Enforcement at Service/Retrieval Boundary**:
  - Ownership filtering is enforced at the `RagService` and `MeetingRetriever` boundary, not solely in the controller.
  - `RagService` methods (`searchHistoricalMeetings`, `queryHistoricalMeetings`) take the authenticated user / owner context and mandate owner filtering.
- **Index Tagging**:
  - When a meeting transcript is indexed, attach `ownerId` (the UUID string of the meeting's owner) to each chunk's metadata in `Document`.
  - Re-indexing completed meetings: only owned meetings will be indexed with their `ownerId`. Legacy meetings without an owner are not indexed.
- **Retrieval / Search Filtering**:
  - `MeetingRetriever` strictly applies a vector store filter: `ownerId == currentUserId`.
  - Unowned legacy chunks or chunks from other users will not match the equality filter, guaranteeing strict isolation.

## 8. Ownership-Aware SSE
- **Pre-Connection Validation**:
  - `GET /api/meetings/{id}/events` resolves the authenticated user from the JWT before establishing the connection.
  - Checks `meetingRepository.findByIdAndOwner(id, currentUser)`.
  - If the meeting does not exist or is not owned by the caller, rejects immediately with 404 before calling `meetingSseService.subscribe(id)`.
  - Avoids dangling subscriptions and async authorization leaks.

## 9. MCP (Model Context Protocol) Architecture & System Trust
- **No Identity Spoofing**: Since the current MCP architecture does not propagate JWT identities from a browser, we will **not** invent a fragile identity spoofing mechanism or client-controlled user headers.
- **System-Level Trust & Separation**:
  - MCP operations will be treated explicitly as trusted system-level operations.
  - MCP tools will call dedicated system-level methods (or operate via a dedicated system service path) rather than bypassing ownership inside user-facing service methods.
  - Normal REST, SSE, and RAG services will **not** weaken their ownership checks to accommodate MCP.
  - This limitation and architecture will be explicitly documented.

## 10. API & DTO Safety
- **No Sensitive Leakage**:
  - `ownerUsername` in response DTOs is optional and will not be unnecessarily added unless needed. Password hashes and internal security details are never exposed.
  - `MeetingRequest` and other input DTOs will not accept client-provided owner fields.

## 11. Integration Testing Plan
Add comprehensive integration tests using `@SpringBootTest` + `MockMvc`:
1. **Authentication Gates**:
   - Unauthenticated requests to `/api/meetings`, `/api/action-items`, `/api/rag/**` return `401 Unauthorized`.
2. **Meeting List & Read Isolation**:
   - User A registers & logs in; creates Meeting A.
   - User B registers & logs in; creates Meeting B.
   - **List isolation**:
     - User A `GET /api/meetings` receives ONLY Meeting A.
     - User B `GET /api/meetings` receives ONLY Meeting B.
   - **Read isolation (IDOR protection)**:
     - User A `GET /api/meetings/{meetingA_Id}` returns 200 OK.
     - User A `GET /api/meetings/{meetingB_Id}` returns 404 Not Found.
     - User B `GET /api/meetings/{meetingA_Id}` returns 404 Not Found.
3. **Meeting Mutation IDOR Protection**:
   - Verify every meeting mutation endpoint (e.g., `POST /api/meetings` ignores client owner; `POST /api/rag/index/{meetingId}` returns 404 for another user's meeting; `PATCH /api/action-items/{id}/status` returns 404 for another user's action item).
4. **SSE Authorization**:
   - User A connecting to `/api/meetings/{meetingB_Id}/events` is rejected with 404 prior to streaming.
5. **RAG Service-Boundary Isolation**:
   - User A searching or querying historical meetings only receives citations from Meeting A, never Meeting B.

## 12. Documentation
Update `walkthrough.md` with:
- Authentication vs. Authorization
- Resource Ownership and IDOR prevention
- 404 Not Found vs. 403 Forbidden for resource enumeration prevention
- Role-based vs. Ownership-based authorization
- System Operations (Kafka, MCP) vs. User Operations (REST, SSE, RAG)
- Vector metadata filtering for ownership-aware RAG at the service layer
- SSE pre-connection authorization
- Complete end-to-end authorization flow diagram
