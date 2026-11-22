# Implementation Plan — PR Verification Streamlining

## Architecture

```
pull_request
 ├─ Visual QA workflow
 │   ├─ changes                     visual classifier (unchanged rules) + shadow selection report
 │   ├─ Application Verification    ALWAYS: python suites, full Vitest, docs tests, tsc
 │   └─ Visual QA shards 1/2, 2/2   conditional; planned per whole spec file
 ├─ Validate OpenNext
 │   ├─ changes                     build classifier (fail closed)
 │   └─ build validation            conditional; always on merge_group/dispatch
 ├─ DevSkim, PR Scope, Protected Files   unchanged
 ├─ Verification Integrity          trusted-base applicability + bounded wait + gate
 └─ PR Verification Report          trusted-base applicability + bounded wait + 7 categories
```

## Trust model

The executor runs the pull request head; the audit checks out the trusted base.
Both use the same committed rules and the pull request's actual file list. A
pull request that weakens its own classifier cannot change the trusted audit.
Unreadable input, an empty change set or an unexpected classifier result keeps
the check required.

## Applicability

- Build: every path outside the documentation/Spec Kit/Memory Bank/CI/test/agent
  metadata allowlist requires the build.
- Visual: `classify-visual-changes.sh` plus a declared `visual_impact.required`.
- A required check that is missing, skipped, cancelled or stale blocks.
- A check proven not applicable is `NOT RUN — not applicable` and does not warn.

## Playwright

- JSON reporter added alongside the configured reporters; a tested summary
  script writes per-spec timings and flake warnings.
- `tests/visual/shard-plan.json` supplies duration weights; the planner always
  discovers the specs itself, assigns whole files and asserts the union equals
  discovery with no duplicates.
- `tests/visual/impact-map.json` maps changed areas to specs; unmatched paths,
  shared chrome, unreachable specs and full sweeps select everything. Selection
  is shadow-only until the owner enables subset mode.
- No baseline, project, spec or configuration changes; `--forbid-only` guards
  against a stray focused test.

## Local gate

`freebuff-verify.sh` runs the frozen install, the Spec Kit gate, all Python
checker suites, TypeScript, the full Vitest suite, docs tests, the Next.js build
and a portable 495 MiB size check. It does not run Playwright, OpenNext, DevSkim
or deployment, and says so.

## Documentation

`PR_SUBMISSION.md`, the PR template, `README.md`, the Memory Bank and these
artifacts describe the same names, applicability rules, `NOT RUN` semantics and
coverage boundaries in the same PR.

## Rollout and rollback

The build gate is inert while the trusted base has no classifier (unknown keeps
the build required), so the rollout PR is audited under the old rules.
Reverting the workflow and classifier restores unconditional build validation.

## Deferred for separate owner approval

Dead checker modes (`security-summary`, `browser-summary`), obsolete root
scripts, deployment-workflow narrowing, subset selection and a third shard are
not part of this change.
