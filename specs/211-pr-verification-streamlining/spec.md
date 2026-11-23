# Feature Specification — PR Verification Streamlining (Spec 211)

## Goal

Make every pull-request check earn its runtime: each check has one clear
responsibility, runs when the change set can affect it, blocks what it is meant
to block, and reports honestly what it did. No test, project, configuration,
committed baseline or security scanner is removed or weakened.

## Scope

- One trusted applicability decision for the production build and for the
  existing visual classifier.
- The always-required application job is named `Application Verification`.
- Build and browser checks run conditionally, failing closed on unknown input.
- A required-but-skipped check blocks Verification Integrity; a check that
  could not apply is `NOT RUN — not applicable` and never a pass.
- Full Playwright workstream: per-spec timing capture, duration-weighted
  file-affine sharding, affected-spec selection in shadow mode, flake and
  imbalance reporting.
- `./freebuff-verify.sh` covers all Python checker suites, the full Vitest
  suite, the type check, the Next.js build and the 495 MiB cap.
- Documentation, tests and workflows are reconciled in the same PR.

## Non-goals

No category, status, threshold or protected governance change. No Playwright
config, project, spec or baseline change. No removal of DevSkim, CodeQL,
Dependabot, scope or protected-file safeguards. No live AI provider monitoring.
No deployment. No obsolete-file or checker-mode removal (those are separately
identified for owner approval).

## User stories

1. A docs-only PR runs the application suite, security, scope and governance,
   reports build and browser checks as not applicable with reasons, and does not
   warn merely because they could not apply.
2. A rendering or build-affecting PR keeps the full build and both Playwright
   shards.
3. Every row names the real check and says whether it was required for this head.
4. The local gate predicts CI for the application suite, types, build and size.
5. A new spec file can never be silently excluded from a run.

## Functional requirements

- **FR-001** Build applicability is decided by one fail-closed classifier;
  visual applicability stays with `classify-visual-changes.sh`.
- **FR-002** Application Verification runs on every pull request, merge group
  and dispatch and installs no browser.
- **FR-003** Build validation runs unless the trusted classifier proves no
  build input changed; merge group and dispatch always build.
- **FR-004** Playwright keeps all 16 specs, three projects, committed baselines
  and the existing configuration.
- **FR-005** The audit recomputes applicability from the trusted base; a
  required check that did not run blocks.
- **FR-006** The report keeps exactly seven categories and four statuses.
- **FR-007** Each audit workflow performs one bounded wait.
- **FR-008** `freebuff-verify.sh` runs install, Spec Kit gate, all Python
  suites, TypeScript, full Vitest, docs tests, Next build and the size cap.
- **FR-009** Shards are planned per whole spec file with exact-coverage guards.
- **FR-010** Affected-spec selection is fail-closed and shadow-only by default.
- **FR-011** Timing artifacts and flake/imbalance warnings never change a run
  result.
- **FR-012** Documentation and contract tests bind names, applicability and
  limitations together.
- **FR-013** Crystal Ball/Oracle, adaptive-performance, resource-readiness,
  DevSkim, CodeQL, Dependabot and the performance checker are preserved.
- **FR-014** No verification path deploys; the build stays strictly below
  495 MiB.

## Acceptance criteria

1. Docs-only PR: no warning caused solely by inapplicable build/browser checks.
2. Build/render PR: build and both shards run with unchanged coverage.
3. Required-but-skipped check: Verification Integrity fails; report never says
   `PASSED`.
4. Seven categories, four statuses and one sticky comment unchanged.
5. `./freebuff-verify.sh` fails on a suite, type, build or size failure and
   states what it does not cover.
6. Every discovered spec is assigned exactly once; an unreachable or unmapped
   change selects every spec.
7. `PR_SUBMISSION.md` and README reference the correct `AGENTS.md` headings.
8. No Playwright baseline, project or test was changed.
