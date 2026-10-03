# Security Policy

The STORE STING team takes the security of our application, users, and infrastructure seriously.

## Supported Versions

Only the latest release on the primary development branch is currently supported for security updates.

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

If you discover a potential security vulnerability in STORE STING, please report it privately rather than opening a public GitHub issue.

### How to Report
1. Open a **Private Security Advisory** via GitHub Security Advisories tab if enabled on the repository.
2. Alternatively, email the maintainers with:
   - A clear description of the vulnerability and affected component(s)
   - Step-by-step reproduction instructions or proof-of-concept (PoC)
   - Impact assessment
   - Any proposed remediation

Please allow up to 48 hours for an initial response from the core team.

### Guidelines
- **Do not** exploit security vulnerabilities or access private user data.
- **Do not** perform disruptive testing (e.g., DoS/DDoS attacks) on hosted demonstration environments.
- Allow maintainers reasonable time to address the issue before any public disclosure.

## Environment & Secret Hygiene
- **Never commit `.env` or credential files.** Always use `.env.example` as a template.
- Ensure all database connection strings, JWT secret keys, and API tokens are provisioned via environment variables or secret management services in production.
- Production deployments must override the default `SECRET_KEY` and enforce restrictive `BACKEND_CORS_ORIGINS`.
