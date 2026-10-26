# Implementation Plan: Secure JSON-LD Rendering and PR #1612 Repair

**Branch**: `jules-5660530544535426768-bb6cf813` | **Date**: 2026-10-26 | **Spec**: `spec.md`

**Input**: Task specification in `specs/055-secure-jsonld/spec.md`.

## Summary

Preserve the safe JSON-LD helper and server-rendered schemas, correct the missing JSX tag terminator in the FAQ component, reconcile the overlapping root PR summary with current `main`, and verify the resulting PR head without merging it.

## Technical Context

- **Language/Version**: JavaScript/JSX, Next.js App Router, repository Node.js engine 22.x.
- **Primary Dependencies**: Repository-pinned Next.js/React and existing `pnpm`/Vitest tooling; no dependency changes.
- **Storage**: None.
- **Testing**: `pnpm test`, `pnpm build`, `./jules-verify.sh`, and current-head GitHub Actions results.
- **Target Platform**: Next.js application and GitHub Actions / Cloudflare OpenNext build pipeline.
- **Project Type**: Web application and repository verification.
- **Performance Goals**: No performance change required.
- **Constraints**: Preserve visuals, behavior, validation, and JSON-LD escaping; build output must stay below 495 MB; do not merge the PR.

## Constitution Check

- Smallest in-scope correction; preserve unrelated application behavior: PASS.
- Security serialization remains enabled; no secrets, dependencies, API/payment/database/deployment changes: PASS.
- Current `main` work must be preserved while resolving the branch's shared-file overlap: REQUIRED.
- Claims must be backed by actual source comparison and test evidence: REQUIRED.
- PR must remain open and unmerged: REQUIRED.

## Phase 0 — Research

The current PR head and current `main` were inspected. The PR is 4 commits ahead and 31 behind the current main commit. The main-only diff since the merge base includes `PR_SUMMARY.md`, but does not include `app/homepage/FAQSection.js`, `app/layout.js`, or `app/page.js`. Current `main` also already contains a separate fix for the Gemini reviewer `MARKER` initialization failure. No new dependency or external documentation lookup is needed.

## Phase 1 — Design

1. Preserve `app/components/JsonLd.js` and its escaping of both angle brackets.
2. Keep the FAQ JSON-LD schema in server-rendered `app/page.js`; retain the seven currently matching FAQ questions and answers.
3. Add the missing `>` after the FAQ section's style prop in `app/homepage/FAQSection.js`; update the stale component comment to describe the client accordion, not JSON-LD injection.
4. Reconcile `PR_SUMMARY.md` with current `main` content before appending the security-PR evidence; preserve existing main summary content instead of restoring the stale branch copy.
5. Run required tests and verification only where executable; record local network/tool blockers honestly and inspect actual current-head CI.
6. Audit the final diff, confirm current PR mergeability, and leave the PR open/unmerged.

## Project Structure

```text
app/components/JsonLd.js
app/homepage/FAQSection.js
app/layout.js
app/page.js
PR_SUMMARY.md
specs/055-secure-jsonld/{spec.md,plan.md,tasks.md}
```

No new data model, contract, quickstart, dependency, or application architecture is needed.

## Verification Plan

- Static review: validate JSX opening/closing tags and the complete final diff.
- Security review: confirm `JsonLd` escapes `<` and `>` before `dangerouslySetInnerHTML`.
- Schema review: compare FAQ page schema and accordion content.
- Automated checks: `pnpm test`, `pnpm build`, and `./jules-verify.sh`; inspect CI on the exact final commit.
- Build size: measure if the build is successfully run and stop if it reaches 495 MB.
