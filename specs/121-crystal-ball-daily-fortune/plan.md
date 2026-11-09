# Implementation Plan: Crystal Ball Daily Fortune Experience

**Branch**: `freebuff/312cb61fb800667e9da40810` | **Date**: 2026-11-09 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/121-crystal-ball-daily-fortune/spec.md`

## Summary

Replace the Crystal Ball's question-first, three-answer flow with one daily fortune and one optional follow-up while preserving the existing client component, artwork, reveal sequence and audio. Add a browser-local state module for the fortune and follow-up, serialize same-day allowance operations across tabs with the Web Locks API, adapt `app/api/oracle/route.js` to accept a fortune mode and a follow-up mode with validated calendar context and mode-correct fallback handling, expand the Canadian fallbacks, and route all three reset countdowns through one shared local-midnight store. Update the homepage FAQ content and its regression tests.

## Technical Context

**Language/Version**: JavaScript / TypeScript on Node 22.x (repository declaration), Next.js 16.4.3 App Router, React 19.3.1

**Primary Dependencies**: Existing Next.js, React, Howler, Framer Motion and Tailwind/CSS modules only. No dependency changes.

**Storage**: Browser `localStorage` for the visitor's daily Crystal Ball state and existing feature-specific keys. The browser Web Locks API serializes same-origin tabs for each local date; a per-tab promise queue preserves ordering where Web Locks are unavailable. No database, server quota, schema or payment change.

**Testing**: Vitest for pure date/usage/API contracts; Playwright for the browser experience and countdown synchronization; repository `./freebuff-verify.sh` for the governance gate, type check, build and docs tests.

**Target Platform**: Cloudflare Pages/Workers through OpenNext; modern browsers with `localStorage` and `Intl`.

**Project Type**: Web application (Next.js App Router, single project).

**Performance Goals**: One shared one-second interval per tab while any countdown is mounted; no additional network calls beyond the existing Oracle route; one exclusive same-origin lock per local date during a fortune/follow-up request; no new image or audio assets.

**Constraints**: Preserve the existing Crystal Ball artwork, CSS identity, animation sequence and audio; keep the 495 MB build maximum; do not alter payments, Stripe, gift email, authentication, hosting or unrelated pages.

**Scale/Scope**: One route (`/crystal-ball`), three countdown displays, one API route, one FAQ module and the related tests.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Single source of truth**: `AGENTS.md` remains authoritative; this plan and the spec are task artifacts only.
- **Verify before acting**: The existing implementation, tests, FAQ and timer code were inspected before planning.
- **Implementation sequence**: Specify, Plan, Tasks and Implement are recorded under `specs/121-crystal-ball-daily-fortune/`.
- **Protect core systems**: No Stripe, gift email, database, authentication, hosting, environment or secret change. The Oracle route changes are explicitly authorized by the task.
- **Resource conservation**: `.docs/` remains read-only; no new dependencies or services.

**Result**: PASS. No unjustified violation.

## Project Structure

### Documentation (this feature)

```text
specs/121-crystal-ball-daily-fortune/
├── spec.md
├── plan.md
├── data-model.md
└── tasks.md
```

### Source Code (repository root)

```text
app/
├── api/oracle/route.js                     # fortune and follow-up modes, calendar context, fallbacks
├── components/CrystalBall/CrystalBall.tsx   # daily-fortune UI, greeting, follow-up, shared countdown
├── components/CrystalBall/CrystalBall.module.css
├── crystal-ball-client/CrystalBallClient.js # storage, request flow, cross-tab/date synchronization
├── crystal-ball-client/daily-usage.js       # one fortune + one follow-up per local day
├── lib/daily-reset.js                       # pure local-midnight date/deadline helpers
└── homepage/faq-content.js                  # updated Crystal Ball FAQ

components/
├── daily-reset-countdown.js                 # one shared external-store countdown engine
├── midnight-countdown.js                    # Card Reveal wrapper over the shared engine
└── DailyResonance.tsx                       # Lucky Meter reads the shared engine

tests/
├── __tests__/...                            # Vitest contracts
└── tests/visual/...                         # Playwright browser checks

memory-bank/activeContext.md                 # task record
memory-bank/progress.md                      # completed milestone record
.specify/feature.json                        # active feature pointer
```

**Structure Decision**: Keep the existing Crystal Ball component and route. Add only one small shared date module and one shared countdown store so the three displays cannot drift. Reuse the browser Web Locks API rather than adding a dependency or server quota service to prevent simultaneous same-origin tabs from spending the same daily allowance.

## Phase 0: Research

No external research was needed. The existing implementation already establishes the date utilities, audio helpers, animation states, Oracle provider and test harness. The material decisions are to move the authoritative deadline calculation into a pure module and expose it through a single `useSyncExternalStore`-backed hook, and to serialize same-day allowance transitions with Web Locks. This prevents duplicate timers and concurrent tabs from racing to consume the same daily allowance.

## Phase 1: Design

- `data-model.md` records the persisted daily state, transitions and reset-clock shape.
- No external interface contract document was added: the Oracle route's request/response shape is small and is covered directly by route tests in `__tests__/oracle-route-validation.test.js`.
- No quickstart was added: the executable Playwright and Vitest checks in `tasks.md` cover the end-to-end flow.

## Complexity Tracking

No constitution violations.
