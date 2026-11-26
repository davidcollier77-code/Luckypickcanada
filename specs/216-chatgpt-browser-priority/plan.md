# Implementation Plan: ChatGPT Browser Access Priority

**Branch**: `chatgpt/216-chatgpt-browser-priority` | **Date**: 2026-11-24 | **Spec**: `specs/216-chatgpt-browser-priority/spec.md`

**Input**: Feature specification from `specs/216-chatgpt-browser-priority/spec.md`

## Summary

Replace only the obsolete ChatGPT-only browser-access paragraph in `AGENTS.md` with the ordered Python Playwright, Browserless and Firecrawl policy. Update the existing governance regression assertion so it protects the new rule, update the active Spec Kit feature pointer and record the durable policy milestone. Preserve all shared QA and Freebuff browser requirements.

## Technical Context

**Language/Version**: Markdown and JavaScript (governance test only); no application-language change.

**Primary Dependencies**: None added or changed.

**Storage**: Git-tracked documentation and test files only.

**Testing**: Existing Vitest governance regression test in `__tests__/agent-governance-single-source.test.js`; GitHub Application Verification.

**Target Platform**: GitHub repository governance; no production runtime change.

**Project Type**: Existing Next.js application repository; this task changes governance documentation and its regression test only.

**Performance Goals**: No runtime or performance change.

**Constraints**: Keep the edit surgical; preserve the shared Playwright requirement, Freebuff rules, prohibited ChatGPT tooling and all QA workflows. Do not run project operations that require Node.js 26.x under ChatGPT's Node.js 22.x runtime. The startup preflight reported Node.js 22.16.0 instead of the required 26.x and no pnpm executable. Current `AGENTS.md` §6 permits independent repository scripts, QA checkers and PR-support utilities when their own runtime, prerequisites, permissions and side effects are acceptable; the repository Playwright CLI/setup remains unavailable.

**Scale/Scope**: One ChatGPT-only policy paragraph, one existing regression test, one Spec Kit feature pointer, three feature artifacts and one concise Memory Bank milestone.

## Constitution Check

- **Single Source of Truth**: `AGENTS.md` remains authoritative; the Spec Kit records and regression test complement it.
- **Verify Before Acting**: Live `AGENTS.md`, the feature pointer, templates, QA workflows, governance classifier, QA report and scope checker were inspected before editing.
- **Implementation Sequence**: Specify, Plan, Tasks and Implement are completed in order and recorded in this feature directory.
- **Protect Core Systems**: No application, payment, authentication, database, security, hosting, deployment, secrets or production configuration is changed.
- **Resource Conservation**: No dependency, paid service, repository setup script or browser binary is added.

**Gate result**: PASS.

## Project Structure

### Documentation (this feature)

```text
specs/216-chatgpt-browser-priority/
├── spec.md
├── plan.md
└── tasks.md
```

### Source and tests

```text
AGENTS.md
.specify/feature.json
__tests__/agent-governance-single-source.test.js
memory-bank/progress.md
```

**Structure Decision**: Keep the policy in the existing ChatGPT-only browser-access rule, encode its contract in the existing governance test, point Spec Kit at this feature, and add one durable progress entry. Do not create a new test harness or browser workflow.

## QA Requirements and Verification

- The existing governance test asserts the ChatGPT startup, tool restrictions, repository execution boundaries and the shared automatic PR-checker Playwright rule. Its obsolete assertions that ChatGPT cannot execute Playwright and that Browserless is first must be replaced by assertions for the new priority.
- The PR scope checker requires exact changed paths, one purpose per file and a digest-bound governance approval for `AGENTS.md` and the governance regression test.
- The dedicated AGENTS protection classifier permits the feature pointer, Spec Kit feature records and Memory Bank progress record alongside the governance change. The protected-file environment gate remains separate.
- The consolidated PR report has seven categories. DevSkim and the QA Checker run against the current diff; Application Verification runs the governance test; Visual QA is not expected for these non-rendering paths; current-head integrity and protected-file approvals remain independently checked.
- Node-26-dependent local tests, builds and pnpm-based verification were not run in this ChatGPT session because Node.js 26.x and pnpm 10.30.3 were unavailable. Compatible repository scripts remain permitted under `AGENTS.md` §6 when their prerequisites and safety conditions are met. GitHub CI is the required source of executed test evidence after PR creation.

## Deferred

- No change to the ChatGPT Library startup script; it remains the source used to prepare and preflight the Python Playwright environment.
- No changes to Browserless or Firecrawl integrations, their credentials, service configuration or pricing.
- No changes to Freebuff's browser-access instructions or the repository's automatic Playwright workflows.
