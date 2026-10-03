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

# Phase 13C: Registration + Login API

## Overview

In Phase 13C, we introduced explicit REST API endpoints for user registration and login (`/api/auth/register` and `/api/auth/login`). This step moves us from relying purely on HTTP Basic authentication for testing to a more realistic client-facing authentication flow.

## 1. Registration vs Login Distinction

- **Registration (`POST /api/auth/register`)**: The process of creating a *new identity*. It validates constraints (like password length), checks if the username is taken, hashes the password, and saves the new user to the database.
- **Login (`POST /api/auth/login`)**: The process of *verifying credentials* for an existing identity. It receives a username and password, uses Spring Security to verify them, and issues a successful response if they match.

## 2. AuthenticationManager

The `AuthenticationManager` is the core Spring Security interface for authenticating a user. Instead of manually querying the database and checking passwords in our controller, we delegate the entire process to this manager:
`Authentication result = authenticationManager.authenticate(token);`

## 3. AuthenticationProvider

The `AuthenticationManager` doesn't do the work itself. It delegates to one or more `AuthenticationProvider`s. This architecture allows an application to support multiple authentication methods simultaneously (e.g., username/password, LDAP, OAuth2).

## 4. UsernamePasswordAuthenticationToken

To ask the `AuthenticationManager` to verify credentials, we wrap the incoming username and password into a `UsernamePasswordAuthenticationToken`. This token acts as a request to the provider that handles standard login credentials.

## 5. DaoAuthenticationProvider

For our database-backed approach, we configured a `DaoAuthenticationProvider`. This provider is specifically designed to retrieve user details from a `UserDetailsService` and compare the provided password against a hash using a `PasswordEncoder`. 

The complete architecture we built looks like this:
```text
AuthenticationManager
    ↓
DaoAuthenticationProvider
    ↓
CustomUserDetailsService
    ↓
UserRepository
    ↓
PasswordEncoder
```

## 6. UserDetailsService & 7. PasswordEncoder Integration

The `DaoAuthenticationProvider` links our existing `CustomUserDetailsService` and `BCryptPasswordEncoder` together. When it receives a token, it asks the `UserDetailsService` to find the user by username. It then uses the `PasswordEncoder` to verify if the raw password provided in the token matches the hashed password retrieved from the database.

## 8. Authentication Failure Handling

Security best practices dictate that we should not leak whether an authentication failure was due to an incorrect username or an incorrect password. Doing so allows attackers to perform username enumeration. In `GlobalExceptionHandler`, we explicitly catch `AuthenticationException` and return a generic `401 Unauthorized` with a simple "Invalid username or password" message. 

## 9. Why Login Doesn't Automatically Mean JWT

Often, developers assume that building a login endpoint immediately requires generating a JSON Web Token (JWT). However, a login endpoint fundamentally just verifies identity. After verification, the server can establish a session (using cookies), return a JWT, or just return user details. In Phase 13C, our `/api/auth/login` endpoint only verifies credentials and returns a safe `LoginResponse`. JWT integration is a separate concern reserved for Phase 13D.

## 10. Explicit Login API vs HTTP Basic

- **HTTP Basic**: The client sends a header (`Authorization: Basic base64(user:pass)`) with *every single request*. The server verifies it every time. It is meant for simple, stateless machine-to-machine communication or early development.
- **Explicit Login API**: A dedicated endpoint (`/api/auth/login`) that accepts credentials in a JSON body. It is designed to be called once by a frontend application to establish a long-lived identity mechanism (like a session cookie or a token), allowing subsequent requests to use that token rather than sending passwords continuously.

# Phase 13D: JWT Stateless Authentication

## Overview

In **Phase 13D**, MeetingMind transitioned from HTTP Basic authentication to **stateless JWT (JSON Web Token) Bearer authentication**. This eliminates sending raw user credentials on every request and avoids database queries for user authentication during subsequent API operations.

---

## 1. Key Architectural Concepts

### A. JWT Configuration & Secret Enforcement
- **Strongly Typed Configuration**: Created [JwtProperties](file:///c:/college/Projects/MeetingMind/backend/src/main/java/com/meetingmind/auth/config/JwtProperties.java) annotated with `@ConfigurationProperties(prefix = "meetingmind.security.jwt")`, encapsulating `secret` and `expirationMs`.
- **Fail-Fast Secret Requirement**: The production configuration (`application.yml`) binds `secret: ${JWT_SECRET}` without a fallback default. If `JWT_SECRET` is omitted from the environment, the application fails to start immediately with an explicit configuration error rather than silently defaulting to a known, insecure secret.

### B. HMAC Signing & Integrity vs. Non-Repudiation
- **HMAC Shared Secret Properties**: Tokens are signed using HMAC-SHA256 (`HS256`). HMAC signing provides **token integrity and authenticity** for parties possessing the shared secret. It allows any holder of the secret key to verify that the token was generated by a legitimate party holding the same key and has not been altered in transit.
- **No Non-Repudiation**: HMAC does **not provide non-repudiation** because the secret is symmetric. Any entity possessing the shared secret can both verify and forge signatures. Non-repudiation requires asymmetric cryptography (such as RSA or ECDSA with public/private key pairs).

### C. Encoded vs. Encrypted Payloads
- **Base64URL Encoded, Not Encrypted**: A JWT consists of three parts separated by dots: `Header.Payload.Signature`. The payload is Base64URL-encoded JSON. Anyone who inspects the token can decode and read its claims in plaintext.
- **Minimal Claims**: For security, only non-sensitive claims are included:
  - `sub` (Subject): The user's unique username.
  - `iat` (Issued At): Token creation timestamp.
  - `exp` (Expiration): Token expiry timestamp (24 hours).
  Passwords, password hashes, user emails, or internal identifiers are never stored inside token claims.

### D. Authentication Flow
```text
Client (POST /api/auth/login)
    ↓
AuthenticationManager.authenticate(...)
    ↓
DaoAuthenticationProvider & CustomUserDetailsService (Verifies credentials)
    ↓
JwtService.generateToken(username)
    ↓
LoginResponse { id, username, token, message }
```

### E. Request Validation Flow (`JwtAuthenticationFilter`)
- Extends Spring's `OncePerRequestFilter`.
- Registered **before** `UsernamePasswordAuthenticationFilter` in `SecurityConfig`.
- **Public Endpoint Optimization**: Bypasses token processing entirely for public endpoints (`/api/health`, `/api/auth/**`) via `shouldNotFilter()`.
- **Safe Exception Swallowing**: Catches all token errors (`ExpiredJwtException`, `MalformedJwtException`, `SignatureException`, `UnsupportedJwtException`, `IllegalArgumentException`, `UsernameNotFoundException`). Invalid or expired tokens log a debug message, clear the `SecurityContext`, and do not populate authentication. The request then proceeds to Spring Security's `HttpStatusEntryPoint`, which returns HTTP 401 Unauthorized without leaking internal stack traces or exception details to the client.

### F. Removal of HTTP Basic
- HTTP Basic (`httpBasic()`) was removed from `SecurityFilterChain`.
- Session creation is set to `SessionCreationPolicy.STATELESS`.
- Protected endpoints now strictly require `Authorization: Bearer <token>`.

---

## 2. Browser Token Storage Trade-Offs (Phase 13F Context)

Browser token persistence will be addressed in **Phase 13F**. Storage strategies involve trade-offs:

1. **`localStorage` / `sessionStorage`**:
   - *Advantage*: Immune to CSRF; simple to access in React and attach to outgoing Axios request headers.
   - *Risk*: Vulnerable to Cross-Site Scripting (XSS). Any malicious script injected into the client page can read and exfiltrate the stored token.
2. **`httpOnly`, `Secure`, `SameSite` Cookies**:
   - *Advantage*: Inaccessible to client JavaScript, mitigating token theft via XSS.
   - *Risk*: Vulnerable to Cross-Site Request Forgery (CSRF) unless paired with strict SameSite policies and CSRF validation tokens.
3. **In-Memory Storage (React state) + Refresh Token Cookie**:
   - *Advantage*: Access tokens live only in memory and disappear when tabs close, minimizing XSS exposure while cookie-based refresh tokens silently renew sessions.

