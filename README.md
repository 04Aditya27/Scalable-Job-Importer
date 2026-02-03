# Job Importer System

A scalable job ingestion platform that fetches jobs from multiple XML feeds, normalizes them into a consistent internal format, processes them asynchronously using a Redis-backed queue, and tracks detailed import history.

The system is fully containerized and includes an admin UI built with Next.js.

## Features

### Multiple Job Feed Integration

- Supports **multiple XML-based job feeds**
- Converts XML feeds into JSON
- Normalizes job data into a **consistent internal format**
- Defensive handling of missing or malformed feed data

### Queue-Based Background Processing

- Uses **Redis + BullMQ** for asynchronous processing
- Prevents blocking API requests during large imports
- Supports:
  - Configurable **batch size**
  - Configurable **retry attempts**
  - **Exponential backoff** for transient failures
- Designed to handle **high-volume imports safely**

### Worker Architecture

- Dedicated background **worker process**
- Safe MongoDB **upserts** using stable external identifiers
- Prevents duplicate jobs across imports
- Worker concurrency configurable via environment variables

### Import History Tracking

Tracks detailed metadata for every import run:

- Import start time
- Total jobs fetched
- Total jobs processed
- New jobs created
- Jobs updated
- Failed jobs with failure reasons

Additional capabilities:

- Pagination
- Filtering by status:
  - `success`
  - `partial`
  - `failed`

### Cron-Based Scheduling

- Automated imports using **cron**
- Default schedule: **every hour**
- Cron schedule configurable via environment variables
- Faster schedules (e.g. every 2 minutes) supported for testing

### Admin UI

- Built with **Next.js**
- Displays import history in a clean tabular view
- Shows:
  - Import status
  - Job counts
  - Failure counts and reasons
- UI is **backend-driven** (no business logic on the frontend)

### Fully Dockerized

The following services are containerized:

- Backend API
- Worker process
- Frontend (Admin UI)
- Redis

All services are managed using **Docker Compose** for easy local setup.

## Environment Configuration

### Backend

Create a `.env` file in the `server/` directory using the .env.example file present in `server`/:

```bash
cp server/.env.example server/.env
```

#### Required variable:

Create a MongoDB Atlas cluster and database, then use the provided connection string.

```bash
MONGODB_URI=<your_mongodb_atlas_connection_string>
```

All other settings (cron schedule, retries, concurrency, batch size, etc.) are configurable and documented in server/.env.example.

#### Frontend

The frontend does not require sensitive environment variables.

API calls are routed using Docker networking and relative paths.

### Running the Project (Docker)

Prerequisites

- Docker
- Docker Compose

### Start all services

```bash
docker compose up --build
```

#### Access URLs

- Admin UI: http://localhost:3000
- Backend API: http://localhost:4000/api/import-logs

### Import Status Logic

#### Each import run is classified as:

- **success**
  - All jobs processed successfully

- **partial**
  - Some jobs succeeded, some failed

- **failed**
  - No jobs processed successfully
  - Example reasons:
    - Feed timeout
    - Feed fetch failure
    - XML parse error
    - No jobs found

Failure reasons are stored and visible in the Admin UI.

### Scalability Notes

- Workers can be scaled horizontally
- Queue decouples ingestion from processing
- Retry + backoff improves resilience
- Batch processing prevents Redis overload
- Cron schedule adjustable per environment

## Key Design Decisions

- Job imports are handled asynchronously using Redis queues to prevent blocking API requests during large imports.
- A separate worker process is used to isolate heavy processing and allow horizontal scaling.
- MongoDB upserts based on stable external identifiers prevent duplicate jobs across multiple imports.
- Retry logic with exponential backoff improves resilience against transient feed or network failures.
- Batch-based queue ingestion prevents Redis overload and allows controlled throughput.
- Cron-based scheduling enables fully automated imports without manual triggers.

## Assumptions

- MongoDB Atlas is used as the primary database.
- Redis is available as a standalone service (local or Dockerized).
- Job feeds are expected to be mostly well-formed XML but may occasionally fail or timeout.
- Eventual consistency is acceptable for job ingestion and import history.
- The Admin UI is intended for internal monitoring and operational visibility.

### Additional Notes

- .env files are excluded from version control
- .env.example documents required configuration
- Docker is the recommended way to run the project
- architecture.md contains detailed system design

### Conclusion

This project demonstrates a production-style job ingestion system with:

- Asynchronous background processing
- Robust failure handling
- Clear separation of concerns
- Observability via import history
- Fully containerized deployment
