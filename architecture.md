# System Architecture

This document describes the architecture of the **Job Importer System**, including its components, data flow, failure handling, and scalability considerations.

The system is designed to ingest jobs from multiple external feeds, process them asynchronously, and provide operational visibility via an admin interface.

---

## High-Level Overview

The system consists of four primary components:

1. Backend API
2. Redis Queue
3. Worker Process
4. Admin UI

All components are containerized and orchestrated using Docker Compose.

---

## Core Components

### Backend API

Responsibilities:

- Accepts import requests (manual or cron-triggered)
- Fetches and parses external job feeds
- Normalizes job data
- Enqueues jobs into Redis for background processing
- Exposes APIs for viewing import history

Key characteristics:

- Stateless
- Lightweight
- Fast response times (no heavy processing)

---

### Redis Queue (BullMQ)

Responsibilities:

- Decouples job ingestion from job processing
- Buffers large job volumes
- Handles retries and backoff automatically

Key characteristics:

- Supports batch ingestion
- Configurable retry attempts
- Exponential backoff for transient failures
- Acts as a load buffer between API and workers

---

### Worker Process

Responsibilities:

- Consumes jobs from the Redis queue
- Validates job data
- Performs MongoDB upserts
- Updates import statistics and failure reasons

Key characteristics:

- Runs independently of the API
- Horizontally scalable
- Configurable concurrency
- Failure-isolated from API layer

---

### Admin UI

Responsibilities:

- Displays import history
- Shows job counts, statuses, and failure reasons
- Provides pagination and filtering

Key characteristics:

- Read-only operational UI
- Backend-driven state
- No business logic on the frontend

---

## Data Flow

1. Cron or manual trigger starts an import run
2. Backend fetches job feeds and parses XML
3. Jobs are normalized into a common format
4. Jobs are enqueued in Redis in configurable batches
5. Worker processes jobs asynchronously
6. MongoDB stores job records and import logs
7. Admin UI queries backend APIs to display status

---

## Failure Handling

### Feed-Level Failures

- Feed timeout
- Feed fetch failure
- XML parsing errors
- No jobs found

These failures are recorded at the import-run level.

---

### Job-Level Failures

- Validation errors
- Database write failures
- Unexpected processing errors

Failed jobs:

- Are retried automatically based on configuration
- Use exponential backoff
- Record failure reasons for observability

---

## Scalability Considerations

- API layer is stateless and horizontally scalable
- Worker processes can be scaled independently
- Queue absorbs traffic spikes
- Batch processing prevents Redis overload
- Retry and backoff improve system resilience

---

## Scalable Design Thinking

The current architecture is designed so it can evolve from a Docker-based deployment to a fully cloud-managed, serverless setup with minimal changes.

### Serverless Backend

- The backend API is stateless and suitable for **AWS Lambda**.
- Import execution can be triggered using:
  - **Amazon EventBridge** (scheduled rules for automated imports)
  - Direct API calls for manual or ad-hoc imports
- MongoDB Atlas can continue to be used as the primary database.

### Queue Evolution

- Redis + BullMQ can be replaced with **Amazon SQS**.
- Each job import task can be published as an SQS message.
- Retry handling can be managed using:
  - SQS retry policies
  - Dead-letter queues (DLQ)
- Exponential backoff can be achieved using delayed retries or re-queue logic.

### Worker Scaling

- Worker processes can be replaced by:
  - AWS Lambda consumers
- Scaling becomes automatic based on queue depth.

### Database Scalability

- MongoDB Atlas supports horizontal scaling and indexing.
- Upsert-based writes using stable external identifiers prevent duplicates under parallel processing.

### Why This Transition Is Straightforward

- Clear separation between ingestion, queueing, and processing
- Asynchronous communication between components
- No tight coupling between API and worker logic

This allows the system to transition to cloud-native services primarily through infrastructure changes rather than architectural rewrites.

---

## Design Principles

- Loose coupling
- Single responsibility
- Asynchronous communication
- Failure isolation
- Operational observability

---

## Summary

This architecture balances simplicity and scalability by combining:

- Stateless APIs
- Queue-driven background processing
- Independent worker processes
- Strong failure handling and observability

The system is production-ready for moderate scale and well-positioned to evolve into a fully serverless or microservices-based architecture as requirements grow.
