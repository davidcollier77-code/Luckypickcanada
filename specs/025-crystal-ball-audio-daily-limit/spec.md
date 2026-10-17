# Feature Specification: Crystal Ball Audio and Daily Question Limit

**Feature Branch**: feat/crystal-ball-audio-daily-limit

**Created**: 2026-10-17

**Status**: Draft for implementation and verification

**Input**: Add tasteful synchronized audio to the Crystal Ball reveal and limit visitors to three questions per day to bound AI usage and costs.

## User Stories

### US1 — Crystal Ball audio (P1)
A visitor submits a question and hears a restrained energy sound while the answer is prepared, a short reveal cue when the answer arrives, and a brief chime as the golden leaf travels to the answer panel.

Acceptance criteria: audio preloads without blocking page interactions; the energy sound stops after success, failure, or unmount; the reveal cue occurs before typing; a leaf cue occurs during the leaf flight; failed audio must not break the reveal.

### US2 — Three successful AI answers per day (P1)
A visitor can receive up to three successful AI-backed answers per client IP per UTC day, can see the remaining allowance, and cannot bypass the server-enforced cap by changing client state.

Acceptance criteria: initial quota is three; each successful AI answer decrements the remaining count; a fourth answer is denied; provider failures release their reservation; the next UTC day starts fresh; unavailable quota storage fails closed for AI-backed requests.

## Edge Cases
- Concurrent requests reserve capacity before calling the provider.
- A client with stale quota status is still checked by the POST endpoint.
- Shared public IPs share an allowance; changing IPs may receive a separate allowance.
- Missing AI credentials or upstream failure returns a fallback without consuming an AI-answer allowance.
- Audio loading failure never blocks the fortune response or plays a sound after its reveal phase.
- Existing reduced-motion, screen-reader, responsive, and keyboard behavior stays intact.

## Functional Requirements
- FR-001: Use newly sourced, same-origin WAV assets for short energy, reveal, and golden-leaf cues; record source pages and license in `public/sounds/crystal-ball-audio-sources.md`.
- FR-002: Audio must not block the AI call or the visual sequence.
- FR-003: Limit successful AI-backed answers to three per client IP per UTC day.
- FR-004: Reserve capacity before provider calls and commit only non-empty AI answers.
- FR-005: Release reservations on network, timeout, provider-status, and empty-content failures.
- FR-006: Enforce the allowance server-side.
- FR-007: Expose an uncached quota status endpoint and include current quota in success and denial responses.
- FR-008: Display the remaining count and a clear reached-limit message.
- FR-009: Fail closed for AI requests when the shared quota store is unavailable.
- FR-010: Preserve the reveal order, artwork, existing short-term rate limiter, and repeated-question behavior within the allowance.
- FR-011: Add no runtime package dependency or external audio domain; acquire licensed sources through a free command-line workflow and keep MP3 downloads out of `public/`.
- FR-012: Stay below the hard 495 MB build maximum.
- FR-013: Keep Crystal Ball energy-stop logic in a separately exported helper and ensure the audio module compiles in a production build.

## Key Entities
- Daily Oracle Usage: UTC date, one-way hash of client IP, completed answers, and pending reservations.
- Quota Status: limit, used, remaining, and next UTC reset time.
- Reveal Audio Cue: existing sound asset associated with one visual phase.

## Success Criteria
- SC-001: Redis-backed reservation prevents more than three combined pending/completed slots for a daily client key.
- SC-002: After three successful AI answers, the next POST request is rejected by the API.
- SC-003: Failed provider calls do not increase the completed-answer count.
- SC-004: The current flash, leaf flight, and progressive typing order remains unchanged while the matching sounds are requested.
- SC-005: Unit and Playwright tests cover quota reservations, rollback, reset, and the visitor-facing limit state.
- SC-006: Automated tests, governance verification, build, and build-size measurement pass before merge.
- SC-007: The audio export regression test and required Next.js/OpenNext/Wrangler build checks pass on the final repair candidate.

## Assumptions
- The daily boundary is 00:00 UTC for deterministic server-side accounting.
- IP-derived keys are hashed before storage. Shared networks share a quota, and changing networks may change it.
- Redis supplies cross-isolate atomic operations when configured. Cloudflare KV is a durable but not cross-isolate-atomic fallback; in-memory state is for local development/tests only.
- Howler.js is reused, but the three Crystal Ball cues are newly sourced online assets, not existing repository sounds. Download originals by HTTPS command line, convert to same-origin WAV, and record source/license provenance.
- Fallback fortunes are not counted as AI-backed answers when the provider is unavailable.

## Regression follow-up — missing timeout closure (2026-10-17)

A Cloudflare build immediately after PR #1506 merged still failed to parse `app/lib/audio.js` at the `else` branch in `stopCrystalBallEnergy`. The `setTimeout` callback was missing its closing `}, 160);`, so the parser encountered `else` before the callback and conditional had been closed.

Acceptance criteria for this correction:
- The callback closes with the existing 160 ms fade interval before the surrounding `else` branch.
- The timeout stops only the captured sound ID.
- Shared audio volume and cached ID are reset only when that same sound ID remains current.
- The immediate-stop fallback and surrounding Crystal Ball reveal sequence remain unchanged.
- The module import, unit tests, and OpenNext/Cloudflare production build pass on the candidate before merge.


## New Sound Asset Requirement — 2026-10-17

Replace the three borrowed Crystal Ball sounds with three distinct tracks sourced from Pixabay under its Content License: a magical aura/energy loop, a short spell-impact reveal, and a brief twinkle/sparkle leaf chime. Download them directly by HTTPS CLI without API keys, convert them to WAV for same-origin hosting, keep original MP3 downloads temporary, and preserve artist, listing URL, source URL, duration, and license in the provenance record. Do not change the reveal order, volume intent, user interaction flow, or reduced-motion behavior.
