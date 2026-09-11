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
- [x] Initialize Memory Bank core files.
- [x] Harden Memory Bank for ongoing maintainability and fact-checked accuracy against the current repository state.
- [x] Repair `scripts/refresh-docs.js` updater (PR #1031):
  - Fixed `getUpstreamSha` to derive owner/repo/ref from `sourceConfig.url` instead of Context7 library ID
  - Non-GitHub URLs return `null` for safe byte-comparison fallback
  - Ambiguous refs without explicit metadata return `null`
  - Redirect handling with 5-redirect limit and relative redirect resolution
  - Non-200 HTTP responses are rejected
  - Atomic manifest saves with error cleanup and re-throw
  - Hard timeout deadlines for network fetches (15s socket timeout, 45s overall deadline)
