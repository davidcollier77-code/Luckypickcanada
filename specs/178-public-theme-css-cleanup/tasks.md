# Tasks: Remove the Retired Public Theme CSS Mirror

**Input**: `spec.md` and `plan.md`

## Phase 1: Setup

- [X] T001 Inventory all application imports, direct references, public theme files and maintenance-guide instructions; identify the complete eight-file legacy bundle.

## Phase 2: Foundational

No shared infrastructure or blocking prerequisite changes are required for this documentation and static-file cleanup.

## Phase 3: User Story 1 — Keep One Authoritative Theme CSS Source (Priority: P1)

**Goal**: Remove the unreferenced public mirror while retaining the application's active theme CSS and accurate maintenance guidance.

**Independent Test**: Verify active import targets remain present, production pages use generated Next.js stylesheet URLs without direct public-theme links, and current guides no longer advise use of the old mirror.

- [X] T002 [US1] Remove all eight legacy files: `public/themes/default/default.css`, `public/themes/default/effects.css`, `public/themes/default/header.css`, `public/themes/default/hero.css`, `public/themes/default/homepage.css`, `public/themes/default/index.css`, `public/themes/default/map.css`, and `public/themes/default/tokens.css`.
- [X] T003 [US1] Update `CSS_FIX_GUIDE.md`, the CSS section of `QUICK_FIX_GUIDE.md`, and CSS-specific build, browser, rollback and troubleshooting guidance in `DEPLOYMENT_CHECKLIST.md`.
- [X] T004 [US1] Recheck active stylesheet imports and remaining first-party public-theme references; inspect production HTML for `/`, `/crystal-ball` and `/map` with Browserless and review the complete changed-file set.

## Final Phase: Polish and Cross-Cutting Review

- [X] T005 Review the final file inventory against the PR scope declaration, visual-change classifier, PR review checker and verification-integrity requirements; record local toolchain limitations and preserve pending PR CI as pending.

## Dependencies & Execution Order

T001 establishes the complete inventory. T002 and T003 implement the scoped cleanup. T004 and T005 depend on the implementation. No parallel work or user-story dependencies are required.

## Implementation Strategy

Deliver the single cleanup story in one PR. No runtime refactor, stylesheet redesign, image change, application test change or visual baseline update is included.
