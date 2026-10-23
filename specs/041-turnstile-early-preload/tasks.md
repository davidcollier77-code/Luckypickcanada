# Tasks: Turnstile Early Script Preload

**Input**: Design documents from `specs/041-turnstile-early-preload/`

**Prerequisites**: `plan.md`, `spec.md`

## Phase 1: Setup and Baseline

- [X] T001 [US1] Inspect TurnstileField, the installed wrapper version, homepage entry point, existing preconnect, and protected server-side verification.
- [X] T002 [US1] Review Cloudflare and React Turnstile loading guidance; select an exact, homepage-scoped URL that matches the wrapper.

## Phase 2: User Story 1 — Start Turnstile loading earlier (Priority: P1)

**Goal**: Start fetching the exact widget script from the homepage's initial response without changing verification behavior.

**Independent Test**: Playwright confirms one exact preload in the homepage document head and no matching preload on `/about`.

- [X] T003 [US1] Add `tests/visual/turnstile-loading.spec.ts` to check the exact homepage-only preload.
- [X] T004 [US1] Add the exact Turnstile API preload to `app/page.js` while preserving the existing component tree and layout.

## Phase 3: Verification and Final Audit

- [ ] T005 [US1] Run targeted and full unit/browser tests, TypeScript, `./jules-verify.sh`, Cloudflare/OpenNext build and measured build-size gate; inspect the complete final diff and current-head CI.
- [ ] T006 [US1] Update the PR evidence summary with actual checks/results, remaining uncertainty, and untouched security behavior.
