# Tasks: Cloudflare Toolchain Patch Maintenance

**Input**: Design documents from specs/220-cloudflare-toolchain-maintenance/  
**Prerequisites**: spec.md, research.md, plan.md  
**Tests**: Required by FR-009 and FR-010. Dependency-policy regressions and application/build/visual verification must run in the compliant Node 26.x / pnpm 10.30.3 environment.

## Phase 1: Investigation and Specification

- [X] T001 Read live repository governance, Spec Kit constitution/templates, four Memory Bank files and PR submission requirements.
- [X] T002 Verify package.json/lockfile pins, Next.js peer compatibility, OpenNext and Wrangler release metadata, and upstream release notes.
- [X] T003 Inspect OpenNext cache configuration, Worker runtime config, story revalidation path, and deployment/QA/protected-file workflows.
- [X] T004 Identify the global Undici override crossing Wrangler's declared v7 dependency boundary and document a major-aware patched-version policy.
- [X] T005 Record release investigation, lockfile/Undici risks, historical upgrade lessons, QA requirements and environment limitations in research.md.
- [X] T006 Prepare the feature specification, implementation plan and executable task list. Set .specify/feature.json to this feature.

## Phase 2: Dependency Implementation (Owner-Authorized — Blocked by ChatGPT Environment)

**Purpose**: Implement only the approved dependency pins, lockfile and dependency-policy tests. The owner authorized this phase on 2026-11-26. It is blocked in the current ChatGPT session because Node.js 26.x / pnpm 10.30.3 are unavailable and AGENTS.md ChatGPT-only §6 prohibits repository scripts, installs, builds and tests here. Keep every implementation task unchecked until it is executed and verified in a compliant environment.

- [ ] T007 Recheck npm stable tags, package provenance metadata, peer dependencies, engines and release notes immediately before editing.
- [ ] T008 Update only the approved OpenNext Cloudflare and Wrangler exact pins in package.json, provided they remain compatible and current.
- [ ] T009 Replace the global Undici override using pnpm 10.30.3-documented package-version selector syntax (for example, `"undici@^7.0.0": "7.30.2"`) and/or parent-specific syntax (for example, `"wrangler@4.168.0>undici": "7.30.2"`). Treat these as syntax examples only; inspect the original consumer requests and choose selectors whose replacement is accepted by each affected edge. Verify the selected syntax with `pnpm install --lockfile-only` using the exact pinned pnpm 10.30.3 binary, then inspect `pnpm why undici` and `pnpm-lock.yaml`. Do not use the pnpm 11.13.0 empty-range convergence syntax.
- [ ] T010 Regenerate pnpm-lock.yaml with Node.js 26.x and pnpm 10.30.3; do not hand-edit the lockfile.
- [ ] T011 Inspect `pnpm why` and every resolved graph path for OpenNext, OpenNext AWS, Wrangler, Workerd, Miniflare, glob, minimatch and Undici. Verify every Undici lockfile entry against the exact fixed floor for its major, and verify Wrangler 4.168.0 resolves Undici to exactly 7.30.2 as declared by its registry manifest. Remove minimatch 10-specific overrides only if proven unused.
- [ ] T012 Update __tests__/dependency-management.test.js to preserve unrelated security overrides and assert the intended scoped override policy.
- [ ] T013 Update __tests__/undici-security-override.test.js to enforce the patched release floor for every resolved Undici major and the exact Wrangler 4.168.0 -> Undici 7.30.2 dependency edge.
- [ ] T014 Review the complete diff for stale references, integrity changes, unsupported overrides, unrelated dependency churn and application/configuration edits.

## Phase 3: Verification (Required Before Implementation PR Readiness)

- [ ] T015 Run pnpm install --frozen-lockfile using Node.js 26.x and pnpm 10.30.3.
- [ ] T016 Run focused dependency-management and Undici regression tests, then the full Vitest suite and pnpm exec tsc --noEmit.
- [ ] T017 Run the Next.js production build and measure combined .next + public output; require strictly less than 495 MiB.
- [ ] T018 Run the OpenNext Cloudflare build; verify .open-next/worker.js, .open-next/assets, compiled Tailwind CSS and existing Lucky Meter CSS contracts.
- [ ] T019 Run pnpm exec wrangler build --config ./wrangler.jsonc.
- [ ] T020 Run pnpm exec wrangler deploy --dry-run --config workers/updater-scheduler/wrangler.toml.
- [ ] T021 Require both Visual QA Playwright shards and applicable QA/security checks; do not weaken package.json visual classification.
- [ ] T022 Inspect the current-head seven-category PR report, dependency advisories, protected-file authorization and exact diff before handoff.

## Phase 4: Release Boundary

- [ ] T023 Prepare a complete implementation PR with exact file purposes, protected-file authorization declaration, actual command evidence and pending CI states.
- [ ] T024 Leave the implementation PR open, regular, non-draft and unmerged for owner review; do not deploy production.
- [ ] T025 Confirm the production deployment workflow, concurrency protection, rate-limit retry policy and post-deploy CSS checks remain unchanged.

## Dependencies and Execution Order

- Phase 1 is complete and records the approved implementation boundary.
- Owner authorization for Phase 2 was received on 2026-11-26; no further approval is required for the specified dependency scope.
- Phase 2 is currently blocked by the ChatGPT execution constraints and must run in a compliant Node.js 26.x / pnpm 10.30.3 environment.
- Phase 3 depends on Phase 2 and must run only in the Node.js 26.x / pnpm 10.30.3 environment.
- Phase 4 depends on successful implementation and required verification; production deployment is excluded.

## Definition of Done

- Both direct dependencies resolve to current verified compatible stable versions.
- The frozen lockfile and all transitive paths are coherent and patched.
- Undici remains on compatible patched major lines; Wrangler is not forced onto Undici 8.
- No unneeded minimatch 10 override remains, and the existing glob@10 compatibility protection is preserved unless disproven.
- All applicable automated tests, builds, visual checks, size limits and PR categories pass.
- No Cloudflare configuration or production deployment changes are included.
