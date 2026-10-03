# STORE STING — Secret Rotation Procedures

This runbook defines the authoritative procedures for rotating all credentials, API keys, database connection strings, and cryptographic secrets used across **STORE STING**.

> [!CRITICAL]
> **Zero Credential Exposure**: Never store or transmit real secrets in issue trackers, email, pull requests, or unencrypted documentation. All rotations must use environment variables or managed secret managers.

---

## 1. Neon PostgreSQL Database Password

### Scope
- `DATABASE_URL` (pooled connection string used by FastAPI application)
- `DATABASE_URL_UNPOOLED` (direct connection string used by Alembic migrations)

### Trigger
- Routine 90-day rotation
- Accidental disclosure in commit, logs, or chat
- Employee/maintainer departure

### Rotation Procedure
1. **Access Neon Console or Neon CLI**:
   - Via Neon Console: Navigate to **Project Settings** → **Roles & Databases** → Select application role (e.g. `neondb_owner` or dedicated app role).
   - Via CLI: `neon role reset-password <role-name> --project-id <project-id>`
2. **Obtain New Connection String**:
   - Copy the newly generated connection string with `sslmode=require` (or `ssl=require` for asyncpg).
3. **Update Application Environment**:
   - Update `backend/.env` on the staging/production host:
     ```env
     DATABASE_URL=postgresql+asyncpg://<role>:<new-password>@<endpoint>.neon.tech/<database>?ssl=require
     ```
4. **Restart Services**:
   - Restart the FastAPI ASGI server and Background Worker:
     ```bash
     # Backend API
     uvicorn app.main:app
     # Background Worker
     python -m app.worker
     ```
5. **Verify Connectivity**:
   - Run `python scripts/verify_flow.py` or hit `/api/health/db` to verify database health status returns `healthy`.

---

## 2. JWT Signing Secret Key (`SECRET_KEY`)

### Scope
- `SECRET_KEY` (HMAC-SHA256 signature for customer and administrator access tokens)

### Trigger
- Key exposure or routine rotation

### Rotation Procedure
1. **Generate Cryptographically Secure Random Key**:
   ```bash
   python -c "import secrets; print(secrets.token_urlsafe(64))"
   ```
2. **Update Environment**:
   - In production environment / secrets manager:
     ```env
     SECRET_KEY=<newly-generated-key>
     ```
3. **Restart API Server**:
   - Existing tokens signed with the old key will be invalidated upon restart. Customers and administrators will be prompted to re-authenticate seamlessly via the UI.

---

## 3. GitHub Personal Access Tokens / Deploy Keys

### Scope
- Repository deploy tokens, CI secrets, or developer personal access tokens (`gho_`, `ghp_`)

### Trigger
- Token expiration, permission scope change, or accidental leakage

### Rotation Procedure
1. Navigate to **GitHub Settings** → **Developer Settings** → **Personal Access Tokens**.
2. Generate new token with minimal required scopes (`repo`, `workflow`).
3. If using GitHub Secrets: Navigate to **Repository Settings** → **Secrets and variables** → **Actions** → Update repository secrets.
4. Revoke previous token immediately after confirming new workflows succeed.

---

## 4. Neon API Key (`NEON_API_KEY`)

### Scope
- Neon management CLI / MCP integrations (`napi_...`)

### Trigger
- Key age > 90 days or suspected compromise

### Rotation Procedure
1. Navigate to [Neon Console](https://console.neon.tech) → **Account Settings** → **API Keys**.
2. Click **Create new API key** and label it (e.g. `store-sting-cli-2026`).
3. Store the new token in developer local secret storage:
   ```bash
   neon login
   ```
4. Revoke the old key from the Neon Console.

---

## 5. Summary Verification Checklist

- [ ] New secret successfully generated using CSPRNG.
- [ ] Staging environment tested before production rollout.
- [ ] Old secret verified revoked/rejected.
- [ ] Application logs inspected for zero authentication errors.
- [ ] Incident/rotation record logged in change management history.
