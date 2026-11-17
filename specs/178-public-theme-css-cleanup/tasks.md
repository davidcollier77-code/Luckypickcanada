# Tasks: Remove the Retired Public Theme CSS Mirror

**Input**: `spec.md` and `plan.md`

## Phase 1: Setup

- [X] T001 Inventory stylesheet imports in `app/layout.js`, `app/homepage/HomePage.js`, `app/homepage/Hero.js`, `app/map/page.js`, `app/crystal-ball/page.js`, `app/crystal-ball/preview/page.js`, and `app/lucky-map-of-canada/lucky-map-of-canada.js`; compare them with every file in `public/themes/default/` and the current instructions in `CSS_FIX_GUIDE.md`, `QUICK_FIX_GUIDE.md`, and `DEPLOYMENT_CHECKLIST.md`.

## Phase 2: Foundational

No shared infrastructure or blocking prerequisite changes are required for this documentation and static-file cleanup.

## Phase 3: User Story 1 — Keep One Authoritative Theme CSS Source (Priority: P1)

**Goal**: Remove the unreferenced public mirror while retaining the application's active theme CSS and accurate maintenance guidance.

**Independent Test**: Verify active import targets remain present, production pages use generated Next.js stylesheet URLs without direct public-theme links, and current guides no longer advise use of the old mirror.

- [X] T002 [P] [US1] Remove all eight legacy files: `public/themes/default/default.css`, `public/themes/default/effects.css`, `public/themes/default/header.css`, `public/themes/default/hero.css`, `public/themes/default/homepage.css`, `public/themes/default/index.css`, `public/themes/default/map.css`, and `public/themes/default/tokens.css`.
- [X] T003 [P] [US1] Update `CSS_FIX_GUIDE.md`, the CSS section of `QUICK_FIX_GUIDE.md`, and CSS-specific build, browser, rollback and troubleshooting guidance in `DEPLOYMENT_CHECKLIST.md`.
- [X] T004 [US1] Recheck active import targets in `app/layout.js`, `app/homepage/HomePage.js`, `app/homepage/Hero.js`, `app/map/page.js`, `app/crystal-ball/page.js`, `app/crystal-ball/preview/page.js`, and `app/lucky-map-of-canada/lucky-map-of-canada.js`; inspect rendered production HTML for the homepage, Crystal Ball and map with Browserless.
- [X] T005 [US1] Review the final diff against `.github/scripts/check_qa_pr_scope.py`, `.github/scripts/classify-visual-changes.sh`, `.github/workflows/visual-qa.yml`, and `.github/workflows/verification-integrity.yml`; record unavailable local build and test checks in the PR handoff.

## Final Phase: Polish and Cross-Cutting Review

- [X] T006 Review the changed-file inventory against `.github/workflows/pr-scope-verification.yml`, `.github/workflows/checker-suite.yml`, `.github/workflows/protected-files.yml`, and `.github/workflows/devskim.yml`; confirm no protected files, runtime code, visual baselines or deployment settings changed.

## Dependencies & Execution Order

```text
T001
 ├── T002 ──┐
 └── T003 ──┴──> T004 ──> T005 ──> T006
```

T002 and T003 can run in parallel after T001 because they change separate file sets. T004 depends on both implementation tasks. T005 and T006 are final review tasks.

## Parallel Execution Examples

- After T001, T002 (remove the public CSS mirror) and T003 (correct the living guides) may be completed independently and in parallel.
- T004, T005 and T006 remain sequential final-review work.

## Implementation Strategy

**MVP scope**: Complete User Story 1 as one indivisible cleanup: remove the entire retired public CSS bundle and update the three current guides. A partial deletion would leave the legacy public `index.css` import chain broken. No runtime refactor, stylesheet redesign, image change, application test change or visual baseline update is included.
