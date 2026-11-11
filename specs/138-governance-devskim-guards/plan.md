# Implementation Plan: Protect Agent Governance and Repair DevSkim Benchmark Filtering

**Branch**: `138-governance-devskim-guards` | **Date**: 2026-11-11 | **Spec**: [spec.md](spec.md)

**Input**: Owner-authorized correction of the governance protection gap, stale governance assertions and DevSkim's missing benchmark-path helper.

## Selected Task Groups

- `security` — preserve the owner-approval boundary around the authoritative agent instructions and keep scanner suppression narrow.
- `troubleshooting` — trace the actual failing CI call and correct the missing helper that caused the NameError.
- `testing` — align active regression tests with current policy and add positive and negative cases for the exact benchmark path scope.
- `deep-dive` — inspect the current workflow, suppression pipeline, prior corrective commit, real benchmark paths and validation requirements before editing.

## Summary

Add `AGENTS.md` to the existing protected-file authorization workflow and CODEOWNERS rule. Replace stale governance-test assertions with checks against the current `AGENTS.md` contract and test that its protection cannot silently disappear. Restore the missing DevSkim helper using an exact filename and path allowlist for `perf-baseline.json` and `perf-after.json` under numbered Spec Kit feature directories. Preserve the existing source-span, valid-JSON and loopback-URL checks.

## Technical Context

**Language/Version**: Python 3 standard library; JavaScript/Node.js with Vitest.

**Primary Dependencies**: Existing repository tooling only; no new packages.

**Storage**: No application or production data changes.

**Testing**: Python `unittest` and `py_compile`; focused Vitest and full Vitest; `./freebuff-verify.sh`; existing GitHub Protected File Changes and DevSkim workflows.

**Target Platform**: GitHub Actions on `ubuntu-latest`; repository governance and CI.

**Project Type**: Repository CI, security-filter and governance-test maintenance.

**Performance Goals**: No material runtime or application performance change.

**Constraints**:
- Do not change `AGENTS.md`.
- Do not change application behavior, scanner scope, unrelated suppression rules, dependencies or `.docs/`.
- Do not modify PR #1818 or its branch.
- Keep production build below 495 MiB and require measured evidence before PR submission.

## Design Decisions

1. Reuse the existing Protected File Changes workflow and its configured `protected-file-authorization` environment; add the exact path to both the workflow trigger and runtime detection list.
2. Add a CODEOWNERS entry for `/AGENTS.md` so owner review is requested under the repository's existing review settings.
3. Test the live policy by asserting stable requirements and workflow behavior, not obsolete headings or copied descriptions of integrations.
4. Define one strict helper for the two actual Spec Kit performance artifact filenames. Require a three-digit-or-longer numbered feature folder, exactly three path segments and no suffix/nested-path variation.
5. Leave the downstream JSON parsing, URL matching, source-span validation and SARIF replay behavior unchanged.

## Project Structure

```text
.github/
├── CODEOWNERS
├── workflows/
│   └── protected-files.yml
└── scripts/
    ├── suppress_devskim_false_positives.py
    └── test_suppress_devskim_false_positives.py
__tests__/
└── agent-governance-single-source.test.js
specs/138-governance-devskim-guards/
├── spec.md
├── plan.md
└── tasks.md
```

**Structure Decision**: Update only the two active CI protection files, the governance test, the DevSkim suppressor and its focused regression suite. Keep implementation artifacts in one new numbered Spec Kit feature directory. Do not update shared Memory Bank active context because it currently records the separately owned PR #1818 task.

## Verification Plan

- Run `python3 -m py_compile .github/scripts/suppress_devskim_false_positives.py`.
- Run `python3 -m unittest discover -s .github/scripts -p 'test_suppress_devskim_false_positives.py'`.
- Run `pnpm exec vitest run __tests__/agent-governance-single-source.test.js`.
- Run the full `pnpm exec vitest run` suite.
- Run `./freebuff-verify.sh`, including the Spec Kit gate, TypeScript, production build and documentation tests.
- Validate the protected-file workflow and current-head PR evidence behavior.
- Measure the production build and confirm it remains strictly below 495 MiB.
- Review the complete diff and confirm `AGENTS.md` and PR #1818 are untouched.

No PR may be submitted until all applicable pre-submission checks are run and their results are recorded in accordance with `PR_SUBMISSION.md`.
