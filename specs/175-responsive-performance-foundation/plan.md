# Implementation Plan: Responsive Performance Foundation

**Branch**: `175-responsive-performance-foundation` | **Date**: 2026-11-17 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/175-responsive-performance-foundation/spec.md`

## Summary

Mobile Lighthouse on the live site scored 58/100 with a 5.8 s LCP and 754 ms TBT, while desktop scored 95. Measurement (not assumption) located three concrete causes on the first-load path: a ~1,975 KiB Cloudflare Turnstile challenge payload fetched for a Suggestion Box that sits far below the fold; four Next.js route prefetches fired by first-viewport navigation links, executed as ~300–400 ms blocking tasks attributed to the router chunk; and two font files preloaded on routes that never render them. The plan removes that work from the first load with native deferral (viewport proximity and user intent) without changing any artwork, animation, copy, security control or Cloudflare setting.

## Technical Context

**Language/Version**: JavaScript/TypeScript, Node.js 26.x, Next.js App Router 16.4.3, React 19.3.1

**Primary Dependencies**: Next.js 16.4.3, React 19.3.1, `@marsidev/react-turnstile` 1.6.1, `next/font`, Tailwind CSS 4

**Storage**: N/A for this feature (no schema, data or API contract change)

**Testing**: Vitest + Testing Library (unit), Playwright Test (`desktop`, `mobile-390`, `mobile-412` projects, `tests/visual`), Lighthouse 12.8.2 for measurement, `./freebuff-verify.sh` as the repository gate

**Target Platform**: Cloudflare Pages/Workers (OpenNext) production, browsers served as one responsive application

**Project Type**: Web application (Next.js App Router, single project)

**Performance Goals**: Mobile PageSpeed 90+ (first priority) and desktop 90+; no regression to existing artwork, animations or interactions; production build strictly below 495 MiB

**Constraints**: Cloudflare configuration, DNS, caching and hosting are off-limits; no GPU upgrade and no visual redesign in this task; no user-agent detection; production build < 495 MiB

**Scale/Scope**: Homepage first load plus the shared shell that every route inherits (fonts, Turnstile field, navigation); `/map` uses the same Turnstile field

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Single source of truth** — `AGENTS.md` read and followed; no governance file modified.
- **II. Verify before acting** — bottlenecks were measured with Lighthouse and a Playwright network probe before any edit; the live-site baseline was captured first.
- **III. Implementation sequence** — INSPECT (live + local baselines) → IDENTIFY (Turnstile payload, route prefetch tasks, font preloads) → UNDERSTAND (request waterfall, long tasks, bootup attribution) → PLAN (this document) → IMPLEMENT → TEST → DOUBLE-CHECK → REPORT → PR.
- **IV. Protect core systems** — Turnstile remains mandatory and server-validated; no Stripe, Neon, auth, secret or deployment change; Cloudflare untouched.
- **V. Resource conservation** — no new dependency, no paid service; Lighthouse was installed outside the repository in `/tmp` and is not a project dependency.
- **Development workflow** — Spec Kit sequence completed with `spec.md`, `plan.md`, `tasks.md`; optional design artifacts (research/data-model/contracts) were not needed because the task changes no data model or interface.

**Re-check after design**: no violation. The change set touches presentation-loading behaviour only.

## Project Structure

### Documentation (this feature)

```text
specs/175-responsive-performance-foundation/
├── spec.md              # Feature specification
├── plan.md              # This file
├── tasks.md             # Task list
└── evidence.md          # Measured before/after results and limitations
```

### Source Code (repository root)

```text
app/
├── page.js                      # homepage shell: eager Turnstile hint removed
├── fonts.js                     # font preload policy (Inter, Playfair)
├── turnstile-field.jsx          # viewport-proximity widget mount
└── homepage/
    ├── Hero.js                  # first-viewport navigation uses intent prefetch
    └── HomePage.js              # below-the-fold backdrop is lazy
components/
└── IntentPrefetchLink.jsx       # new: Link that prefetches on user intent
tests/
└── visual/turnstile-loading.spec.ts  # asserts the deferred-loading contract
```

**Structure Decision**: Single Next.js App Router project. The changes are confined to the existing homepage shell, the shared Turnstile field, the font declaration module, one new presentational client component and one Playwright spec. No directory, route or data structure is introduced.

## Complexity Tracking

No constitution violations. No additional project, dependency, service or abstraction was introduced.
