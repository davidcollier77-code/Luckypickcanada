# Implementation Plan: Visual, Usability, Functionality and Brand-Positioning Audit

**Branch**: `113-visual-ux-audit` | **Date**: 2026-11-08 | **Spec**: `specs/113-visual-ux-audit/spec.md`

**Input**: Feature specification from `specs/113-visual-ux-audit/spec.md`

**Note**: This plan follows `.freebuff/cmds/speckit.plan.md`. `plan.md`, `findings.md` and `measurements.json` are the deliverables; no application change is planned or authorised.

## Summary

Audit the live Lucky Pick Canada site through the connected Browserless browser, using Puppeteer sessions driven from Browserless to measure every public page at desktop and phone widths, exercise each interactive experience once, collect console/network evidence, and review the rendered copy against the non-gambling, optimism-first identity. Deliver one prioritised, evidence-cited report inside this feature directory, summarised in the PR body. Application code, artwork, copy, configuration and deployment stay untouched.

## Technical Context

**Language/Version**: Next.js 16.4.3 App Router on Cloudflare Pages/Workers via OpenNext (audit subject only); audit scripts are Puppeteer functions executed by Browserless, not stored in the repository.

**Primary Dependencies**: Browserless integration (`BROWSERLESS_EXECUTE_CUSTOM_FUNCTION`, `BROWSERLESS_SCRAPE_CONTENT`, `BROWSERLESS_TAKE_SCREENSHOT`), `curl` for status/header probes, repository source for cross-checking observed behaviour.

**Storage**: None. No database, file store or environment change.

**Testing**: Browser-measured evidence (DOM geometry, computed styles, ARIA state, console/network capture), HTTP status probes, and the repository verification gate `./freebuff-verify.sh`.

**Target Platform**: Public production site `https://luckypickcanada.ca`, viewed at 1440×900 and 390×844.

**Project Type**: Web application audit (documentation-only delivery).

**Performance Goals**: No product performance target is changed. Page-load observations are recorded as evidence, not as a performance budget.

**Constraints**: No Playwright (unavailable by instruction). No production writes. No code, asset, copy, config or deployment change. No claim without a recorded observation.

**Scale/Scope**: 10 public routes, 3 redirects, 1 unknown path, 5 interactive experiences, 4 collected page dimensions (desktop/mobile × text/controls).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Assessment |
| --- | --- |
| I. Single Source of Truth | `AGENTS.md` and the selected task-group files were read first; this plan does not restate or override them. **PASS** |
| II. Verify Before Acting | Environment, branch, existing PRs, sitemap, routes and the live site were inspected before any conclusion. **PASS** |
| III. Implementation Sequence | INSPECT → IDENTIFY → UNDERSTAND → PLAN → IMPLEMENT (audit delivery) → TEST (`freebuff-verify.sh`) → DOUBLE-CHECK (diff audit) → REPORT → PR. **PASS** |
| IV. Protect Core Systems | No Stripe, auth, database, hosting, environment or secret change; the audit only issues read-only public requests and one Crystal Ball question. **PASS** |
| V. Resource Conservation | `.docs/` read-only and not modified; Browserless usage limited to the audit; no dependency added. **PASS** |
| Stack & identity constraints | The audit explicitly evaluates the entertainment-only, non-gambling identity and recommends nothing that contradicts it. **PASS** |

No violations, so no complexity justification is required.

## Phase 0 — Research

No additional research was needed. The required facts were obtainable directly: the route inventory came from the repository (`app/**/page.*`) and `/sitemap.xml`; the browser capability from the Browserless tool schemas; and every measurement from the live site. No library document changed a decision, so no research file is created.

## Phase 1 — Design artifacts

Only artifacts warranted by an audit task are produced:

- `specs/113-visual-ux-audit/spec.md` — scope, user stories, requirements, success criteria.
- `specs/113-visual-ux-audit/plan.md` — this plan.
- `specs/113-visual-ux-audit/tasks.md` — ordered audit tasks.
- `specs/113-visual-ux-audit/checklists/requirements.md` — specification quality checklist.
- `specs/113-visual-ux-audit/findings.md` — the audit deliverable: coverage, verified defects, opportunities, priorities, limitations.
- `artifacts/ui-audit-20261108/measurements.json` — the machine-readable evidence behind `findings.md`.

`data-model.md`, `contracts/` and `quickstart.md` are intentionally omitted: the task introduces no entity, interface or repeatable user scenario beyond the measured evidence recorded in the two files above.

## Audit method

1. **Inventory** — repository routes, `/sitemap.xml`, `/robots.txt`, alias and unknown-path probes.
2. **Desktop pass** — every page at 1440×900: metadata, headings, counts, alt/dimension state, console errors, failed requests, overflow, contrast samples, tap targets, font sizes, above-the-fold text.
3. **Mobile pass** — every page at 390×844 (touch emulation): overflow, minimum/median font, control hit boxes, fixed/sticky layers, header/menu behaviour.
4. **Interaction pass** — FAQ, Lucky Meter, Daily Card, Crystal Ball, Tip Jar, Suggestion Box and Lucky Map, each exercised once with ARIA state captured; no production content created.
5. **Cross-checks** — HTTP status/redirect probes, external profile links, reveal counter API, static asset weight and cache headers.
6. **Positioning review** — quoted rendered copy reviewed against the optimism-first, non-gambling identity.
7. **Reporting** — defects separated from opportunities, each item prioritised with a stated reason; limitations declared.

## Project Structure

### Documentation (this feature)

```text
specs/113-visual-ux-audit/
├── spec.md
├── plan.md
├── tasks.md
├── findings.md
└── checklists/requirements.md

artifacts/ui-audit-20261108/
└── measurements.json
```

### Source Code (repository root)

No source change. The audited surface is read-only: `app/**` (routes and page components), `themes/default/*.css`, `next.config.mjs` (CSP, redirects), `public/**` (assets), and the live deployment.

**Structure Decision**: Documentation-only feature directory plus a raw evidence directory, matching the repository's existing audit precedent (`specs/106-seo-audit`).

## Complexity Tracking

No constitution violations, so this section is intentionally empty.
