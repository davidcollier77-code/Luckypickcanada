# Implementation Plan: Playwright CLI Agent Toolkit

**Branch**: `freebuff/playwright-cli-agent-toolkit-20261109` | **Date**: 2026-11-09 | **Spec**: [spec.md](spec.md)

**Input**: `specs/122-playwright-cli-agent-toolkit/spec.md`

## Summary

Vendor Microsoft's official CLI skill v0.1.23 and complete reference library, add a Lucky Pick Canada-specific guide for the eight capability areas, provide a reusable setup/probe script, and direct Freebuff to the local CLI through `AGENTS.md`. Reuse the existing `playwright@1.64.1` package through `pnpm exec playwright cli`; do not add another CLI dependency or change the current Playwright Test / Visual QA stack.

## Technical Context

**Language/Version**: Node.js 22.x; Bash.
**Primary Dependencies**: Existing `playwright`, `@playwright/test`, `playwright-chromium` at 1.64.1; pnpm 10.30.3. No new package.
**Storage**: Version-controlled skill and references. Runtime profiles/auth state outside repository.
**Testing**: Vitest static integrity test with repository-root resolution from `process.cwd()`; setup script CLI help check; optional Chromium download and real headless probe; repository verification and CI.
**Target Platform**: Freebuff cloud Linux workspace and GitHub Actions Ubuntu runner.
**Project Type**: Existing Next.js web application and browser QA toolkit.
**Performance Goals**: No production runtime or application-bundle change.
**Constraints**: 495 MB build cap; no sudo/system package installation, secret changes, MCP configuration, or hosted-browser CI changes. Preserve existing test config and baselines.

## Constitution Check

- Single source of truth: PASS — `AGENTS.md` remains authoritative.
- Verify before acting: PASS — packages, Playwright config, Visual QA workflow, previous tool evaluation and Microsoft source inspected.
- Implementation sequence: PASS — Specify → Plan → Tasks → Implement, feature 122.
- Protect core systems: PASS — no application, payments, auth logic, database, deployment or secrets changed.
- Resource conservation: PASS — `.docs/` read-only; no new external dependency.
- Governance preservation: PASS — restore and retain the canonical final PR-summary requirement in `AGENTS.md`.
- PR ownership: PASS — leave PR open and unmerged.

## Phase 0 — Research

- Follow-up CI run 42648970780 on the original PR #1788 head passed the change classifier, but the full unit-test step failed in `__tests__/playwright-agent-toolkit.test.js` with `TypeError: The URL must be of scheme file`. The failing setup used `fileURLToPath(new URL('.', import.meta.url))`; Vitest's transformed module URL was not a `file:` URL.
- The repository's `test` script is `vitest run`, invoked by CI from the repository root. Resolve the project root from `process.cwd()` and fail with a clear diagnostic if the root `package.json` is absent. Do not weaken or skip the integrity assertions.
- The first PR head's DevSkim and OpenNext workflows passed. The unit-test failure prevented subsequent steps in the Visual QA job from running; Visual QA browser steps were not run on that docs-only head.

- Microsoft official `microsoft/playwright-cli` v0.1.23 skill explicitly documents using the local Playwright installation through `npx playwright cli`; in this repository, the pnpm equivalent is `pnpm exec playwright cli`.
- Existing `playwright`, `@playwright/test` and `playwright-chromium` packages are already aligned to 1.64.1. No `@playwright/cli` dependency is needed.
- Existing `playwright.config.ts` defines desktop 1440×900, mobile-390 390×844 and mobile-412 412×915. Existing Visual QA installs Chromium with system dependencies on GitHub Actions. Both remain unchanged.
- Prior evaluation found local cloud-VM Chromium can fail on missing Linux shared libraries. Browser download does not fix system packages; do not use sudo or change the VM. Follow `AGENTS.md` Browserless fallback.
- No further research artifact is necessary; findings and choices are recorded here and in the project guide.

## Phase 1 — Design

```text
.agents/skills/playwright-cli/
├── SKILL.md
├── LICENSE
├── UPSTREAM.md
└── references/
    ├── ten upstream Microsoft guides
    └── lucky-pick-canada.md
scripts/setup-playwright-agent.sh
__tests__/playwright-agent-toolkit.test.js
specs/122-playwright-cli-agent-toolkit/
├── spec.md
├── plan.md
├── tasks.md
└── checklists/requirements.md
```

Implementation decisions:
1. Pin the vendored Microsoft skill to v0.1.23; preserve all ten reference files and Apache-2.0 license.
2. Adapt the entrypoint to the project-local pnpm command; retain upstream reference text.
3. Keep project conventions, all eight capability areas, viewport projects, artifact and credential safeguards in a linked local guide.
4. Setup script validates local prerequisites and CLI. Browser download and actual browser launch are opt-in. Never install system packages.
5. Add Vitest static integrity coverage. No changes to package manifests, lockfile, playwright config, CI workflows, application files, `AGENTS.md` or `.docs/`.

## Project Structure Decision

The skill is stored under `.agents/skills/playwright-cli/`, the repository-level agent-skill location used by Microsoft. A project-specific linked reference avoids modifying upstream guides. `AGENTS.md` directs direct browser work to the vendored skill and `pnpm exec playwright cli`; the existing Playwright Test suite remains the automated regression gate. The integrity test resolves the repository root from the CI working directory and checks for `package.json` before reading repository files. The script and static test use existing repository paths.

## Complexity Tracking

No constitution violations or new architecture/dependencies.
