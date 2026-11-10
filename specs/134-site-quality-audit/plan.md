# Implementation Plan: Independent Site Quality Audit

**Branch**: `freebuff/8ef0a0dd3db8b6c14079a864` | **Date**: 2026-11-10 | **Spec**: [spec.md](./spec.md)

**Input**: Audit-only request covering visual design, audio, user experience/accessibility, SEO, performance and improvement recommendations for `https://luckypickcanada.ca/`.

## Summary

Produce a read-only, evidence-based audit of the deployed Lucky Pick Canada experience and the repository behind it. Evidence is collected from the production site (rendered browser measurements, page source, HTTP headers, screenshots) and from current source/asset configuration. Findings are consolidated into a prioritized recommendation register. No application, asset, audio, configuration, SEO or deployment file is changed; the only repository additions are Spec Kit audit artifacts and this evidence record.

## Technical Context

**Language/Version**: Next.js 16.4.3 App Router, React 19.3.1, TypeScript/JavaScript (repository); audited production site served from Cloudflare.

**Primary Dependencies**: Next.js, Tailwind CSS 4, Framer Motion, GSAP, Howler, canvas-confetti, Stripe, Resend, Neon, Cloudflare Turnstile, `@opennextjs/cloudflare`. Existing dependencies only; nothing added.

**Storage**: Not touched. Neon and Stripe/Resend integrations are out of audit scope beyond visitor-facing behaviour.

**Testing**: `./freebuff-verify.sh` (pnpm frozen install, Spec Kit gate, status-integrity tests, `tsc --noEmit`, production build, refresh-docs tests). Browser evidence via the repository Playwright CLI (installed 1.64.1, Chromium available), Browserless measurements, and Crawlbase page retrieval as the governed fallback after Firecrawl returned an invalid-token error.

**Target Platform**: Production web (desktop 1440×900 and mobile 390×844 emulation); repository builds for Cloudflare Pages/OpenNext.

**Project Type**: Web application (Next.js App Router) with API routes.

**Performance Goals**: Establish a reproducible baseline for FCP/LCP/CLS, request count, transferred bytes, DOM size and page weight; identify evidence-supported bottlenecks rather than speculate.

**Constraints**: Audit only. No code, asset, audio, visual, SEO, configuration or deployment change. Strictly below 495 MiB measured production build. `.docs/` read-only. One feature directory per task. PR left open and unmerged.

**Scale/Scope**: 6 sitemap routes plus `/privacy`, `/terms`, legacy redirects and `www` host; homepage desktop/mobile; 35 audio assets; 105 raster assets; live metadata and structured data.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Assessment |
|---|---|
| I. Single Source of Truth | PASS — `AGENTS.md` followed; this plan does not duplicate governance. |
| II. Verify Before Acting | PASS — live site and repository inspected before findings; tool failures recorded and fallbacks used. |
| III. Implementation Sequence | PASS — INSPECT → IDENTIFY → UNDERSTAND → PLAN → (audit) IMPLEMENT → TEST → DOUBLE-CHECK → REPORT → PR. Audit-only scope is explicitly owner-authorized. |
| IV. Protect Core Systems | PASS — no payment, auth, database, deployment, secret or accessibility behaviour is modified. |
| V. Resource Conservation | PASS — `.docs/` untouched; no redundant crawls or paid-service expansion; 495 MiB cap enforced by verification. |
| Entertainment-only identity | PASS — recommendations preserve the non-lottery, entertainment-only positioning. |

No violations; Complexity Tracking is not required.

## Project Structure

### Documentation (this feature)

```text
specs/134-site-quality-audit/
├── spec.md          # Specify output
├── plan.md          # This file (Plan output)
├── tasks.md         # Tasks output
├── checklists/
│   └── requirements.md
├── audit-report.md  # Implement output — the audit deliverable
└── evidence.md      # Captured measurements, URLs and commands
```

No `data-model.md`, `contracts/` or `quickstart.md`: this task introduces no entities, external interfaces or repeatable implementation flow. Evidence capture is documented directly in `evidence.md`.

### Source Code (repository root)

```text
app/                     # audited, not modified
app/homepage/            # hero, sections, FAQ
app/lib/audio.js         # audio cue implementation
app/lucky-meter/         # route + layout metadata
app/crystal-ball/        # route
app/reveal/              # route
app/map/                 # route
app/sitemap.js           # sitemap source
app/robots.js            # robots source
themes/default/          # CSS under review
public/                  # audio and image assets under review
next.config.mjs          # caching/security headers under review
```

**Structure Decision**: Single Next.js application at repository root. All audit writes are confined to `specs/134-site-quality-audit/`; no source directory is touched.

## Phase 0: Research

No material unknowns required external research. Established web guidance (Core Web Vitals thresholds, structured-data types, accessible-name and reduced-motion expectations) is applied from existing knowledge and repository references. Tool availability was verified rather than assumed: Firecrawl failed with an invalid token, Crawlbase succeeded, Browserless rendered measurements succeeded, and the local Playwright CLI had Chromium installed.

## Phase 1: Design Artifacts

Not applicable. This is a report deliverable with no data model, interface contract or new user flow. The audit report itself is the design output.

## Post-Design Constitution Re-check

All gates remain PASS: no protected system is changed, the deliverable is documentation-only, and the PR is review-only.
