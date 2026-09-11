# Active Context

## Current Focus
- Maintain and enhance the `luckypickcanada.ca` project based on active feature development or bug resolution tasks.
- Keep the repository governance intact, deferring to `AGENTS.md` for all workflow rules.

## Recent Changes
- Implemented centralized rate limiting for public API endpoints (`/api/visits`, `/api/checkout`, `/api/send-gift`, `/api/oracle`) using `app/spam-protection.js` to prevent automated abuse while keeping the site public.
- Hardened the Memory Bank system (PR #1008 initialized it, and this session refined it for accuracy and maintainability).
- Corrected discrepancies in technical facts (e.g., noted the absence of `luckypick.py` despite README documentation).

## Immediate Next Steps
- Completed Context7 documentation updater repairs in `scripts/refresh-docs.js` (PR #1031). Repaired GitHub ref detection to correctly extract owner/repo/ref from `sourceConfig.url`, fixed network fetch streaming safely (added size limit bounds and true hard deadline timeouts), and implemented an atomic rename for `manifest.json` to prevent corruption.

### Recent Update
- Updated Lucky Card Reveal to use its own distinct, high-quality audio files from Mixkit, replacing the old shared sounds.
- Retained the old Howler instances and audio paths for the Lucky Meter as instructed, ensuring they remain completely separate.
- Downloaded and placed CC0 cinematic audio files into `public/sounds`.
