# MeetingMind 🧠

MeetingMind is an AI-powered meeting intelligence platform built as a Spring Boot modular monolith with a React (Vite + TypeScript) frontend. 

It takes raw meeting transcripts and orchestrates a deterministic multi-agent pipeline to generate summaries, structured action items, drafted follow-up emails, and automated reviews. It also features historical meeting semantic search (RAG) and Model Context Protocol (MCP) integrations.

## 🌟 Key Features

1. **Four-Agent AI Pipeline**:
   - **Summarizer**: Condenses transcript into an executive summary and key decisions.
   - **Extractor**: Uses the transcript and summary to extract strongly-typed action items (Task, Assignee, Due Date).
   - **Drafter**: Consumes the summary and action items to author a professional follow-up email.
   - **Reviewer**: Cross-references the generated email and action items with the original transcript to detect hallucination or missed tasks.

2. **RAG (Retrieval-Augmented Generation)**:
   - Queries historical meeting transcripts stored in **PostgreSQL (pgvector)**.
   - Ask semantic questions like: *"What decisions were made about authentication last week?"*

3. **MCP (Model Context Protocol)**:
   - **MCP Server**: Exposes internal tools (`list_meetings`, `get_meeting_summary`, `list_action_items`) to external systems (e.g., Claude Desktop, Cursor).
   - **MCP Client**: Interacts with external MCP tools (like Calendar servers) to verify availability when drafting follow-ups.

4. **Premium UI/UX**:
   - Built with TailwindCSS and Lucide-React.
   - Features dynamic glassmorphism, responsive data tables, micro-animations, and a Calendar visualization for tasks.

---

## 🏗️ Architecture

```text
React UI (TypeScript + Vite)
        | REST API
        v
Spring Boot Backend (Modular Monolith)
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
                             Repositories
                                   |
                                   v
                              PostgreSQL (pgvector)
```

Read more in our [Architecture Documentation](./docs/architecture/system-architecture.md).

---

## 🚀 Getting Started

### Prerequisites

- Java 21+
- Node.js 18+
- Docker & Docker Compose (for PostgreSQL + pgvector)

### 1. Database Setup

Start the PostgreSQL database with the pgvector extension:

```bash
docker run --name meetingmind-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_USER=postgres -e POSTGRES_DB=meetingmind -p 5432:5432 -d pgvector/pgvector:pg16
```

### 2. Environment Variables

MeetingMind is designed to run without paid AI services by leveraging OpenAI-compatible APIs (like xAI's Grok or local Ollama).

Set the following environment variables (or configure in your IDE runner):

```env
# Backend AI Configuration
SPRING_AI_OPENAI_API_KEY=your_api_key_here
SPRING_AI_OPENAI_BASE_URL=https://api.x.ai/v1
SPRING_AI_OPENAI_CHAT_MODEL=grok-beta
```

### 3. Running the Backend

Navigate to the `backend` directory and run the Spring Boot application:

```bash
cd backend
./mvnw spring-boot:run
```

### 4. Running the Frontend

Navigate to the `frontend` directory, install dependencies, and start the Vite dev server:

```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173` to access the application.

---

## 🧪 Testing and Evaluation

MeetingMind includes a comprehensive test suite covering both deterministic application logic and semantic AI evaluations.

- **Automated Tests**: Unit and integration tests (using mocked LLM interactions via `@MockBean`) run automatically with `mvn test`.
- **Manual AI Evaluation**: Real-world transcript benchmarks (`AgentEvaluationTest`) are provided for semantic evaluation, but are disabled by default to prevent unwanted API costs. Remove `@Disabled` to run them locally.
- **RAG Validation**: Included chunking and retrieval benchmarking (`RagRetrievalEvaluationTest`).

---

## 💻 Demo Workflow

1. **Upload a Meeting**: Go to the Dashboard and create a new meeting with a raw text transcript.
2. **Watch the Pipeline**: The meeting status will transition dynamically (SUMMARIZING -> EXTRACTING -> DRAFTING -> REVIEWING).
3. **Review Output**: Open the meeting details to view the generated Summary, Action Items, drafted Email, and AI Review Result.
4. **Calendar Sync**: Visit the Calendar view to see action items visualized on their due dates.
5. **Ask RAG**: Go to the Search page and query historical topics seamlessly.

Enjoy building with MeetingMind!
