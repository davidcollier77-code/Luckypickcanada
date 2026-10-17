# Implementation Plan: Remove the No-op Code-scanning Debug Artifact

**Branch**: alert-autofix-16 | **Date**: 2026-10-17 | **Spec**: specs/026-code-scanning-noop-cleanup/spec.md

**Input**: Feature specification from specs/026-code-scanning-noop-cleanup/spec.md

## Summary

Delete the temporary root-level test_fix.js file rather than leaving behind an inert script after removing its no-op string replacement. Create task-specific Spec Kit artifacts and point .specify/feature.json at this task so the repository's fail-closed governance gate can verify fresh spec, plan, and tasks files. Add a pre-review free-quota guard plus bounded failure diagnostics to Robin, and an Amazon Q backup-review path when quota is low or Robin fails. Never log credentials/raw bodies; accept the backup only when it posts a substantive review for the exact current head; preserve fail-closed behavior if neither reviewer posts.

## Technical Context

**Language/Version**: JavaScript/TypeScript; Node.js 22 in CI  
**Primary Dependencies**: No new or changed dependency  
**Storage**: Not applicable  
**Testing**: Existing pnpm unit suite, TypeScript check, jules-verify.sh, OpenNext/Cloudflare validation, CodeQL, and Robin review outcome  
**Target Platform**: GitHub pull-request CI for a Next.js/Cloudflare repository  
**Project Type**: Existing web application maintenance  
**Performance Goals**: No runtime or performance change  
**Constraints**: No protected application behavior changes; no dependencies or secrets changed; all changes stay narrowly scoped; actual build size must stay below 495 MiB; the Robin diagnostic must be failure-only, bounded, secret-safe, and must not weaken CI or reviewer enforcement.

## Constitution Check

- AGENTS.md is canonical and was read before task work.
- SELECTED TASK GROUP: troubleshooting.
- No application runtime source, payments, authentication, database/schema, deployment settings, secrets, or dependencies are changed. .github/workflows/robin.yml is changed only to diagnose failures; no validation or reviewer gate is bypassed.
- Context7 was not invoked because repository rules require separate explicit owner approval for every invocation.
- The repo shell could not be reached from this session: a local git clone failed because the environment could not resolve github.com. Repository changes therefore use the GitHub repository API; GitHub Actions must provide execution evidence for shell-based checks.
- Initial evidence: Visual QA passed targeted and full unit tests and TypeScript, then failed specifically at the Spec Kit active-artifact check because specs/025-crystal-ball-audio-daily-limit/spec.md was unchanged on this PR branch. The active-artifact gate is now passing. Robin has failed across several unrelated PRs; each retry fails almost immediately. Pinned Robin v2.12.0 masks pre-first-chunk errors as a generic stall. The safe diagnostic confirmed the repository's OpenRouter key is accepted but its free-model quota was exhausted (0 remaining of 50). The updated workflow skips the five-attempt path when fewer than five free-model requests remain, requests an Amazon Q review, and only accepts it if it is a substantive review for the exact current head. CodeQL and OpenNext checks passed on the initial cleanup candidate.
- No local build-size result is claimed. The OpenNext validation workflow must supply measured output evidence.

## Project Structure

Task documentation is stored in specs/026-code-scanning-noop-cleanup/:
- spec.md — user need, requirements, and measurable acceptance criteria
- research.md — verified initial findings and constraints
- plan.md — this implementation plan
- quickstart.md — verification sequence and evidence expectations
- tasks.md — implementation and validation checklist
- checklists/requirements.md — specification quality checklist

The application-adjacent change is deletion of the root-level test_fix.js debugging artifact. The Robin workflow now has a read-only quota preflight, bounded diagnostics, and a real Amazon Q fallback review. It never passes solely because quota is exhausted or a workflow times out; it requires a substantive review for the exact head.

## Design

1. Inspect the exact PR diff, the current test_fix.js content, package.json scripts, the Spec Kit verifier and its caller, and the relevant workflow logs.
2. Remove the entire temporary debugging script because its remaining statements perform no test or production behavior.
3. Create a dedicated feature specification, quality checklist, plan, research notes, quickstart, and task list; update .specify/feature.json to point to this feature.
4. Add quota preflight in .github/workflows/robin.yml so fewer than five free-model requests skips Robin's five-attempt path.
5. On quota exhaustion or Robin failure, request Amazon Q review for the exact current head and poll for a substantive matching review; fail closed when no review appears.
6. Retain bounded, secret-safe provider diagnostics when Robin fails and sufficient quota remains.
7. Update the canonical PR Summary and Memory Bank without overwriting previous Memory Bank history.
8. Let the PR workflows execute the repository's actual tests and verification. Inspect their final outcomes, retry the transient Robin review once after the branch update, and do not claim full completion until required non-transient checks pass.
9. Correct the Playwright timing assumptions exposed by run #39038534341: await explicit homepage client hydration before waiting for Howler's local audio request/readiness, and give the three-answer daily quota test a 60-second budget for cold compilation plus animated reveals. Keep all product-behavior assertions intact and change no application code.

## Verification Strategy

- Run pnpm run test and pnpm tsc --noEmit through the Visual QA workflow.
- Run ./jules-verify.sh; confirm the governance artifact check passes and the build plus documentation tests proceed.
- Run the OpenNext/Cloudflare validation workflow; verify the production build and its explicit build-size gate against 495 MiB.
- Confirm CodeQL completes on the updated head and review the alert result.
- Inspect Robin outcome separately. A repeat upstream stall is an external blocker, not evidence of an application defect; do not weaken the check to make it green.
- Reconcile every changed path with the final PR diff and record run IDs/outcomes before declaring the task complete.
- On the follow-up Visual QA run, confirm the homepage checks actually see `data-hydrated="true"`, a request for `/sounds/confetti-pop.wav`, and `data-confetti-pop-ready="true"`; confirm the daily quota test still sees three successful answers, zero remaining, a disabled button, and three POSTs. The longer timeout is a bounded allowance, not a skipped assertion.


## Review hardening follow-up

Amazon Q review `5558036445` found three robustness issues before merge. The follow-up includes skipped-primary outcomes in the Q fallback trigger, explicitly redacts a non-empty API key without applying `replaceAll` to an empty pattern, and uses a 90-second polling deadline inside a 3-minute step and 7-minute job budget. Final enforcement still requires an actual review for the exact head SHA.
