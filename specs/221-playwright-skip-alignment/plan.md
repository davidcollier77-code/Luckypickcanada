# Implementation Plan: Playwright Alignment and Authorized QA Skips

**Branch**: `221-playwright-skip-alignment` | **Date**: 2026-11-26 | **Spec**: `specs/221-playwright-skip-alignment/spec.md`

**Input**: Feature specification from `/specs/221-playwright-skip-alignment/spec.md`

## Summary

Delete the custom Playwright cache validator and every conditional browser-install branch, and make the installed
lockfile the single source of truth: the CLI wrapper reinstalls a stale tree, the setup script fails closed on a
mismatch and on split package versions, and Visual QA runs one unconditional `playwright install --with-deps chromium`
under a version-derived cache key. No version is pinned outside `package.json`/`pnpm-lock.yaml`.

Add one shared `.github/scripts/qa_skip.py` contract for an authorized, proven-inapplicable skip. It defines the exact
per-item label `SKIPPED — NOT APPLICABLE`, three trusted authorities and a required specific reason. The audit, the
consolidated report and the scope checker use it so an authorized skip keeps its own label while the category and the
PR check stay green when every other applicable requirement passes; a real failure or an unauthorized skip can never
be green.

## Technical Context

**Language/Version**: Python 3 (GitHub checker scripts), Bash (setup/wrapper), JavaScript/ESM (Vitest contracts), GitHub Actions YAML.

**Primary Dependencies**: `playwright`, `@playwright/test`, `playwright-chromium` (one shared lockfile version), pnpm 10.30.3, Node.js 26.x. No new dependency.

**Storage**: N/A.

**Testing**: `python3 -m unittest` checker suites, Vitest, `bash -n`, `python3 -m py_compile`, `tsc --noEmit`, `./freebuff-verify.sh`.

**Target Platform**: GitHub Actions (Ubuntu) and the Freebuff Cloud Linux workspace.

**Project Type**: Web application repository with QA infrastructure.

**Performance Goals**: No runtime performance change. Visual QA keeps its version-keyed Chromium cache and adds at most one install command that Playwright short-circuits when the revision is present.

**Constraints**: No version bump, no new version-management system, no protected-file change, no deployment, no secret
change, build under 495 MiB.

**Scale/Scope**: Three checker scripts, one new shared module, two workflows, two shell scripts, one timing reporter,
their tests, and operational documentation.

## Constitution Check

*GATE: Must pass before and after design.*

- Repository preservation: only QA infrastructure, Playwright setup and documentation change; application, artwork,
  configuration, deployment, database, auth and secrets are untouched.
- Protected files: `package.json` and `pnpm-lock.yaml` are read but unchanged; `PR_SUBMISSION.md` is a governance path
  and needs a `governance_changes` declaration plus owner `/approve-governance` — the agent will not approve it.
- QA: the change tightens checker semantics instead of weakening them; every skip requires a documented authority and
  a specific reason, failures win, and unauthorized skips fail.
- Spec Kit: specify → plan → tasks → implement with this feature directory and the changed `.specify/feature.json`.
- Evidence: local results are recorded; PR-triggered checks are marked PENDING; the classifier-exempt build is not
  claimed as measured.

## Project Structure

### Documentation (this feature)

```text
specs/221-playwright-skip-alignment/
├── spec.md
├── plan.md
└── tasks.md
```

### Source Code (repository root)

```text
.github/scripts/
├── qa_skip.py                              # NEW shared skip contract
├── test_qa_skip.py                         # NEW contract tests
├── check_qa_pr_scope.py                    # + maintenance exemption, --commits
├── pr_verification_report.py               # + skip rendering, exemptions, --commits
├── verify_pr_verification_status.py        # + skip records, unexplained-skip blocking
├── report_visual_qa_install_timings.py     # log-derived Chromium state only
└── verify-playwright-cache.sh              # DELETED

.github/workflows/
├── visual-qa.yml                           # one unconditional Chromium install
├── pr-scope-verification.yml               # fetch commits, pass --commits
└── pr-verification-report.yml              # fetch commits, pass --commits

scripts/
├── playwright-cli.sh                       # lockfile-sync reinstall guard
└── setup-playwright-agent.sh               # fail-closed sync + version alignment

__tests__/                                  # updated workflow/wrapper contracts
PR_SUBMISSION.md, .github/pull_request_template.md, README.md
.agents/skills/playwright-cli/references/lucky-pick-canada.md
memory-bank/*.md
.specify/feature.json
```

## Design Decisions

### 1. Lockfile as the only version source

`node_modules/.pnpm/lock.yaml` is pnpm's record of the lockfile the tree was installed from. Comparing it with
`pnpm-lock.yaml` detects a stale tree without knowing any version. The wrapper reinstalls; the setup script refuses and
prints the repair command.

The setup script additionally reads the three installed `package.json` files and requires one shared version, and
checks that a simple declared range matches it. This is version-agnostic: an update by Dependabot or the owner passes
without edits.

### 2. One unconditional browser install

`playwright install --with-deps chromium` already checks the revision recorded by the installed `playwright-core`:
present means no download, missing means download, and system dependencies are provisioned either way. The custom
`verify-playwright-cache.sh` accepted any executable revision and duplicated that logic; it is removed. The cache key
stays `playwright-chromium-${{ runner.os }}-${{ version }}` with no `restore-keys`, so a version change invalidates a
stale cache instead of reusing it.

### 3. Shared skip contract

`qa_skip.py` is intentionally small: `LABEL`, three authorities, `valid_reason`, `is_authorized`, `record`,
`is_authorized_record`, `display_status`, and `dependabot_maintenance`. No PR text, label, owner waiver or free-form
string can create an authorized skip.

Status matrix:

| Situation | Item | Category | Overall / GitHub check |
| --- | --- | --- | --- |
| Trusted authority + specific reason, other applicable checks pass | `SKIPPED — NOT APPLICABLE` | `PASSED` | success |
| Authorized skip but an applicable check fails | skip label on the skipped item; failure on the failed item | `FAILED` | failure |
| Observed failed run on a claimed-inapplicable check | `FAILED` | `FAILED` | failure |
| `applicable: false` with no authority/reason | `NOT RUN` | `FAILED` (integrity) | failure |
| Conditional run actually skipped/cancelled, no trusted proof | `NOT RUN`, blocking | `FAILED` (integrity) | `NOT VERIFIED` |
| Conditional check missing, applicability unknown | `NOT RUN` | `WARNING` | not green |
| Head commit has `[skip ci]` / `skip-checks: true` | `NOT RUN` | `FAILED` (integrity) | failure |

### 4. Dependabot exemption

`dependabot_maintenance(pr, commits, files)` verifies: author login `dependabot[bot]`, actor type `Bot`; at least one
commit; every commit top-level author `dependabot[bot]`, commit author email
`49699333+dependabot[bot]@users.noreply.github.com`, committer `noreply@github.com`; every path is `package.json`
(any directory), a lockfile, `.github/dependabot.yml` or `.github/workflows/*.yml`. Missing or malformed evidence is
unverified. It never covers the environment-protected human authorization gate.

### 5. Scope checker missing vs malformed

`MissingDeclaration` is raised only when neither marker appears. `validate` catches it, verifies the maintenance
exemption and returns a `PASS` report carrying the skip record. Duplicate markers, invalid JSON or a missing
`version` still raise `ScopeError`, which fails. The workflow and report pass commit evidence with `--commits`; without
it the exemption cannot be verified, so the declaration remains required.

### 6. Timing reporter

The workflow no longer has a `(cache miss)` step, so the reporter reads the Chromium cache hit/miss and key from the
`@actions/cache` restore lines. A job with no restore step reports `n/a`; a job with one but no readable log reports
`unknown`.

## Risks and Mitigations

- **A skip hides a real failure.** Mitigation: an observed failed run outranks the skip in both the audit and the
  report; the report tests this explicitly.
- **The Dependabot exemption is too broad.** Mitigation: all conditions are required, the path allowlist is tiny, and
  a mixed update or a human commit keeps the declaration required.
- **The unconditional install slows CI.** Mitigation: Playwright short-circuits when the pinned revision is present;
  the install command is a no-op apart from dependency provisioning. CI timing remains measured by the existing
  reporter.
- **A checker change weakens verification.** Mitigation: every removed validation is replaced by Playwright's own
  revision check; the four statuses and seven categories are unchanged; the failure paths are covered by tests.

## Verification

1. `python3 -m py_compile` on every changed checker; `bash -n` on every changed script.
2. `PYTHONPATH=.github/scripts python3 -m unittest` for all checker suites, including the new `test_qa_skip`.
3. `pnpm exec tsc --noEmit`; the focused Vitest contracts; `./freebuff-verify.sh` for the full suite and build.
4. Runtime: `bash scripts/setup-playwright-agent.sh --install-browser --probe-browser`, and a wrapper dry run.
5. Static contract checks: no operational hardcoded version/revision; no `verify-playwright-cache.sh` reference outside
   dated historical artifacts.
