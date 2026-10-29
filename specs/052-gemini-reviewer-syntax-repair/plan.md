# Implementation Plan: Gemini Reviewer Startup Repair

**Branch**: `fix/gemini-reviewer-targeted-fix-guard-20261028` | **Date**: 2026-10-28 | **Spec**: `specs/052-gemini-reviewer-syntax-repair/spec.md`

## Summary

Repair the repeated JavaScript parse failure in the trusted Gemini reviewer entrypoint. The failed job shows `SyntaxError: await is only valid in async functions and the top level bodies of modules` at line 952. In the targeted-fix path, the no-match response is missing its `if (!requestedFindings.length) {` opening guard, leaving an unmatched closing brace that ends the async handler before `collectSourceContext`. Restore the guard and add regression assertions for its placement.

## Technical Context

**Language/Version**: Existing CommonJS JavaScript executed by the GitHub Actions Node runtime; no runtime change.  
**Primary Dependencies**: Node.js built-ins and the repository's existing Vitest test setup; no dependency changes.  
**Storage**: None.  
**Testing**: `pnpm test`; the existing reviewer test runs `node --check` against the reviewer scripts; `./jules-verify.sh`; Visual QA; OpenNext/Cloudflare validation.  
**Target Platform**: GitHub Actions on the repository's existing Linux runner.  
**Project Type**: CI/reviewer automation.  
**Performance Goals**: No performance change is required for this syntax repair.  
**Constraints**: Keep the trusted-base checkout, permissions, secret handling, model fallback chain, and app behavior unchanged. Do not merge the PR.

## Constitution Check

- Scope is limited to the reviewer script, its regression test, the task's Spec Kit artifacts, a necessary active-context correction, and the stale Visual QA assertion discovered while validating the PR: PASS.
- No protected payment, database, authentication, deployment, or application API surface changes: PASS.
- Existing validation and trusted-code execution boundaries are preserved: PASS.
- Tests and `./jules-verify.sh` must be supported by actual current-head evidence; they are not claimed passed from this API-only session: PASS.

## Phase 0 — Research

Research covered the failed job logs, the workflow's trusted-base checkout, the exact source lines, the existing reviewer regression test, the package test script, and routed troubleshooting resources. The log identifies `SyntaxError: await is only valid in async functions and the top level bodies of modules` at line 952; the earlier syntax-repair finding was already merged and is distinct from this recurrence. The Visual QA log also showed that `tests/visual/turnstile-loading.spec.ts` still expected a preload that the current PageSpeed optimization deliberately removed in `.specify/features/mobile-pagespeed-optimization/plan.md`. No new dependency or external API research is needed.

## Phase 1 — Design

- Update `.github/scripts/gemini-reviewer.cjs` to restore the targeted-fix no-match guard before the no-match message and before loading `gemini-autofix.cjs`.
- Update `__tests__/gemini-reviewer-workflow.test.ts` to assert guard/message/module ordering; retain existing mode-validation and syntax-check coverage.
- Align `tests/visual/turnstile-loading.spec.ts` with the active PageSpeed decision by asserting no eager Turnstile preload on `/` or `/about`. Do not reintroduce the critical-path preload or change Turnstile widget/server validation.
- Correct escaped-newline formatting in the current feature specification and maintain the existing `memory-bank/activeContext.md` note.
- No data model, external contract, new dependency, application UI, or manual quickstart is needed.

## Verification Follow-up

The first PR-head Visual QA run had 24 Playwright tests pass and three browser-project variants fail on the same stale preload assertion. Unit tests, standalone TypeScript, repository governance/Spec Kit verification, committed-baseline verification, OpenNext build validation, DevSkim, and updater scheduler checks passed on that preceding head. The updated visual test now matches the active PageSpeed plan; current-head workflow results must be inspected before reporting completion.

## Safety Boundary

The Gemini reviewer intentionally checks out trusted `main`, not PR-head code. The syntax fix can be checked by PR-head regression tests, but end-to-end trusted-base reviewer success requires an owner-controlled merge and a fresh eligible reviewer run. No agent may merge the PR.
