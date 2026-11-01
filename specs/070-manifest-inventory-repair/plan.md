# Implementation Plan: Restore Valid Documentation Manifest

**Branch**: `fix/docs-manifest-inventory-20261101` | **Date**: 2026-11-01 | **Spec**: `specs/070-manifest-inventory-repair/spec.md`

**Input**: Feature specification for the owner-authorized manifest syntax and inventory correction.

## Summary

Repair one malformed inventory block in `.docs/manifest.json`: insert the missing comma, replace the duplicate Gemini API Developer Skill inventory entry with the missing MDN image-types entry, and preserve all other manifest data.

## Technical Context

**Language/Version**: JSON; Node.js 22+ for verification.

**Primary Dependencies**: None.

**Storage**: Repository documentation index file only; no database or persistent application data.

**Testing**: Node.js JSON parsing, inventory-to-group set comparison, and current-head GitHub Actions.

**Target Platform**: Repository tooling and CI.

**Project Type**: Documentation/tooling metadata for a Next.js web application.

**Performance Goals**: No runtime performance impact.

**Constraints**: Do not run the documentation refresh, alter its implementation, edit generated snapshots, change source URLs/group membership, or modify unrelated files. The manifest edit is specifically authorized by the repository owner.

**Scale/Scope**: One manifest file plus three small Spec Kit artifacts and the active feature pointer.

## Constitution Check

- **Single source of truth**: PASS — preserve `AGENTS.md`; use the manifest as the authoritative documentation index.
- **Verify before acting**: PASS — reproduced the JSON parse error and compared the inventory against the configured groups.
- **Implementation sequence**: PASS — specify, plan, tasks, implement, then verify.
- **Protect core systems**: PASS — no payment, authentication, database, deployment, secrets, or application code changes.
- **Resource and documentation controls**: PASS — only the specifically authorized `.docs/manifest.json` correction is made; no snapshots are refreshed and no updater is run.

## Design

- Add the missing comma after `/google/eng-practices`.
- Retain one `/google-gemini/gemini-skills/gemini-api-dev` inventory entry.
- Add `/websites/mdn_image_types` once because it remains routed by the configured groups.
- Leave all `groups` arrays and `sources` URLs unchanged.
- Keep the change confined to the manifest and task artifacts.

## Verification

1. Parse `.docs/manifest.json` using Node.js `JSON.parse`.
2. Assert that inventory has 51 entries, all unique, and equals the union of configured group references.
3. Run repository unit tests, TypeScript, Spec Kit governance, Visual QA, OpenNext, and security workflows as available.
4. Confirm no documentation refresh script, snapshot, workflow, or application file changed.

## Project Structure

```text
.docs/manifest.json
.specify/feature.json
specs/070-manifest-inventory-repair/
├── spec.md
├── plan.md
└── tasks.md
```

**Structure Decision**: A small metadata repair requires no application source changes, data model, API contracts, or manual quickstart. Automated validation is the direct test.
