# Implementation Plan: Smooth Jules Governance Workflow

**Branch**: `chore/smooth-jules-governance-20261026` | **Date**: 2026-10-26
**Spec**: `.specify/features/058-jules-governance-smoothing/spec.md`

## Summary

Keep the master request unchanged; tighten the root workflow, shorten the Jules entrypoint, remove the Gemini CLI standing requirement from task specialists, add conditional CLI guidance to Creation/Troubleshooting/Deep-dive, align the documentation manifest, and simplify the single PR-summary contract.

## Scope and approach

- Update `AGENTS.md` to clarify document loading, execution-mode approvals, PR reporting, and safe recovery from publishing/branch problems.
- Replace `.jules/jules.md` with a shorter entrypoint that points to root governance rather than duplicating it.
- Remove the mandatory Gemini CLI resource line from the eight task-group specialists and Sentinel. Add conditional local-snapshot pointers only to `.jules/creation.md`, `.jules/troubleshooting.md`, and `.jules/deep-dive.md`; keep Gemini API and Jules documentation/API requirements.
- Update `.docs/manifest.json` so the Tuesday/Friday refresher maintains Gemini CLI snapshots only for Creation, Troubleshooting, and Deep-dive. Confirm `scripts/refresh-docs.js` uses the manifest and writes `.docs/`, not `.jules/`.
- Preserve all existing safety, explicit-authorization, verification, build-size, and no-merge requirements.
- Add no application changes and do not modify the library Master Work Request.

## Verification

- Inspect the final diff and check that all affected specialists no longer require Gemini CLI for every task while retaining Gemini API.
- Confirm the Master Work Request is untouched and the PR summary reports exact verification status.
- `./jules-verify.sh` and repository CI must pass before the task is declared complete. Shell execution is unavailable in this authoring session, so this local check is not claimed as run.
