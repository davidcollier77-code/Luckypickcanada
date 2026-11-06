# Implementation Plan: Custom Gemini PR Reviewer Retirement

**Branch**: `chore/retire-custom-gemini-reviewer-20261106` | **Date**: 2026-11-06 | **Spec**: `specs/097-gemini-reviewer-retirement/spec.md`

**Input**: Feature specification from `specs/097-gemini-reviewer-retirement/spec.md`

## Summary

Delete the active custom Gemini PR-review workflow, its two API-calling Node scripts, its instruction file, and its four exclusive test suites. Add one focused retirement regression test. Update only the active feature pointer and current Memory Bank status. Preserve Pullfrog, other reviewers, the site Oracle, all secrets/configuration, historical specs, and shared documentation.

## Technical Context

**Language/Version**: GitHub Actions YAML, Node.js 22.x, TypeScript test source, Markdown.

**Primary Dependencies**: Existing Node.js / Vitest toolchain only; no new dependencies.

**Storage**: Git repository files only.

**Testing**: Focused Vitest retirement test, full `pnpm exec vitest run`, and `./freebuff-verify.sh`.

**Target Platform**: GitHub repository and GitHub Actions.

**Project Type**: Next.js application repository with CI workflows and repository automation.

**Performance Goals**: No runtime code or application performance change.

**Constraints**: 495 MB production build hard maximum; no secret or environment changes; no edits to Pullfrog, other reviewers, Oracle, dependencies, application code, `.docs/`, or historical Spec Kit records.

## Constitution Check

- **Single source of truth**: PASS — `AGENTS.md` remains authoritative; feature artifacts record scope and evidence only.
- **Verify before acting**: PASS — current main tree, active reviewer files, workflow inventory, Pullfrog workflow, Oracle source, open PRs, and historical references were inspected.
- **Implementation sequence**: PASS — specify, plan, tasks, implement in order.
- **Protect core systems**: PASS — no secret, Cloudflare, Oracle runtime, payment, database, or application configuration is changed.
- **Resource conservation**: PASS — no Context7 calls, dependency changes, or documentation refresh.

## Design

### Removal set

- `.github/workflows/gemini-reviewer.yml`
- `.github/scripts/gemini-reviewer.cjs`
- `.github/scripts/gemini-autofix.cjs`
- `GEMINI_REVIEWER.md`
- `__tests__/gemini-reviewer-context.test.ts`
- `__tests__/gemini-reviewer-trigger.test.ts`
- `__tests__/gemini-reviewer-workflow.test.ts`
- `__tests__/gemini-reviewer-quality.test.ts`

All four removed tests directly import the retired scripts or assert the retired workflow/instruction file. They cannot remain as runnable suites after their sole subject is removed.

### Regression protection

Add `__tests__/reviewer-retirement.test.ts` to assert:
1. All active custom Gemini reviewer entrypoints and exclusive suites are absent.
2. No remaining workflow references the removed reviewer script.
3. Pullfrog's workflow and `GEMINI_API_KEY` wiring remain present.
4. The Oracle source still uses its Gemini runtime key.
5. Historical retirement/reviewer records, Gemini CLI snapshots, and the documentation manifest remain present.

### Protected files

Do not modify `.github/workflows/pullfrog.yml`, `functions/api/oracle.js`, `.docs/**`, existing `specs/**` Gemini records, any secret, or any other reviewer file. Their base-commit contents are the preservation baseline.

### Memory / feature tracking

Update `.specify/feature.json` to point to this feature. Add a current retirement record at the top of `memory-bank/activeContext.md` and `memory-bank/progress.md`; retain all existing historical sections verbatim.

## Project Structure

```text
specs/097-gemini-reviewer-retirement/
├── spec.md
├── plan.md
└── tasks.md

.github/workflows/                 # delete only gemini-reviewer.yml
.github/scripts/                   # delete only the two Gemini reviewer scripts
__tests__/
├── reviewer-retirement.test.ts    # add
└── gemini-reviewer-*.test.ts      # delete the four exclusive suites
GEMINI_REVIEWER.md                 # delete
.specify/feature.json              # point to feature 097
memory-bank/activeContext.md       # prepend retirement state
memory-bank/progress.md            # prepend retirement milestone
```

**Structure Decision**: Keep this as a repository-maintenance feature with one dedicated Vitest regression guard and the existing Spec Kit / Memory Bank record locations. No app or dependency changes.

## Phase 0 — Research

No external API or SDK research is required. This task removes the custom API-calling integration; it does not migrate, reconfigure, or extend Gemini API use. Repository inspection identified the separate Pullfrog and Oracle references that must remain.

## Verification Plan

- `pnpm exec vitest run __tests__/reviewer-retirement.test.ts`
- `pnpm exec vitest run`
- `./freebuff-verify.sh`
- Inspect all PR-head checks and the complete base-to-head diff.
- Compare protected Pullfrog and Oracle files against the base commit and confirm they are unchanged.
