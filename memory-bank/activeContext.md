# Active Context — Crystal Ball token budgets and fallback resilience

- **Updated:** 2026-11-13
- **Repository:** davidcollier77-code/Luckypickcanada
- **Branch:** `freebuff/afd3081cdcd4503da85c6349`
- **Base:** `main`
- **Spec Kit feature:** `specs/153-crystal-ball-token-fallback-limits` (follows `specs/152-*`)

## Current Task

The owner asked for separate Groq completion budgets for daily fortunes and follow-up answers, no
consecutive-day repeat of a curated fallback fortune, removal of the pre-written follow-up fallbacks
and the exact supplied outage notice when Groq cannot answer a follow-up.

## What changed

- `app/api/oracle/route.js` — `max_completion_tokens` is 900 for a daily fortune and 700 for a
  follow-up, with `openai/gpt-oss-20b`, `reasoning_effort: low` and every other request setting
  unchanged. Follow-up provider failures return the fixed product notice with no reading; daily
  fortunes keep their curated fallback and now include a stable `fortuneId`.
- `app/lib/crystal-ball-fortunes.js` — all 197 daily readings retained with stable unique IDs and
  exclusion-aware weighted selection; the 14 follow-up fallback answers and their selector removed.
- `app/crystal-ball-client/fallback-history.js` — browser storage keeps only the last fallback ID
  and local date; only yesterday's ID is excluded from today's selection.
- `app/crystal-ball-client/CrystalBallClient.jsx` — sends the previous-day hint, records the
  returned fallback ID, maps follow-up outages to the exact notice and persists only the used flag.
- `app/crystal-ball-client/daily-usage.js` — daily fortune and both used flags only; legacy
  follow-up question/answer text is dropped and never written again.
- `app/lib/crystal-ball-follow-up-message.js` — one shared exact outage message.
- `app/components/CrystalBall/CrystalBall.tsx` / `CrystalBall.module.css` — keeps the outage notice
  visible after submission and preserves its paragraph breaks; no artwork, layout or animation
  change.
- Tests updated and added for the 197-reading inventory, stable IDs, consecutive-day exclusion,
  seasonal/occasion relevance, both token budgets, exact message, fallback delivery and Q&A privacy.

## Verified behaviour (this workspace)

| Check | Result |
| --- | --- |
| Focused Crystal Ball tests | 6 files, 78 tests, exit 0 |
| Full unit suite | 69 files, 649 tests, exit 0 |
| Type check | `tsc --noEmit`, exit 0 |
| Production build | 306,445,265 bytes (≈292 MiB; cap 495 MiB) |
| `./freebuff-verify.sh` | exit 0 |
| Playwright desktop — new outage flow | 1/1 passed; exact message, fallback daily fortune, two-field history, no Q&A storage, used note after reload |
| Playwright desktop — existing follow-up/daily-limit flows | 5/5 passed after updating the expected non-persistence of Q&A |
| Seasonal and occasion pools | Fallback tests keep Christmas, Canada Day, Remembrance and Truth and Reconciliation relevance; no general fallback leaks into solemn pools |

## Known Context Risks

- The follow-up outage counts as the day's one follow-up, matching the supplied "come back tomorrow"
  notice and the previous fallback-answer behaviour.
- Fallback variety is browser-local, so it cannot follow a visitor across browsers or cleared
  storage; it never affects another visitor or the daily allowance.
- The visual tests were run on the desktop project; mobile projects and live production behaviour
  require the owner's deployment.
