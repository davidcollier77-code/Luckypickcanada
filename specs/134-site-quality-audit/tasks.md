# Tasks: Independent Site Quality Audit

**Input**: Design documents from `/specs/134-site-quality-audit/`

**Prerequisites**: plan.md, spec.md

**Tests**: No implementation tests are required because no application behaviour changes. Verification tasks cover the repository gate, build size, and evidence reproducibility.

**Organization**: Tasks are grouped by the audit's user stories so each evidence area can be completed and checked independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files/workstreams, no dependencies)
- **[Story]**: US1 assessment, US2 recommendations, US3 audit-only record

## Phase 1: Setup

**Purpose**: Establish baseline and confirm tooling and scope.

- [X] T001 Confirm branch, clean baseline and absence of an existing site-wide audit artifact under `specs/`.
- [X] T002 [P] Read `AGENTS.md`, all four Memory Bank files, `.docs/manifest.json` and selected task-group guidance (`deep-dive`, `seo`, `audio`, `polishing`).
- [X] T003 [P] Verify tool availability: Playwright CLI/Chromium, Browserless, Crawlbase; record the Firecrawl invalid-token failure and fallback.
- [X] T004 Record the audited production URL set from `sitemap.xml`, `robots.txt` and route definitions in `app/`.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared evidence capture every area depends on.

- [X] T005 Capture live homepage HTML (title, description, canonical, Open Graph, Twitter, JSON-LD, language, headings, images, links).
- [X] T006 [P] Capture per-route desktop measurements (`/`, `/lucky-meter`, `/crystal-ball`, `/reveal`, `/map`, `/about`) including status, FCP, LCP, CLS, TTFB, requests, transferred bytes, DOM size, H1/H2 counts, JSON-LD types, missing alt text and console errors.
- [X] T007 [P] Capture mobile-390 measurements for the same routes, including horizontal overflow.
- [X] T008 [P] Capture HTTP headers, cache policy, redirects (`/stories`, legacy map URLs, `www`), 404 behaviour and sitemap/robots contents.
- [X] T009 [P] Inventory repository assets: audio file formats/sizes, raster image formats/sizes, CSS sources, and audio implementation call sites.
- [X] T010 Capture desktop and mobile screenshots of the homepage and key routes into `artifacts/audit/`.

**Checkpoint**: Evidence set complete enough to support findings without further site changes.

---

## Phase 3: User Story 1 — Evidence-based quality assessment (Priority: P1) 🎯 MVP

**Goal**: A complete assessment of the five requested areas with cited evidence and explicit positives.

**Independent Test**: Each area's findings cite a URL, measured value, command output or repository path.

- [X] T011 [P] [US1] Assess visual design: identity, layout, hierarchy, artwork usage, animation, consistency, readability, desktop/mobile presentation.
- [X] T012 [P] [US1] Assess audio: asset formats and weight, cue coverage, volumes, preload strategy, gesture handling, session cleanup, reduced-motion interaction, absence of user control.
- [X] T013 [P] [US1] Assess UX/accessibility: navigation, first-time clarity, flow friction, keyboard/skip link, labels, heading structure, tap targets, mobile overflow, reduced motion.
- [X] T014 [P] [US1] Assess SEO: metadata per route, canonicals, headings, internal linking, structured data, indexing directives, sitemap, robots, alt text, thin content.
- [X] T015 [P] [US1] Assess performance: FCP/LCP/CLS/TTFB, payload, request count, oversized assets, CSS/JS weight, caching and image delivery.
- [X] T016 [US1] Consolidate findings and positives into `specs/134-site-quality-audit/audit-report.md`.

**Checkpoint**: All five areas covered with evidence and positives.

---

## Phase 4: User Story 2 — Prioritized actionable recommendations (Priority: P2)

**Goal**: A ranked register where each item explains what, why, impact and approach.

**Independent Test**: Every recommendation has priority, rationale, expected impact, effort/risk and approach.

- [X] T017 [US2] Build the prioritized recommendation register (P1/P2/P3) from verified findings only.
- [X] T018 [US2] Cross-check recommendations against completed Spec Kit and Memory Bank work to avoid duplicates.
- [X] T019 [US2] Mark protected-area recommendations (payments, auth, deployment, accessibility/visual behaviour) as requiring owner approval.
- [X] T020 [US2] Add the ranked "what works well" and "suggested feature additions" sections.

**Checkpoint**: Register is complete, ranked and explainable.

---

## Phase 5: User Story 3 — Reproducible audit record, no product change (Priority: P3)

**Goal**: Durable evidence, clean diff, honest verification reporting.

**Independent Test**: `git diff --stat` shows only audit artifacts; verification results are reported with real statuses.

- [X] T021 [US3] Write `specs/134-site-quality-audit/evidence.md` with commands, URLs, measured values and limitations.
- [X] T022 [US3] Complete `specs/134-site-quality-audit/checklists/requirements.md`.
- [X] T023 [US3] Run `./freebuff-verify.sh`; record each stage's real result.
- [X] T024 [US3] Measure the production build output (`.next` + `public`) and report against the 495 MiB cap.
- [X] T025 [US3] Inspect the complete final diff and run the final error check (`git diff --check`).
- [ ] T026 [US3] Create the PR with the one canonical summary, confirm it is OPEN and UNMERGED, and record the full HEAD SHA.

**Checkpoint**: Audit record is reproducible and the product is provably unchanged.

---

## Dependencies & Execution Order

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup; blocks all assessment work.
- **US1 (Phase 3)**: Depends on Phase 2. Area assessments T011–T015 are parallel; T016 depends on them.
- **US2 (Phase 4)**: Depends on US1 findings.
- **US3 (Phase 5)**: Depends on US2; verification and PR submission follow the complete report.

### Parallel Opportunities

- T002/T003 (governance and tool verification).
- T006–T009 (route measurements, mobile measurements, HTTP/config checks, asset inventory).
- T011–T015 (five independent area assessments).

## Implementation Strategy

### MVP First

1. Complete Setup + Foundational evidence capture.
2. Complete US1 assessment — this alone answers the owner's request.
3. Add US2 recommendations, then US3 record and verification.

### Incremental Delivery

1. Evidence captured → findings credible.
2. Assessment written → audit usable.
3. Recommendations ranked → owner can approve work.
4. Verification + PR → handoff complete, still unmerged.

## Notes

- [P] tasks touch different sections/files or independent evidence workstreams.
- No application behaviour changes are permitted in any task.
- Any blocked tool is recorded with its real error and a governed fallback.
