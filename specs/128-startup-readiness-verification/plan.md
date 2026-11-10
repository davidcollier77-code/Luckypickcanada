# Implementation Plan: Startup Readiness Verification

**Branch**: `128-startup-readiness-verification` | **Date**: 2026-11-10 | **Spec**: spec.md

**Input**: Feature specification from specs/128-startup-readiness-verification/spec.md

## Summary

Add a small Bash startup verification script that checks repository governance/context files and validates the project document manifest. Preserve the existing pnpm and Playwright startup steps; the owner appends the new script invocation to the external Freebuff startup command after the PR is merged.

## Technical Context

**Language/Version**: Bash; Node.js 22.x for JSON parsing.
**Primary Dependencies**: Existing shell utilities and Node.js; no new packages.
**Storage**: Repository files only; no application or database data.
**Testing**: bash -n; positive execution from repository root and another working directory; negative tests for missing/empty files and malformed manifest; git diff --check; Spec Kit repository verification and PR CI.
**Target Platform**: Freebuff Linux workspace and GitHub checkout.
**Project Type**: Repository startup support script and documentation.
**Performance Goals**: Fast local checks with no network requests or dependency installation.
**Constraints**: Do not modify bootstrap, package files, workflows, integrations, application, deployment configuration or .docs library. Do not claim the script loads model context.
**Scale/Scope**: One Bash script and three Spec Kit artifacts, plus the feature pointer.

## Constitution Check

- Governance: PASS — AGENTS.md already requires reading all four Memory Bank files and consulting .docs/manifest.json.
- Spec Kit sequence: Specify → Plan → Tasks → Implement. Native setup scripts and shell verification still require execution in a full checkout.
- Preserve startup behavior: PASS by design — append the verifier after the existing pnpm bootstrap, frozen install and Playwright CLI help.
- Minimal change: PASS — no application, dependency, workflow, integration, deployment or document-library changes.
- Evidence: REQUIRED — shell syntax, positive/negative tests and CI must pass before completion is claimed.

## Phase 0 — Research

- Inspected AGENTS.md and confirmed its initialization section names all four Memory Bank files and .docs/manifest.json.
- Inspected the existing pnpm bootstrap and package metadata; the startup sequence uses a pinned pnpm bootstrap, frozen install and Playwright CLI help.
- Confirmed scripts/verify-startup.sh does not exist on the default branch.
- Inspected the manifest structure; it contains sources and inventory collections.
- No application task group applies; this is a repository startup/documentation task.
- Selected Web App QA & Release Copilot Get Started and regression-planning guidance. No browser-visible behavior changes.

## Phase 1 — Design

The verifier resolves the repository root from its own path, checks required files, confirms AGENTS.md retains the initialization references, parses and validates the manifest using Node.js, and prints a clear result. It explicitly distinguishes file availability from actual model-context loading.

No AGENTS.md change is needed because its existing initialization section already contains the required instructions. No change to scripts/bootstrap-pnpm.sh or package.json is needed.

## Project Structure

```text
scripts/verify-startup.sh
.specify/feature.json
specs/128-startup-readiness-verification/
  spec.md
  plan.md
  tasks.md
```

## Verification Plan

- Run bash -n scripts/verify-startup.sh.
- Run the script from the repository root and from another working directory.
- Test missing/empty required files and malformed manifest in a disposable copy or temporary fixture.
- Run git diff --check and ./freebuff-verify.sh.
- Confirm current-head PR CI. Documentation-only classification must be positively established; all other applicable gates still run.
- The external Freebuff startup-setting update remains an owner action after merge.
