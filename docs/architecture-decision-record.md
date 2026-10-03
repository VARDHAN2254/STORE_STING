# Architecture Decision Record (ADR)

## ADR 001: Technology Stack & Database Selection
- **Status**: Accepted
- **Decision**: 
  - Backend: Python 3.13 + FastAPI + SQLAlchemy 2.0 (asyncio) + Pydantic v2 + structlog.
  - Frontend: React 18+ + TypeScript + Vite + Tailwind CSS + Lucide Icons + TanStack Query + Framer Motion.
  - Database: Native PostgreSQL 18 (using `psycopg` async driver) with schema migrations via Alembic.
  - Strict Rule: Financial values MUST use `NUMERIC(12, 2)` in PostgreSQL and Python `Decimal`. Floating points are prohibited for currency.
  - **No Docker**: Strict adherence to native runtimes (Python venv, Node.js, local/Neon PostgreSQL).

---

## ADR 002: PostgreSQL-Backed Asynchronous Job Queue
- **Status**: Accepted
- **Context**: The background commerce engine requires reliable job dispatch, retries, and worker concurrency without external infrastructure like Redis, Celery, RabbitMQ, or Docker containers.
- **Decision**:
  - Implement a `jobs` table in PostgreSQL with columns `id`, `job_type`, `payload`, `status`, `attempts`, `max_attempts`, `locked_at`, `locked_by`, `created_at`, `updated_at`.
  - Workers fetch and lock jobs concurrently using `SELECT ... FOR UPDATE SKIP LOCKED LIMIT 1`.
  - Background runner operates independently via `python -m app.worker`.

---

## ADR 003: State Machine & Order Transitions
- **Status**: Accepted
- **Decision**:
  - Strictly enforce sequential, valid order states:
    `CREATED` -> `ORDER_PLACED` -> `INVENTORY_VERIFIED` -> `PAYMENT_PENDING` -> `PAYMENT_AUTHORIZED` -> `PACKED` -> `SHIPPED` -> `OUT_FOR_DELIVERY` -> `DELIVERED` (or `FAILED` / `CANCELLED`).
  - Frontend cannot mutate state directly; transitions are governed by the `OrderOrchestrator`.

---

## ADR 004: Real-Time Updates via Server-Sent Events (SSE)
- **Status**: Accepted
- **Context**: Customers tracking orders need live progress without aggressive frontend polling.
- **Decision**:
  - Expose `GET /api/orders/{id}/stream` returning an `EventSource` stream of order and shipment events.
  - Operations dashboard also listens to real-time events for live monitoring.

---

## ADR 005: Visual Design Language — "Soft Future"
- **Status**: Accepted
- **Decision**:
  - Light UI only. Black, dark navy, glowing cyberpunk neon backgrounds are strictly disallowed.
  - Color palette: Warm Ivory (`#F7F4EE`), Pure White (`#FFFFFF`), Soft Mist (`#EEF2F0`), Pearl (`#E6EAE6`), Sage (`#B9C9B8`), Mint Aqua (`#A9DED2`), Soft Coral (`#F2B7A5`), Soft Lime (`#D8E878`), Deep Ink (`#1E2925`).
  - Generous whitespace, refined geometry, soft hover transitions, and subtle micro-animations.
