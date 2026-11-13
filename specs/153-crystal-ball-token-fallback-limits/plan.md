# Implementation Plan: Crystal Ball Token Budgets and Fallback Resilience

**Branch:** `freebuff/afd3081cdcd4503da85c6349` | **Date:** 2026-11-13
**Spec:** [spec.md](./spec.md)

## Summary

Split the Groq completion budget by request mode (900 for a daily fortune, 700 for a follow-up),
tag every curated daily fallback with a stable identifier, and pass an optional previous-day
exclusion hint from browser-local storage into the fallback selector. Remove the follow-up fallback
pools and replace every follow-up provider failure with the exact supplied outage message. Stop
persisting follow-up question and answer text, keeping only the daily allowance flags and the daily
fortune.

## Technical Context

**Language/Version:** JavaScript/TypeScript, Next.js 16.4.3 App Router, React 19.3.1

**Primary Dependencies:** Existing React/Next.js only. No dependency changes.

**Storage:** Browser `localStorage` for the daily usage record and a new two-field fallback-history
record. No server-side storage, database or logging of questions or answers.

**Testing:** Vitest for the selector, storage helpers, route payloads and component message;
`tsc --noEmit`; production build; `./freebuff-verify.sh`.

**Target Platform:** Cloudflare Pages / Workers through OpenNext.

**Constraints:** Preserve all 197 daily fallbacks and their weighting, all Groq settings other than
the two completion budgets, the daily limits/reset, and every visual and animation asset. Build must
stay below 495 MiB.

## Constitution Check

- **Single source of truth:** `AGENTS.md` remains authoritative.
- **Verify before acting:** The oracle route, production client, preview client, daily-usage store,
  fallback pools, calendar model, CSS and current tests were read before editing.
- **Sequence:** Specify → Plan → Tasks → Implement recorded in `specs/153-crystal-ball-token-fallback-limits/`.
- **Protect core systems:** No payment, email, database, authentication, hosting, secret, workflow or
  deployment change.
- **Resource conservation:** `.docs/` stays read-only; no new dependency and no generated asset.

**Result:** PASS.

## Project Structure

```text
app/api/oracle/route.js                          # token budgets, fallback ID hint, follow-up outage
app/lib/crystal-ball-fortunes.js                 # stable fallback IDs, exclusion-aware selection
app/lib/crystal-ball-follow-up-message.js        # exact visitor-facing outage copy
app/crystal-ball-client/CrystalBallClient.js     # fallback history, no Q&A persistence, message mapping
app/crystal-ball-client/daily-usage.js           # daily flags + fortune only
app/crystal-ball-client/fallback-history.js      # last fallback ID + local date only
app/crystal-ball-client/CrystalBallPreviewClient.jsx # preview no longer persists Q&A in usage
app/lib/crystal-ball-preview.js                  # preview usage shape
app/components/CrystalBall/CrystalBall.tsx       # keep outage message visible after submission
app/components/CrystalBall/CrystalBall.module.css# preserve message line breaks
__tests__/crystal-ball-fortunes.test.js          # 197 count, IDs, exclusion and pool relevance
__tests__/crystal-ball-fallback-history.test.js  # two-field storage and consecutive-day rule
__tests__/crystal-ball-daily-usage.test.js       # no Q&A persistence
__tests__/crystal-ball-client-follow-up.test.jsx # 503 message display and storage inspection
__tests__/oracle-route-validation.test.js        # 900/700 budgets, fallback ID, exact message
__tests__/crystal-ball-preview.test.js           # preview usage shape
specs/153-crystal-ball-token-fallback-limits/    # spec, plan, tasks, data model, checklist
```

**Structure Decision:** Single Next.js App Router project; the change stays inside the existing
Crystal Ball route, libraries, clients and component.

## Phase 0: Research

No material unknowns required external research. The existing route already centralises every
provider failure in one fallback payload, the calendar context already supplies `poolKey`, `season`
and `tone`, and the client already receives the response `source`, so the work is a contained
extension of existing contracts.

## Phase 1: Design

- **Token budgets:** compute `max_completion_tokens` from the validated `mode` rather than adding a
  second provider call path.
- **Fallback identifiers:** derive stable IDs from pool namespace plus one-based index; build
  weighted candidate arrays exactly as today, then filter the excluded ID before the existing
  uniform pick. If filtering would empty the list, use the original weighted list.
- **Fallback history:** store `{ id, date }` under a dedicated key. The client sends the ID only
  when the stored date equals the visitor's previous local calendar day. The server validates the
  hint and treats it as advisory.
- **Follow-up outage:** one shared constant in `app/lib/crystal-ball-follow-up-message.js` is used
  by the route and client. The route returns HTTP 503 with `{ error, unavailable: true }`; the
  client maps 503, network failure and empty content to that message, marks the day's follow-up as
  used and rethrows for display. No reading field is included.
- **Privacy:** remove follow-up question/answer fields from the daily-usage and preview-usage
  shapes; normalisation drops legacy values.
- **Presentation:** keep the existing follow-up panel and its error region, add `white-space:
  pre-line` so the supplied paragraphs remain distinct, and keep the panel visible after an outage
  even though the daily allowance is now marked used.

## Complexity Tracking

No constitution violations. No dependency, service, database, schema, secret or deployment change.
