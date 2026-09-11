# Progress

## What Works
- Centralized IP-based rate limiting for public API endpoints to prevent abuse.
- Next.js App Router architecture is set up.
- Cloudflare Pages / Workers deployment configured (using OpenNext).
- Neon PostgreSQL database integration is functional (used for `luck_shares` and `suggestions`).
- Stripe Checkout is integrated for the $1.00 Lucky Pick, $2.99 gift email package, and custom tip jar.
- Resend integration is active for delivering gift emails.
- Cloudflare Turnstile integration is active for public form verification.

## Known Discrepancies
- **Python Utility:** The local Python utility script (`luckypick.py`) and its active test suite are documented in `README.md`, but these files do not currently exist in the repository.

## What is Left to Build
- *(Future tasks will populate this section with specific feature developments or bug fixes.)*

## Completed Milestones
- [x] Identify and clean up remaining Neon credential exposure from `QUICK_FIX_GUIDE.md` and `DATABASE_SETUP.md`.
- [x] Analyze CodeQL findings from the primary setup run.
- [x] Initialize Memory Bank core files.
- [x] Harden Memory Bank for ongoing maintainability and fact-checked accuracy against the current repository state.
