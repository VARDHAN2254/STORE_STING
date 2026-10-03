# STORE STING

<div align="center">

**Shopping, reimagined.**

*A next-generation, human-centric e-commerce platform set in the year 2050.*  
*Powered by an autonomous multi-agent commerce engine, light Soft Future design, and Neon Serverless PostgreSQL.*

[![CI Pipeline](https://github.com/VARDHAN2254/STORE_STING/actions/workflows/ci.yml/badge.svg)](https://github.com/VARDHAN2254/STORE_STING/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python 3.13+](https://img.shields.io/badge/Python-3.13+-3776AB.svg?logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React 18](https://img.shields.io/badge/React-18.3+-61DAFB.svg?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5+-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Neon Postgres](https://img.shields.io/badge/Database-Neon_Postgres-00E599.svg?logo=postgresql&logoColor=white)](https://neon.tech)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4+-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com)

</div>

---

## 📖 Overview

**STORE STING** reimagines online shopping as it should be in **2050**: calm, transparent, and effortlessly intelligent. Rejecting dark, chaotic cyberpunk tropes, STORE STING is built around the **Soft Future** design system—a light, warm, and tactile visual language that puts people first.

Underneath the serene interface runs a high-integrity, asynchronous **Multi-Agent Commerce Engine**. As soon as an order is placed, autonomous agents coordinate inventory allocation, risk evaluation, simulated payment clearance, automated fulfillment, and SLA-aware delivery dispatch—streaming real-time updates directly to customers over Server-Sent Events (SSE).

---

## 🌟 Key Features

### 🛍️ Soft Future Consumer Experience
- **Intent-Driven Natural Language Search**: Interprets natural phrasing, budget limits, user goals, and hardware preferences with transparent match percentages and criteria explanations.
- **Intelligent Matrix Comparison**: Side-by-side spec, battery, performance, and price comparisons with automated factual highlights.
- **Curated Goal-Based Collections**: Dynamic collections targeted at creators, students, engineers, and digital nomads.
- **Interactive Cart & Real-Time Checkout**: Instant item updates, delivery tier options, promotional calculations, and address verification.
- **Real-Time Visual Order Tracking**: Live visual stepper with step-by-step telemetry powered by Server-Sent Events (SSE).

### 🤖 Multi-Agent Commerce Engine
| Agent | Responsibility | Core Mechanism |
| :--- | :--- | :--- |
| **OrderAgent** | Authoritative calculations & validation | State validation, tax/shipping computation, and transitions |
| **InventoryAgent** | Warehouse stock verification & locking | Atomic reservations via PostgreSQL row-level locks |
| **PaymentAgent** | Fraud risk evaluation & payment processing | Risk-scored settlement simulation with idempotent transactions |
| **FulfillmentAgent** | Automated warehouse pick, pack & manifest | Package dimension calculation and manifest generation |
| **DeliveryAgent** | SLA dispatch, route assignment & tracking | Carrier selection (SkyRoute Autonomous, OrbitAir Cargo) & real-time telemetry |

### ⚡ Engineering & Architecture Highlights
- **Serverless PostgreSQL (Neon)**: Fully asynchronous persistence via `asyncpg` and SQLAlchemy 2.0 with connection pooling, automatic SSL parameter normalization, and zero-downtime branching compatibility.
- **High-Throughput Concurrency Worker**: Autonomous queue processor utilizing PostgreSQL `FOR UPDATE SKIP LOCKED` for reliable, distributed background execution without Redis or Celery dependencies.
- **Strict Financial Integrity**: 100% PostgreSQL `NUMERIC` and Python `Decimal` representation—preventing IEEE-754 floating-point rounding errors.
- **Idempotency Safeguards**: Built-in `Idempotency-Key` request deduplication preventing double orders or duplicate payment settlements.
- **Deterministic Simulation Suite**: Built-in test harnesses verifying pipeline behaviors across 8 distinct business scenarios (including stockouts, fraud rejections, carrier delays, and transient retries).

---

## 🏗️ Architecture

```mermaid
flowchart TD
    subgraph Client["Frontend Client (React 18 + Vite + TypeScript)"]
        UI["Soft Future UI & Catalog"]
        NL["Natural Language Search"]
        Cart["Cart & Checkout"]
        SSE_Recv["Real-time SSE Listener"]
    end

    subgraph API["FastAPI Asynchronous Gateway"]
        AuthRouter["Auth & Session API"]
        CatalogRouter["Products & Search API"]
        OrderRouter["Orders & Checkout API (Idempotency)"]
        AdminRouter["Operations & Metrics API"]
        SSE_Stream["Telemetry SSE Streamer"]
    end

    subgraph Storage["Neon Serverless PostgreSQL"]
        DB_Catalog[("Catalog & Users")]
        DB_Orders[("Orders & Ledger")]
        DB_Queue[("Outbox / Job Queue (SKIP LOCKED)")]
        DB_Events[("Agent Telemetry Log")]
    end

    subgraph Workers["Background Multi-Agent Processor"]
        Worker["Job Poller (FOR UPDATE SKIP LOCKED)"]
        OrderAg["OrderAgent"]
        InvAg["InventoryAgent"]
        PayAg["PaymentAgent"]
        FulAg["FulfillmentAgent"]
        DelAg["DeliveryAgent"]
    end

    Client -->|HTTP / JSON| API
    SSE_Stream -.->|Server-Sent Events| SSE_Recv
    API --> Storage
    Worker -->|Poll & Transition| DB_Queue
    Worker --> OrderAg & InvAg & PayAg & FulAg & DelAg
    OrderAg & InvAg & PayAg & FulAg & DelAg --> Storage
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** >= 18.x (v20+ recommended)
- **Python** >= 3.13 (or 3.11+)
- **PostgreSQL** instance (Local PostgreSQL 16+ or [Neon Serverless Postgres](https://neon.tech))

---

### 1. Clone the Repository
```bash
git clone https://github.com/VARDHAN2254/STORE_STING.git
cd STORE_STING
```

---

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# Windows:
.venv\Scripts\activate
# Linux / macOS:
# source .venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your DATABASE_URL (local Postgres or Neon connection string)

# Initialize schema and seed development catalog
python -m app.database.seed

# Start FastAPI server
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

---

### 3. Background Worker Setup

In a separate terminal (with backend `.venv` activated):
```bash
cd backend
python -m app.worker
```

---

### 4. Frontend Setup

In a third terminal:
```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local

# Launch Vite development server
npm run dev
```

Open your browser to: **`http://localhost:5173`**

---

## 🧪 Development Sandbox Accounts

The initial database seed provisions sample accounts for local development and demonstration:

| Account | Email | Password | Role |
| :--- | :--- | :--- | :--- |
| **Operations Lead** | `admin@storesting.com` | `StoreSting2050!` | Administrator / Operations Console |
| **Customer (Alex Mercer)** | `alex@storesting.com` | `Customer2050!` | Customer Account / Saved Studio Address |

> [!WARNING]
> These credentials are strictly development fixtures. Never deploy default seed credentials to public production instances.

---

## 🔬 Testing & Verification

STORE STING includes automated test suites covering API contracts, financial math, state machine invariants, and multi-agent pipeline concurrency.

```bash
# 1. Run Complete End-to-End Flow (Search -> Cart -> Checkout -> Agents -> Delivery):
python scripts/verify_flow.py

# 2. Run Backend Unit & Integration Tests:
cd backend
pytest -v

# 3. Run Ruff Code Quality Linting:
ruff check app tests

# 4. Run Frontend Vitest Unit Tests:
cd frontend
npm run test

# 5. Verify Production Frontend Build:
npm run build
```

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)
| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `PROJECT_NAME` | Name of application | `STORE STING` |
| `ENVIRONMENT` | Runtime environment (`development` / `production`) | `development` |
| `DATABASE_URL` | Asynchronous PostgreSQL connection string | `postgresql+asyncpg://user:pass@ep-host.neon.tech/neondb?ssl=require` |
| `DATABASE_URL_UNPOOLED` | Direct unpooled connection (for migrations) | Optional |
| `SECRET_KEY` | HMAC key for signing JWT tokens | *Generate a secure secret in production* |
| `BACKEND_CORS_ORIGINS` | Comma-separated list or JSON array of allowed origins | `http://localhost:5173,https://store-sting.netlify.app` |
| `WORKER_POLL_INTERVAL_SEC` | Worker queue polling frequency in seconds | `1.0` |
| `SIMULATION_MODE` | Enable simulated delay and scenarios | `True` |

### Frontend (`frontend/.env.local`)
| Variable | Description | Default |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | Base URL for the backend API | `http://localhost:8000/api` |

---

## 📁 Repository Structure

```text
STORE_STING/
├── .github/
│   ├── workflows/ci.yml       # GitHub Actions CI pipeline
│   ├── CODEOWNERS             # Component ownership paths
│   └── dependabot.yml         # Automated dependency vulnerability updates
├── backend/
│   ├── app/
│   │   ├── agents/            # Autonomous commerce agents (Order, Inventory, Payment, etc.)
│   │   ├── api/               # FastAPI route controllers
│   │   ├── core/              # Configuration, security, and hashing
│   │   ├── database/          # Models, session factory, seed script
│   │   ├── orchestration/     # State machine and pipeline coordinator
│   │   ├── schemas/           # Pydantic data transfer objects
│   │   ├── worker/            # Concurrency queue processor (SKIP LOCKED)
│   │   └── main.py            # Application entrypoint & ASGI app
│   ├── tests/                 # Pytest test suite
│   ├── requirements.txt       # Python dependencies
│   └── pyproject.toml         # Python project configuration
├── frontend/
│   ├── src/
│   │   ├── components/        # Soft Future UI components & search bar
│   │   ├── context/           # React Context (Auth, Cart, Compare)
│   │   ├── features/          # Discover, Detail, Checkout, Tracking, Operations
│   │   ├── services/          # API client and SSE stream hooks
│   │   └── types/             # TypeScript interfaces and domain types
│   ├── package.json           # Frontend dependencies
│   └── vite.config.ts         # Vite configuration
├── docs/                      # Architectural decision records & specifications
├── scripts/                   # Verification flow and startup scripts
├── LICENSE                    # MIT License
├── SECURITY.md                # Vulnerability disclosure policy
├── CONTRIBUTING.md            # Guidelines for contributors
└── README.md                  # Project overview and documentation
```

---

## 🛡️ Security & Responsible Disclosure

Please review our [SECURITY.md](SECURITY.md) for vulnerability reporting guidelines. Never commit real credentials, database passwords, or private encryption keys to source control.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE) © 2026 STORE STING Contributors.  
See [COPYRIGHT.md](COPYRIGHT.md) and [THIRD_PARTY_LICENSES.md](docs/THIRD_PARTY_LICENSES.md) for trademark notices and third-party software attributions.
