# Active Context

## Current Focus
- Maintain and enhance the `luckypickcanada.ca` project based on active feature development or bug resolution tasks.
- Keep the repository governance intact, deferring to `AGENTS.md` for all workflow rules.
- Ensure strict security compliance, specifically verifying that no sensitive credentials or database connection strings are exposed in documentation or configuration files.

## Recent Changes
- Performed an investigation and cleanup of exposed Neon database credentials. Scrubbed remaining active hardcoded connection strings from `QUICK_FIX_GUIDE.md` and `DATABASE_SETUP.md` that were missed by a previous PR.
- Implemented centralized rate limiting for public API endpoints (`/api/visits`, `/api/checkout`, `/api/send-gift`, `/api/oracle`) using `app/spam-protection.js` to prevent automated abuse while keeping the site public.
- Hardened the Memory Bank system (PR #1008 initialized it, and this session refined it for accuracy and maintainability).
- Corrected discrepancies in technical facts (e.g., noted the absence of `luckypick.py` despite README documentation).

## Immediate Next Steps
- *(Currently awaiting the next user request or active task. When a new task begins, update this section with specific immediate next steps.)*
