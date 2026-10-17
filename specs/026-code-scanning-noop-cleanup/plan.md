# Implementation Plan: Remove the No-op Code-scanning Debug Artifact

**Branch**: alert-autofix-16 | **Date**: 2026-10-17 | **Spec**: specs/026-code-scanning-noop-cleanup/spec.md

**Input**: Feature specification from specs/026-code-scanning-noop-cleanup/spec.md

## Summary

Delete the temporary root-level test_fix.js file rather than leaving behind an inert script after removing its no-op string replacement. Create task-specific Spec Kit artifacts and point .specify/feature.json at this task so the repository's fail-closed governance gate can verify fresh spec, plan, and tasks files. Keep the change limited to cleanup and governance records; do not alter app source, dependencies, workflow enforcement, or review policy.

## Technical Context

**Language/Version**: JavaScript/TypeScript; Node.js 22 in CI  
**Primary Dependencies**: No new or changed dependency  
**Storage**: Not applicable  
**Testing**: Existing pnpm unit suite, TypeScript check, jules-verify.sh, OpenNext/Cloudflare validation, CodeQL, and Robin review outcome  
**Target Platform**: GitHub pull-request CI for a Next.js/Cloudflare repository  
**Project Type**: Existing web application maintenance  
**Performance Goals**: No runtime or performance change  
**Constraints**: No protected application behavior changes; all changes stay narrowly scoped; actual build size must stay below 495 MiB; do not weaken CI or reviewer enforcement.

## Constitution Check

- AGENTS.md is canonical and was read before task work.
- SELECTED TASK GROUP: troubleshooting.
- No application runtime source, payments, authentication, database/schema, deployment settings, secrets, dependencies, or workflows are changed.
- Context7 was not invoked because repository rules require separate explicit owner approval for every invocation.
- The repo shell could not be reached from this session: a local git clone failed because the environment could not resolve github.com. Repository changes therefore use the GitHub repository API; GitHub Actions must provide execution evidence for shell-based checks.
- Initial evidence: Visual QA passed targeted and full unit tests and TypeScript, then failed specifically at the Spec Kit active-artifact check because specs/025-crystal-ball-audio-daily-limit/spec.md was unchanged on this PR branch. Robin failed because OpenRouter never delivered the first response chunk after retries. CodeQL and OpenNext checks passed on the initial candidate.
- No local build-size result is claimed. The OpenNext validation workflow must supply measured output evidence.

## Project Structure

Task documentation is stored in specs/026-code-scanning-noop-cleanup/:
- spec.md — user need, requirements, and measurable acceptance criteria
- research.md — verified initial findings and constraints
- plan.md — this implementation plan
- quickstart.md — verification sequence and evidence expectations
- tasks.md — implementation and validation checklist
- checklists/requirements.md — specification quality checklist

The only application-adjacent file change is deletion of the root-level test_fix.js debugging artifact. No application source code is modified.

## Design

1. Inspect the exact PR diff, the current test_fix.js content, package.json scripts, the Spec Kit verifier and its caller, and the relevant workflow logs.
2. Remove the entire temporary debugging script because its remaining statements perform no test or production behavior.
3. Create a dedicated feature specification, quality checklist, plan, research notes, quickstart, and task list; update .specify/feature.json to point to this feature.
4. Update the canonical PR Summary and Memory Bank without overwriting previous Memory Bank history.
5. Let the PR workflows execute the repository's actual tests and verification. Inspect their final outcomes, retry the transient Robin review once after the branch update, and do not claim full completion until required non-transient checks pass.

## Verification Strategy

- Run pnpm run test and pnpm tsc --noEmit through the Visual QA workflow.
- Run ./jules-verify.sh; confirm the governance artifact check passes and the build plus documentation tests proceed.
- Run the OpenNext/Cloudflare validation workflow; verify the production build and its explicit build-size gate against 495 MiB.
- Confirm CodeQL completes on the updated head and review the alert result.
- Inspect Robin outcome separately. A repeat upstream stall is an external blocker, not evidence of an application defect; do not weaken the check to make it green.
- Reconcile every changed path with the final PR diff and record run IDs/outcomes before declaring the task complete.
