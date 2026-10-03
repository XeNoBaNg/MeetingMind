# Phase 13D - JWT Stateless Authentication Implementation Plan

## 1. Dependencies (`pom.xml`)
Add the `jjwt` library dependencies to handle JWT creation and validation safely:
*   `jjwt-api`
*   `jjwt-impl` (runtime)
*   `jjwt-jackson` (runtime)

## 2. Configuration Properties (`application.yml`)
Add configuration properties for JWT. The secret will be fetched from an environment variable (or a default for local dev to avoid hardcoding in Java source):
```yaml
meetingmind:
  security:
    jwt:
      secret: ${JWT_SECRET:default_development_secret_key_needs_to_be_long_enough}
      expiration-ms: 86400000 # 24 hours
```

## 3. JWT Service (`JwtService.java`)
Create a new `JwtService` in `com.meetingmind.auth.security` (or similar package) to handle token operations:
*   **`generateToken(UserDetails userDetails)`**: Generates a signed JWT with `subject` (username), `issuedAt`, and `expiration`. No sensitive claims like password hashes.
*   **`extractUsername(String token)`**: Parses the token and extracts the subject.
*   **`isTokenValid(String token, UserDetails userDetails)`**: Validates that the token signature is correct, it has not expired, and the subject matches the user.
*   *Note on Structure & Signing*: The JWT will be structured as `header.payload.signature`. It will be *signed* (using HMAC-SHA) to guarantee authenticity and integrity, but not *encrypted*, meaning its payload can be decoded by anyone but tampered with by no one.

## 4. DTO Updates (`LoginResponse.java`)
Update `LoginResponse` to include the generated token:
*   Add `private String token;`
*   Keep existing safe properties (`id`, `username`, `message`).

## 5. Controller Updates (`AuthController.java`)
Update `AuthController.login`:
*   After successful `AuthenticationManager.authenticate(...)`, fetch `UserDetails`.
*   Call `jwtService.generateToken(userDetails)` to produce the JWT.
*   Return the token inside `LoginResponse`.

## 6. JWT Authentication Filter (`JwtAuthenticationFilter.java`)
Create a new component extending `OncePerRequestFilter`:
*   **Purpose**: Runs exactly once per HTTP request to intercept requests, extract the JWT, and establish the `SecurityContext` if valid.
*   **Flow**:
    1. Extract `Authorization` header. Check if it starts with `Bearer `.
    2. Extract the token string.
    3. Extract the `username` using `JwtService`.
    4. If the username is present and `SecurityContextHolder.getContext().getAuthentication() == null` (not yet authenticated):
        *   Load `UserDetails` via `CustomUserDetailsService`.
        *   Validate the token using `JwtService`.
        *   If valid, create a `UsernamePasswordAuthenticationToken`.
        *   Populate `SecurityContextHolder.getContext().setAuthentication(...)`.
    5. Call `filterChain.doFilter(...)` to continue processing.

## 7. Security Configuration (`SecurityConfig.java`)
Update `SecurityConfig`:
*   **Stateless Sessions**: Configure `SessionCreationPolicy.STATELESS` so Spring Security does not create HTTP sessions. Authentication will rely entirely on the provided token per request.
*   **Filter Ordering**: Inject `JwtAuthenticationFilter` and add it using `.addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)`. This ensures our JWT filter runs before Spring's default username/password filter.
*   **Remove HTTP Basic**: Since JWT is replacing it, `.httpBasic()` will be removed (or kept optionally if explicitly required alongside JWT, but the goal is to replace it).
*   **Endpoint Security**: Keep `/api/auth/register`, `/api/auth/login`, and `/api/health` public. All other endpoints remain protected.

## 8. Testing (`JwtIntegrationTest.java`)
Create or update integration tests to cover the stateless JWT flow:
*   Login returns a valid JWT (200 OK).
*   Valid JWT allows access to a protected endpoint (e.g., `/api/meetings` returns 200/404 depending on data, not 401).
*   Missing JWT returns 401 Unauthorized.
*   Invalid/Malformed JWT returns 401 Unauthorized.
*   Expired JWT returns 401 Unauthorized (by mocking expiration or generating an expired token).
*   Password hash never appears in responses.

## 9. Educational Explanations (For Walkthrough)
I will also add documentation to `walkthrough.md` explaining:
1. **JWT Structure**: Three parts: Base64Url encoded `header` (alg/typ), `payload` (claims), and `signature`.
2. **Signing vs Encryption**: Signing ensures integrity and non-repudiation; anyone can read the claims, but only the server can verify they haven't been altered. Encryption hides the data, which is not what standard JWT does.
3. **Stateless Authentication**: No session state is kept on the server (no JSESSIONID). Every request must carry its own proof of identity (the token).
4. **OncePerRequestFilter**: Guarantees the token validation logic is executed exactly once per incoming request dispatch.
5. **SecurityContextHolder**: The thread-local storage where Spring Security stores the `Authentication` object representing the current authenticated user for the duration of the request.
6. **Filter Ordering**: The JWT filter runs before `UsernamePasswordAuthenticationFilter` to preemptively authenticate the user via the token before Spring attempts to parse (non-existent) form-login credentials or fails the request.
7. **Token Expiration & Storage Implications**: Expiration limits the window of opportunity if a token is stolen. Clients must securely store tokens (e.g., in memory or HttpOnly cookies for web, secure storage for mobile) because stateless tokens cannot easily be individually revoked before expiration.

**No code will be modified until you review and approve this plan.**
