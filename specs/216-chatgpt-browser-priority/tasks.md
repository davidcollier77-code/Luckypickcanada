---
description: "Tasks for the ChatGPT browser-access priority governance update"
---

# Tasks: ChatGPT Browser Access Priority

**Input**: Design documents from `specs/216-chatgpt-browser-priority/`

**Prerequisites**: `spec.md`, `plan.md`

**Tests**: Update the existing governance regression test. Execution is delegated to current-head GitHub CI because ChatGPT's local repository test environment is unavailable under the required startup and ChatGPT-only restrictions.

## Phase 1: Specify, Plan and Tasks

- [X] T001 Complete `specs/216-chatgpt-browser-priority/spec.md` with the priority, constraints and acceptance criteria.
- [X] T002 Complete `specs/216-chatgpt-browser-priority/plan.md` against the repository constitution and QA requirements.
- [X] T003 Complete this task list before implementation.

## Phase 2: Implement the Browser Priority

- [X] T004 Replace only the ChatGPT-only browser-access paragraph in `AGENTS.md`; leave shared Playwright, Freebuff and prohibited-tool requirements unchanged.
- [X] T005 Update `__tests__/agent-governance-single-source.test.js` to assert Python Playwright first, Browserless second and Firecrawl third, while retaining the shared automatic PR-checker Playwright assertion.
- [X] T006 Update `.specify/feature.json` to point to this feature.
- [X] T007 Add a durable, concise milestone to `memory-bank/progress.md`.

## Phase 3: Review and Submit

- [X] T008 Review all changed files against the requested scope, the governance protection classifier, PR scope rules and all seven QA checker responsibilities.
- [X] T009 Prepare the complete PR description with the exact protected-file and pre-submission review declarations, exact file purposes, Spec Kit stages, Library and Memory Bank reporting, and honest verification states.
- [X] T010 Open one regular, non-draft PR targeting `main`; leave it open and unmerged for the owner.

## Verification Record

- ChatGPT Library startup preflight: completed; reported Node.js 22.16.0 (repository requires 26.x), pnpm unavailable and Git available.
- Local governance regression test: **NOT RUN** — current ChatGPT startup environment does not provide the repository's required Node.js 26.x and pnpm 10.30.3; ChatGPT-only repository instructions prohibit running project tests or scripts in this environment.
- Application Verification and the seven-category PR report: **PENDING** — GitHub workflows run after PR creation and must report against its current HEAD.
- Visual QA / Playwright shards: expected to be **NOT RUN — not applicable** for the documentation, feature-record and governance-test paths; accept only the trusted classifier and current-head report result.
- Production build and size measurement: **NOT RUN** — no application or build inputs changed; the ChatGPT environment is not authorized to run the repository build. Do not infer a measured build size for this task.

## Remaining

- The repository owner must provide the digest-bound `/approve-governance <digest>` comment and separately complete the protected-file GitHub Environment authorization before merge.
- Current-head automated QA and the seven-category verification report remain pending after PR creation.
