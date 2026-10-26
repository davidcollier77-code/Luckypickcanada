# Implementation Plan: Smooth Jules Governance Workflow

**Branch**: `chore/smooth-jules-governance-20261026` | **Date**: 2026-10-26
**Spec**: `.specify/features/058-jules-governance-smoothing/spec.md`

## Summary

Keep the master request unchanged; tighten the root workflow, shorten the Jules entrypoint, remove the Gemini CLI standing requirement from task specialists, and simplify the single PR-summary contract.

## Scope and approach

- Update `AGENTS.md` to clarify document loading, execution-mode approvals, PR reporting, and safe recovery from publishing/branch problems.
- Replace `.jules/jules.md` with a shorter entrypoint that points to root governance rather than duplicating it.
- Remove only the mandatory Gemini CLI resource line from the eight task-group specialists and Sentinel specialist. Keep the Gemini API reference and Jules documentation/API resources.
- Preserve all existing safety, explicit-authorization, verification, build-size, and no-merge requirements.
- Add no application changes and do not modify the library Master Work Request.

## Verification

- Inspect the final diff and check that all affected specialists no longer require Gemini CLI for every task while retaining Gemini API.
- Confirm the Master Work Request is untouched and the PR summary reports exact verification status.
- `./jules-verify.sh` and repository CI must pass before the task is declared complete. Shell execution is unavailable in this authoring session, so this local check is not claimed as run.
