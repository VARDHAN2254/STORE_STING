# Contributing to STORE STING

Thank you for your interest in contributing to **STORE STING**! We welcome bug fixes, documentation improvements, feature additions, and architectural ideas.

---

## Code of Conduct
All contributors are expected to adhere to our [Code of Conduct](CODE_OF_CONDUCT.md).

---

## Development Setup

### Prerequisites
- **Node.js** >= 18 (20+ recommended)
- **Python** >= 3.13 (3.11+ compatible)
- **PostgreSQL** (Local 16+ or [Neon Serverless Postgres](https://neon.tech))

### Repository Setup
1. Fork the repository on GitHub.
2. Clone your fork locally:
   ```bash
   git clone https://github.com/<your-username>/STORE_STING.git
   cd STORE_STING
   ```
3. Set up the Backend:
   ```bash
   cd backend
   python -m venv .venv
   # Windows:
   .venv\Scripts\activate
   # macOS/Linux:
   source .venv/bin/activate

   pip install --upgrade pip
   pip install -r requirements.txt
   cp .env.example .env
   # Edit .env with your PostgreSQL or Neon connection string
   python -m app.database.seed
   ```
4. Set up the Frontend:
   ```bash
   cd ../frontend
   npm install
   cp .env.example .env.local
   npm run dev
   ```

---

## Development Workflow

### Branching Strategy
- Create a topic branch from `main` (or `master`):
  ```bash
  git checkout -b feature/your-feature-name
  # or
  git checkout -b fix/issue-description
  ```

### Code Quality Standards
- **Python**:
  - Run linting with Ruff: `ruff check app tests`
  - Auto-format: `ruff format app tests`
  - Run tests: `pytest -v`
- **Frontend**:
  - Check TypeScript types: `npm run build`
  - Keep styling consistent with Tailwind CSS utility tokens and modern design standards.

### Commit Messages
We follow conventional commit formatting:
- `feat: add AI semantic similarity scoring to search`
- `fix: prevent race condition in inventory reservation`
- `docs: update Neon connection guide in README`
- `test: add unit tests for idempotency headers`

---

## Submitting Pull Requests
1. Push your branch to your GitHub fork:
   ```bash
   git push origin feature/your-feature-name
   ```
2. Open a Pull Request against the main repository.
3. Provide a clear summary of your changes, motivation, and any testing completed.
4. Ensure CI checks pass on your PR before requesting review.
