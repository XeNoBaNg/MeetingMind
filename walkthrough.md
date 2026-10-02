# Phase 12: Real-Time Meeting Updates with Server-Sent Events (SSE)

## Overview

In Phase 12, we replaced the MeetingDetails polling mechanism with Server-Sent Events (SSE). Previously, the frontend issued an HTTP GET request every 2 seconds to check if the meeting analysis had progressed. Now, the backend pushes updates to the frontend exactly when the status changes.

## What is SSE?

Server-Sent Events (SSE) is a standard allowing a browser to receive automatic updates from a server via an HTTP connection. It is:
- **Unidirectional**: Server pushes data to the client.
- **Text-based**: Uses the `text/event-stream` content type.
- **Built-in**: Natively supported by the browser's `EventSource` API.

### SSE vs HTTP Polling

- **Polling**: Client repeatedly asks "Are we there yet?" This wastes bandwidth, increases server load, and introduces latency (up to the polling interval).
- **SSE**: Client opens a single connection. The server pushes updates as they happen. Zero wasted requests and immediate updates.

### SSE vs WebSockets

- **WebSockets**: Bi-directional, full-duplex communication over a custom protocol. Better for chat apps, multiplayer games, or collaborative editing.
- **SSE**: Unidirectional (server-to-client) over standard HTTP. Better for notifications, progress updates, or live feeds. It integrates seamlessly with existing HTTP infrastructure (load balancers, firewalls, etc.) without requiring protocol upgrades.

## Architecture and Responsibilities

MeetingMind maintains a strict separation of concerns:

- **Kafka**: Responsible for asynchronous, durable, distributed processing of meeting analysis tasks. It means "process this meeting".
- **SSE**: Responsible solely for notifying the connected browser of processing state changes. It means "tell the browser what is happening".

By keeping Kafka decoupled from SSE, we ensure our backend processing pipeline remains independent of web presentation concerns. If no one is watching the meeting, Kafka still processes it.

### Why REST + React Query is Retained

We only use SSE for **status change notifications**, not for sending the full `MeetingDetailDto`.
When a status change is received via SSE, we instruct React Query to invalidate its cache for that meeting. React Query then automatically fetches the latest data via standard REST.

This approach keeps our architecture simple:
- REST APIs remain the single source of truth for complex data structures.
- We avoid duplicating serialization/deserialization logic for SSE payloads.
- React Query's excellent caching and deduplication mechanisms remain intact.

## Implementation Details

### Backend

1. **Events**: When `MeetingService.updateStatus()` is called, it persists the new status to the database and publishes a Spring `MeetingStatusChangedEvent`.
2. **MeetingSseService**: Listens to the `MeetingStatusChangedEvent`. It maintains a thread-safe `ConcurrentHashMap` mapping `UUID` (meetingId) to a `Set<SseEmitter>`. When an event occurs, it broadcasts a lightweight JSON payload to all emitters associated with that meeting.
3. **Endpoint**: `GET /api/meetings/{meetingId}/events` returns an `SseEmitter` which keeps the HTTP connection open.
4. **Heartbeat**: To prevent reverse proxies (or load balancers) from silently dropping idle connections, a `@Scheduled` task sends an SSE comment (`: keep-alive`) every 15 seconds.
5. **Lifecycle Management**: The service registers callbacks for `onCompletion`, `onTimeout`, and `onError` to clean up disconnected clients. When a meeting reaches `COMPLETED` or `FAILED`, the server sends the final event and actively closes the emitters.

### Frontend

The `MeetingDetails` component uses a `useEffect` hook to manage the `EventSource` lifecycle:
- It only establishes the connection if the meeting is currently active (`ANALYZING`, `SUMMARIZING`, etc.).
- It listens for `status` events, parses the lightweight JSON payload, and calls `queryClient.invalidateQueries()`.
- It explicitly closes the connection when it receives a terminal status or when the component unmounts.

## Limitations and Future Work

The current subscriber registry in `MeetingSseService` is **in-memory**.

**Limitation**: If we horizontally scale the backend to multiple instances (e.g., behind a load balancer), an SSE subscriber might connect to Instance A, while the Kafka consumer updating the status is running on Instance B. Instance B would publish the `MeetingStatusChangedEvent` internally, but Instance A wouldn't know about it, leaving the subscriber hanging.

**Future Solution**: In a multi-instance architecture, the instances need a shared fan-out mechanism. We would introduce Redis Pub/Sub or a dedicated Kafka topic for SSE broadcasting. Instance B would publish the status change to Redis Pub/Sub, and all instances would listen and push to their respective connected clients.

# Phase 13B: User Persistence + Password Hashing

## Overview

In Phase 13B, we transitioned from a temporary in-memory development user to a robust, database-backed authentication system using PostgreSQL and Spring Security.

## What is `UserDetailsService`?

Spring Security's `UserDetailsService` is a core interface that loads user-specific data. We implemented a `CustomUserDetailsService` to connect Spring Security with our database. 

### The Authentication Flow with PostgreSQL
1. The client sends **HTTP Basic credentials** (Username + Password).
2. **Spring Security** extracts these credentials and delegates verification to an Authentication Provider.
3. The provider calls our **`CustomUserDetailsService`** to retrieve the user's data from the database by `username`.
4. The service queries the **`UserRepository`**, hits **PostgreSQL**, and retrieves our JPA **`User` entity**.
5. The JPA entity is mapped into Spring Security's decoupled **`UserDetails`** object.
6. Spring Security uses **BCrypt** to hash the submitted password and compares it to the retrieved `passwordHash`.
7. If they match, a **`SecurityContext`** is established, granting the user access to protected controllers.

## Password Hashing vs. Encryption

- **Encryption** is a two-way function. Data is encrypted using a key, and can be decrypted back to its original plaintext using the same or another key. We do not use encryption for passwords because the application never needs to know the plaintext password.
- **Hashing** (like BCrypt) is a one-way mathematical function. It turns a password into a fixed-length string of characters (the hash). 

**Security Rules Enforced:**
- Passwords are NEVER stored in plaintext. We only store the `passwordHash`.
- Passwords are NEVER logged.
- The `passwordHash` is kept strictly on the backend and is never returned in API DTOs.

## Separation of Concerns: JPA vs. Spring Security

Notice that we did not force our JPA `User` entity to implement Spring Security's `UserDetails` interface. Instead, we map our `User` entity into Spring Security's provided `org.springframework.security.core.userdetails.User` object within the `UserDetailsService`.
This prevents our domain models from being polluted with framework-specific security logic.

## Configurable Bootstrap User

To avoid hardcoding credentials directly into Java code, we introduced a configurable `DataInitializer`. The development bootstrap user can be enabled and configured entirely via `application.yml`:
```yaml
meetingmind:
  security:
    bootstrap-user:
      enabled: true
      username: devuser
      password: devpassword
```
The initializer safely checks if the username already exists and only then persists the user using BCrypt hashing. This keeps our authentication flow secure and prepares us for future phases (Login, Registration, and JWTs) without leaving production credentials hardcoded.
