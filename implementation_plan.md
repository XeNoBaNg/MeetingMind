# Phase 14: Observability Implementation Plan

## 1. Current Observability Gaps
After inspecting the MeetingMind architecture, several critical observability gaps exist:
- **No Structured Logging:** Logs are plain text, making it difficult to search and parse programmatically in production log aggregators.
- **Lost Context:** A logical request (e.g., analyzing a meeting) crosses HTTP boundaries, into a Kafka topic, gets picked up by a consumer, and is processed in an `@Async` thread by the `MeetingOrchestrator`, which then calls multiple AI agents. Currently, logs from the consumer, orchestrator, and individual agents cannot be correlated back to the originating HTTP request.
- **Rudimentary Health Checks:** The custom `HealthController` simply returns `{"status": "UP"}`. It does not verify if PostgreSQL, Redis, or Kafka are actually reachable.
- **Lack of Metrics:** We have no operational metrics into how many meetings are processed, the latency of the multi-agent AI pipeline stages, or failure rates of LLM calls.
- **No Distributed Tracing:** The distributed call graph across HTTP -> Kafka -> Async Orchestrator -> LLM is completely unrepresented.

## 2. Proposed Architecture
We will integrate the standard Spring Boot observability stack using **Micrometer** and **OpenTelemetry**.
- **Logs:** Adopt JSON structured logging using `logstash-logback-encoder` to standardize log output into machine-readable JSON.
- **Traces & Correlation:** Use Micrometer Tracing with OpenTelemetry to generate a distributed `traceId` and `spanId` for every incoming HTTP request. This trace context will be propagated across Kafka message headers and into `@Async` thread executions.
- **Metrics:** Use Micrometer's `MeterRegistry` and Spring's auto-configured binders to expose application and framework metrics over Prometheus format.
- **Actuator:** Replace the custom health endpoint with Spring Boot Actuator, leveraging its built-in infrastructure checks.
- **Tracing Backend:** We will introduce a local Docker-based Zipkin container (`openzipkin/zipkin`) to collect and visualize distributed traces locally.

## 3. Technologies & Dependencies
All observability dependencies will strictly align with Spring Boot 3.3.3 dependency management:
- `org.springframework.boot:spring-boot-starter-actuator`: Core metrics, health probes, and operational endpoints.
- `io.micrometer:micrometer-registry-prometheus`: To expose metrics in Prometheus format at `/actuator/prometheus`.
- `io.micrometer:micrometer-tracing-bridge-otel`: Bridges Spring's `Observation` / `Tracer` API to OpenTelemetry.
- `io.opentelemetry:opentelemetry-exporter-zipkin`: Exports OpenTelemetry spans to the local Zipkin server.
- `io.micrometer:context-propagation`: Facilitates snapshotting and restoring ThreadLocal context (such as trace context) across asynchronous boundaries.
- `net.logstash.logback:logstash-logback-encoder:7.4`: Encodes Logback events into structured JSON format with MDC fields.

## 4. Logging Design
- Provide a `logback-spring.xml` file.
- Configure a console appender that outputs structured JSON in production/standard profile, formatting timestamps, log levels, logger names, messages, and MDC key-values.
- Micrometer Tracing automatically injects `traceId` and `spanId` into SLF4J MDC when a span is active.
- Refactor log statements across `MeetingAnalysisController`, `MeetingAnalysisConsumer`, and `MeetingOrchestrator` to remove ad-hoc formatting and rely on structured context.
- **Strict Privacy Rule:** Absolutely no passwords, JWTs, API keys, raw transcripts, prompts, or LLM-generated texts will be logged.

## 5. Trace ID vs Correlation ID
- Conceptually, **Trace ID** and **Correlation ID** are distinct concepts:
  - A *Correlation ID* is often an application-level identifier passed across services to group logs of a single user action or business transaction.
  - A *Trace ID* is a standard distributed tracing identifier (W3C Trace Context) that uniquely identifies an end-to-end distributed execution tree composed of individual timing spans.
- In MeetingMind, we intentionally **do not** introduce a redundant separate application correlation ID header. The W3C-compliant distributed `traceId` provided by OpenTelemetry/Micrometer Tracing sufficiently satisfies all log correlation and distributed tracing requirements.
- The Logback pattern and JSON provider will extract `traceId` and `spanId` directly from the MDC.

## 6. @Async Context Propagation
- Existing inspection shows `AsyncConfig.java` implements `WebMvcConfigurer` to configure MVC async timeouts (600,000 ms) and customizes Tomcat's connector timeout for SSE/MCP long-lived connections, relying on `@EnableAsync` with Spring's default task executor.
- To preserve existing execution semantics while adding tracing context propagation:
  - We will define a `ThreadPoolTaskExecutor` bean in `AsyncConfig` (preserving generous timeouts and capacity).
  - We will attach a `TaskDecorator` utilizing `ContextSnapshot.capture().setThreadLocalsFrom(...)` (via `io.micrometer:context-propagation`) or Micrometer Tracing's context propagation.
  - This ensures that when `MeetingAnalysisConsumer` invokes `@Async processMeeting(...)`, the active trace context from the Kafka listener thread is seamlessly transferred to the async worker thread.

## 7. Metrics Design & Verification
- **Application Metrics (Custom):**
  - Timers: `meetingmind.ai.agent.duration` (tagged by `agent`: `summarizer`, `extractor`, `drafter`, `reviewer`, and `status`: `success` or `failure`).
  - Timers: `meetingmind.analysis.duration` (total orchestrator pipeline duration).
  - Counters: `meetingmind.analysis.requests` (tagged by `status`: `started`, `completed`, `failed`).
- **Framework & Kafka Metrics:**
  - In Spring Boot 3.3.3 (Spring Kafka 3.2.x), enabling `spring.kafka.template.observation-enabled=true` and `spring.kafka.listener.observation-enabled=true` automatically registers Micrometer observations (`spring.kafka.template` and `spring.kafka.listener` timer metrics with tags for topic, partition, etc.).
  - Furthermore, Spring Boot's `KafkaMetricsAutoConfiguration` automatically binds raw Apache Kafka consumer metrics (including consumer fetch latency and records-lag if exposed by the underlying Kafka client) directly into the `MeterRegistry`.
  - We will rely strictly on these built-in metrics and will **not** build redundant custom Kafka metrics.

## 8. Actuator/Health Design & Security
- Remove the custom `HealthController` at `/api/health`.
- Actuator's `/actuator/health` endpoint will be configured with:
  - `management.endpoint.health.show-details=when-authorized`
  - `management.endpoint.health.probes.enabled=true` (enables `/actuator/health/liveness` and `/actuator/health/readiness`).
- Actuator automatically auto-configures health indicators for PostgreSQL (`db`), Redis (`redis`), and Kafka (`kafka`).
- **Endpoint Exposure & Security:**
  - Only `health` and `prometheus` endpoints will be exposed over the web: `management.endpoints.web.exposure.include=health,prometheus`.
  - In `SecurityConfig.java`:
    - Public access: `/actuator/health/**` (allowing minimal status `UP`/`DOWN` without leaking database URLs or component internals to unauthenticated clients).
    - Protected access: `/actuator/prometheus` and all other actuator paths will require JWT authentication (`.requestMatchers("/actuator/prometheus").authenticated()`).
  - Sensitive management endpoints (`env`, `beans`, `configprops`, `heapdump`) will not be exposed over HTTP.

## 9. AI Tracing (Spans vs Metrics)
- **Metrics vs Tracing Distinction:**
  - Metrics provide aggregated operational values (e.g., P95 latency of the summarizer, error counts).
  - Traces provide the structural causal breakdown of a specific execution.
- We will use Micrometer's `Tracer` / `ObservationRegistry` to create explicit child spans within the pipeline:
  - Parent span: `meeting_analysis` (from Kafka listener into `MeetingOrchestrator`)
    - Child span: `summarizer_agent`
    - Child span: `extractor_agent`
    - Child span: `drafter_agent`
    - Child span: `reviewer_agent`
- **Privacy Rules:** Spans will only record operational metadata as tags (e.g., `agent.name`, `status`, `retry.count`). No transcripts, prompts, or generated outputs will ever be recorded in span tags or log events.

## 10. Local Distributed Tracing Backend (Zipkin)
- We will add the standard Zipkin container to `infrastructure/docker/docker-compose.yml`:
  ```yaml
  zipkin:
    image: openzipkin/zipkin:3.4
    container_name: meetingmind-zipkin
    ports:
      - "9411:9411"
  ```
- Spring Boot will be configured with `management.zipkin.tracing.endpoint: http://localhost:9411/api/v2/spans` and `management.tracing.sampling.probability: 1.0` for local development.

## 11. Testing Strategy
- **`ActuatorSecurityTest`:**
  - Verify `/actuator/health` returns HTTP 200 with minimal payload `{"status":"UP"}` for unauthenticated requests.
  - Verify `/actuator/prometheus` returns HTTP 401 Unauthorized when unauthenticated, and HTTP 200 with Prometheus text output when authenticated with a valid JWT.
- **`ObservabilityIntegrationTest`:**
  - Verify that `MeterRegistry` contains our custom meters (`meetingmind.analysis.requests`, `meetingmind.ai.agent.duration`).
  - Verify that health endpoints function without flakiness. Note: Phase 15 (Testcontainers) will provide isolated, reproducible infrastructure containers. For unit/integration tests without full live clusters, tests will avoid assuming live multi-node broker state.
- **Regression Testing:** Run the entire test suite (`MeetingOwnershipIntegrationTest`, `MeetingCacheIntegrationTest`, `MeetingAnalysisControllerTest`, etc.) to verify zero regressions.

## 12. Documentation Changes
`walkthrough.md` will be updated with:
- Fundamentals: Logs vs Metrics vs Distributed Traces.
- Trace ID vs Correlation ID rationale in MeetingMind.
- Propagation mechanics across HTTP -> Kafka -> Async Orchestrator -> AI Agents.
- Actuator endpoints, health probes (Liveness vs Readiness), and security rules.
- How to start Zipkin via Docker Compose and inspect distributed spans.
- Verification instructions using curl and the application endpoints.

## 13. Step-by-Step Implementation Order
1. **Dependencies:** Update `backend/pom.xml` with Actuator, Micrometer Prometheus, Micrometer Tracing (OTel), Zipkin exporter, Context Propagation, and Logstash Logback encoder.
2. **Infrastructure:** Add Zipkin service to `infrastructure/docker/docker-compose.yml`.
3. **Configuration:** Update `application.yml` with management endpoints, tracing sampling, Zipkin endpoint, Kafka observation, and health settings.
4. **Async Configuration:** Update `AsyncConfig.java` to define a `ThreadPoolTaskExecutor` decorated with context propagation to ensure trace context flows into `@Async` methods.
5. **Security Configuration:** Update `SecurityConfig.java` to allow `/actuator/health/**` publicly while restricting `/actuator/prometheus` and other actuator paths to authenticated requests. Remove `HealthController.java`.
6. **Logging:** Create `src/main/resources/logback-spring.xml` for structured JSON logging with MDC traceId/spanId.
7. **Instrumentation:**
   - Update `MeetingOrchestrator.java` to record `meetingmind.analysis.*` metrics and create child spans (`summarizer_agent`, `extractor_agent`, `drafter_agent`, `reviewer_agent`) using `Tracer` / `ObservationRegistry`.
   - Update `MeetingAnalysisConsumer.java` with structured logging.
8. **Testing:** Write `ActuatorSecurityTest` and `ObservabilityIntegrationTest`. Run entire test suite.
9. **Documentation:** Update `walkthrough.md`.
