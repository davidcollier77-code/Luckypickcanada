# Active Context

## Current Focus
- Maintain and enhance the `luckypickcanada.ca` project based on active feature development or bug resolution tasks.
- Keep the repository governance intact, deferring to `AGENTS.md` for all workflow rules.

## Recent Changes
- Implemented centralized rate limiting for public API endpoints (`/api/visits`, `/api/checkout`, `/api/send-gift`, `/api/oracle`) using `app/spam-protection.js` to prevent automated abuse while keeping the site public.
- Hardened the Memory Bank system (PR #1008 initialized it, and this session refined it for accuracy and maintainability).
- Corrected discrepancies in technical facts (e.g., noted the absence of `luckypick.py` despite README documentation).

## Immediate Next Steps
- *(Currently awaiting the next user request or active task. When a new task begins, update this section with specific immediate next steps.)*

### Recent Update
- Updated Lucky Card Reveal to use its own distinct, high-quality audio files from Mixkit, replacing the old shared sounds.
- Retained the old Howler instances and audio paths for the Lucky Meter as instructed, ensuring they remain completely separate.
- Downloaded and placed cinematic audio files under the Mixkit Free Sound Effects License into `public/sounds`.
- Completed Context7 documentation updater repairs in `scripts/refresh-docs.js` (PR #1031):
  - Fixed GitHub ref detection to extract owner/repo/ref from `sourceConfig.url`
  - Added redirect handling with limits and relative redirect resolution
  - Implemented atomic manifest saves with proper error handling
  - Added hard timeout deadlines for network fetches
