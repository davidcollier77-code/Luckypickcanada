# Progress

## What Works
- Centralized IP-based rate limiting for public API endpoints to prevent abuse.
- Next.js App Router architecture is set up.
- Cloudflare Pages / Workers deployment configured (using OpenNext).
- Neon PostgreSQL database integration is functional (used for `luck_shares` and `suggestions`).
- Stripe Checkout is integrated for the $1.00 Lucky Pick, $2.99 gift email package, and custom tip jar.
- Resend integration is active for delivering gift emails.
- Cloudflare Turnstile integration is active for public form verification.
- Local repository workflow integrations (`.specify`, `.docs`, `.jules`) operate cohesively under `AGENTS.md`.

## Known Discrepancies
- **Python Utility:** The local Python utility script (`luckypick.py`) and its active test suite are documented in `README.md`, but these files do not currently exist in the repository.

## What is Left to Build
- *(Future tasks will populate this section with specific feature developments or bug fixes.)*

## Completed Milestones
- [x] Initialize Memory Bank core files.
- [x] Harden Memory Bank for ongoing maintainability and fact-checked accuracy against the current repository state.
- [x] Formalize Spec Kit Constitution (`.specify/memory/constitution.md`) and workflow coherence.
- [x] Improved `scripts/refresh-docs.js` updater atomicity and reporting (atomic writes, 15s timeout, 10MB response-size limit, true failure reporting).
- [x] Removed `/goldfire/howler.js` (Context7 source) from `.docs/manifest.json` automated updates.
