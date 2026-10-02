# Phase 13B Implementation Plan: User Persistence + Password Hashing

## 1. Create User Module (`com.meetingmind.user`)
Create a new feature package for user-related functionality.

### 1.1 `User` Entity
Location: `com.meetingmind.user.entity.User`
- **Fields:**
  - `Long id` (Primary Key, GeneratedValue)
  - `String username` (Unique constraint, non-null)
  - `String passwordHash` (non-null)
  - `LocalDateTime createdAt` (Auditing/Timestamp)
- Keep Spring Security dependencies decoupled from this entity.

### 1.2 `UserRepository`
Location: `com.meetingmind.user.repository.UserRepository`
- Extend `JpaRepository<User, Long>`
- Add `Optional<User> findByUsername(String username)`

### 1.3 `UserService`
Location: `com.meetingmind.user.service.UserService`
- Dependencies: `UserRepository`, `PasswordEncoder`
- Method: `User createUser(String username, String rawPassword)`
  - Encodes the raw password using `passwordEncoder.encode()`
  - Saves the new user to the repository
  - Never persists the raw password

## 2. Spring Security Integration

### 2.1 `CustomUserDetailsService`
Location: `com.meetingmind.user.security.CustomUserDetailsService`
- Implement `org.springframework.security.core.userdetails.UserDetailsService`
- Dependencies: `UserRepository`
- Override `loadUserByUsername(String username)`:
  - Call `userRepository.findByUsername(username)`
  - If empty, throw `UsernameNotFoundException`
  - Map the `User` entity to Spring Security's `UserDetails` using `org.springframework.security.core.userdetails.User.builder()`
  - Set username, password (which is the hashed password), and empty authorities.

### 2.2 Update `SecurityConfig`
Location: `com.meetingmind.config.SecurityConfig`
- Remove the `InMemoryUserDetailsManager` `@Bean`.
- Ensure `PasswordEncoder` bean (`BCryptPasswordEncoder`) remains.
- Spring Security automatically detects the `CustomUserDetailsService` (as long as it's a Spring `@Service`), but it can also be explicitly declared or injected if preferred. We'll simply let it be discovered or declare it explicitly as the `UserDetailsService` bean.

## 3. Database Schema
- The project is using `spring.jpa.hibernate.ddl-auto: update` (per `application.yml`).
- Hibernate will automatically create the `user` table (we'll name it `users` to avoid SQL reserved keyword issues, via `@Table(name = "users")`).
- The `username` column will be generated with a unique constraint.

## 4. Initialization (Bootstrap)
Location: `com.meetingmind.user.component.DataInitializer` (or similar, if one exists)
- Create a `CommandLineRunner` or `@EventListener(ApplicationReadyEvent.class)` bean to bootstrap a default dev user if none exists.
- Call `userService.createUser("devuser", "devpassword")` to ensure a testable database-backed user is present, replacing the in-memory dev user.

## 5. Testing

### 5.1 Security Integration Tests
Location: `src/test/java/com/meetingmind/security/SecurityIntegrationTest.java` (or equivalent)
- Use `@SpringBootTest` and `@AutoConfigureMockMvc`.
- **Do not use `@WithMockUser` for these tests**.
- Tests:
  - `testHealthEndpoint_IsPublic()`: GET `/api/health` expects 200 OK without credentials.
  - `testProtectedEndpoint_WithoutCredentials_Returns401()`: GET `/api/meetings` expects 401.
  - `testProtectedEndpoint_WithValidDatabaseCredentials_Returns200()`: Use `httpBasic("devuser", "devpassword")` and verify access.
  - `testProtectedEndpoint_WithInvalidPassword_Returns401()`
  - `testProtectedEndpoint_WithNonexistentUser_Returns401()`

### 5.2 Persistence & Service Tests
- `UserRepositoryTest` (`@DataJpaTest`): Verify finding user by username and uniqueness constraints.
- `UserServiceTest`: Verify `createUser` calls `PasswordEncoder` and never persists raw passwords.

## 6. Existing Functionality
- `SecurityConfig` URL matchers will remain untouched (e.g., `/api/health`, `/api/auth/**`, `/sse`, etc.).
- Authentication mechanism remains HTTP Basic.
- No JWT or registration APIs will be added yet.

## 7. Documentation
Update `docs/development/walkthrough.md` (or relevant document) with concepts of:
- `UserDetailsService` and `UserDetails`
- BCrypt password hashing vs encryption
- Authentication flow with PostgreSQL
- Separation of concerns between JPA `User` entity and Spring Security's `UserDetails`
- Preparation for future phases (Login, JWT)
