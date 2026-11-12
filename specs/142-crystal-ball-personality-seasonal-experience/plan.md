# Implementation Plan: Crystal Ball Personality, Local Time and Canadian Seasonal Identity

**Branch**: `freebuff/3625a98e3b6b0eab9e6a60b2` | **Date**: 2026-11-12 | **Spec**: [spec.md](./spec.md)

## Summary

Keep the existing `/crystal-ball` route, component, CSS, audio, artwork and daily allowance. Add
three small pure modules: a shared visitor-local time system, a Canadian calendar/occasion model,
and curated fallback fortune pools. The oracle route builds a tone-aware system prompt from the
occasion focus and returns occasion-appropriate fallbacks. The greeting composes the existing daily
personality line with a time-of-day salutation and updates while the page is open using the shared
one-second clock. Solemn days replace the playful greeting and remove humour from the prompt.

## Technical Context

**Language/Version**: JavaScript/TypeScript, Next.js 16.4.3 App Router, React 19.3.1

**Primary Dependencies**: Existing React, Next.js only. No dependency changes.

**Storage**: Existing localStorage keys and schema are unchanged.

**Testing**: Vitest for local time, greeting composition, calendar/occasion calculation and fallback
pools; the existing oracle route tests for prompt integration; Playwright greeting specs updated for
the salutation; `./freebuff-verify.sh`; measured production build.

**Target Platform**: Cloudflare Pages/Workers through OpenNext, modern browsers.

**Constraints**: No artwork, CSS, animation, audio, copy-layout or flow changes; no new dependency,
service, database or secret; one task feature directory.

## Constitution Check

- **Single source of truth**: `AGENTS.md` remains authoritative.
- **Verify before acting**: Current route, client, component, tests, shared clock and existing specs
  were read before editing.
- **Sequence**: Specify → Plan → Tasks → Implement recorded here.
- **Protect core systems**: No payment, email, database, auth, hosting, secret or deployment change.
- **Resource conservation**: `.docs/` stays read-only; no runtime dependency added.

**Result**: PASS.

## Project Structure

```text
app/lib/local-time.js                        # shared visitor-local moment, periods and greetings
app/lib/crystal-ball-calendar.js             # holidays, seasons, occasion focus, tone instructions
app/lib/crystal-ball-fortunes.js             # curated general/seasonal/occasion fallback pools
app/api/oracle/route.js                      # tone-aware prompts + occasion fallbacks
app/crystal-ball-client/greetings.js         # expanded greetings + time/sensitive-day composition
app/crystal-ball-client/CrystalBallClient.js # shared local moment in the API payload
app/components/CrystalBall/CrystalBall.tsx    # live time-aware greeting; visuals unchanged
components/daily-reset-countdown.js          # exposes the shared clock timestamp
__tests__/crystal-ball-local-time.test.js     # period boundaries, DST and midnight
__tests__/crystal-ball-calendar.test.js       # holidays, windows, tones, fallback selection
__tests__/crystal-ball-greetings.test.js      # expanded pool + composition rules
__tests__/oracle-route-validation.test.js     # prompt and fallback integration
tests/visual/crystal-ball-greeting.spec.ts    # salutation-aware greeting assertions
specs/142-crystal-ball-personality-seasonal-experience/
```

## Phase 0: Research

- The route already validates `localDate`, `localTime` and `timeZone`, computes movable holidays and
  returns fallbacks, but has no phased occasion model and omits Boxing Day, Mother's Day, Father's
  Day and a distinct New Year's Eve/Day treatment.
- The greeting is a static daily personality line; it has no time-of-day awareness and does not
  update while the page is open.
- The shared `useDailyResetCountdown` store already owns the only one-second interval and reacts to
  focus, visibility and `pageshow`; exposing its timestamp avoids a second timer.
- `localStorage` and the daily-usage schema are already correct across local midnight; no change is
  needed there.

## Phase 1: Design

- `local-time.js` exposes `getLocalMoment`, `getTimePeriod`, `parseLocalTime` and greeting metadata.
  Periods: 05:00–11:59 morning, 12:00–16:59 afternoon, 17:00–21:59 evening, otherwise late night.
- `crystal-ball-calendar.js` exposes `getCalendarContext`, `describeCalendar`, `getToneInstruction`
  and `parseCalendarDate`. The context carries the weekday, season, today's holiday, upcoming
  occasions and one **occasion focus** with `phase`, `intensity`, `tone` and a fallback `poolKey`.
- Windows: Canada Day June 24–30 (`windowDay 1..7`), Christmas December 1–24 with early/growing/eve
  stages, New Year December 26–30, plus holiday days and a gentle seven-day anticipation for the
  remaining listed holidays. Sensitive days are excluded from upcoming-occasion prompts.
- `crystal-ball-fortunes.js` selects the occasion pool when present, otherwise a seasonal + general
  pool. Respectful and thoughtful pools are never mixed with general humour. A time greeting is
  prepended to some ordinary fallbacks.
- `greetings.js` keeps the approved four greetings at indices 0–3, adds more personalities without
  changing the storage key, and composes `salutation + personality`. On Remembrance Day and the
  National Day for Truth and Reconciliation it returns a dedicated quiet greeting.
- `CrystalBall.tsx` reads the personality line once per local day and derives the composed greeting
  from the shared clock, so it retypes at a period boundary without a reload. All visual markup,
  classes, animations and controls are unchanged.

## Complexity Tracking

No constitution violations. No new dependency, service, database, storage schema or route.
