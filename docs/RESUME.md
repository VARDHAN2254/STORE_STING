# STORE STING Hardening & Session Resume Guide

This document establishes the instructions for resuming the STORE STING production hardening and Neon PostgreSQL integration pass across sessions.

## How to Resume Work

1. **Read `docs/hardening-progress.md`** to verify:
   - Last completed checkpoint
   - Current active checkpoint and status
   - Pending blockers or input requirements
2. **Inspect Current Repository State**:
   - Verify that code and test suites match the recorded checkpoint status.
   - Do NOT redo completed checkpoints unless a regression is detected.
3. **If Status is `WAITING_FOR_USER`**:
   - Check the specific required input (e.g., Neon PostgreSQL connection string).
   - Prompt the user clearly and pause.
4. **If Status is `READY_TO_RESUME` or `IN_PROGRESS`**:
   - Continue execution from the first incomplete checkpoint.
   - Update `docs/hardening-progress.md` after verifying each checkpoint.
5. **Safety Constraints**:
   - Zero Docker. Native Python / Node.js only.
   - Financial calculations strictly Decimal/NUMERIC.
   - Never commit or log credentials or database passwords.
