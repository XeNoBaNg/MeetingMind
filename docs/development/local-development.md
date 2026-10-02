# Local Development Guide

## Prerequisites

- Java 21
- Node.js 18+
- Docker and Docker Compose
- Maven (or use the provided `mvnw` wrapper)

## Environment Setup

1. Copy `.env.example` to `.env`.
2. The default credentials in `.env` match the provided Docker Compose setup.

## Running the Infrastructure (PostgreSQL)

Start the local PostgreSQL database using Docker Compose:

```bash
docker compose -f infrastructure/docker/docker-compose.yml up -d
```

To stop the database:

```bash
docker compose -f infrastructure/docker/docker-compose.yml down
```

## Running the Backend

The backend is a Spring Boot application.

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Run the application using the Maven wrapper:
   - On Windows: `.\mvnw.cmd spring-boot:run`
   - On Mac/Linux: `./mvnw spring-boot:run`

The backend runs on `http://localhost:8080`.
You can verify the health endpoint at `http://localhost:8080/api/health`.

## Running the Frontend

The frontend is a Vite + React + TypeScript application.

1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies (first time only):
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

The frontend typically runs on `http://localhost:5173`.
API requests to `/api/*` are proxied to the backend automatically by Vite.
