# Implementation Plan: Keep the GSAP AI Reference Static

**Branch**: `chatgpt/227-gsap-static-reference-exemption-20261127` | **Date**: 2026-11-27 | **Spec**: `specs/227-gsap-static-reference-exemption/spec.md`

## Summary

Restore the GSAP Timeline snapshot from the exact official URL already present in the manifest, and retain the explicit static-reference allowlist entry in the existing updater. The updater records the GSAP ID in the refresh report and bypasses it when constructing the fetch queue. Its manifest route remains intact, so reconciliation and library consistency checks still require the restored local snapshot.

## Technical Context

**Language/Version**: CommonJS JavaScript, Node.js 26.x.  
**Dependencies**: Existing Node.js built-ins only; no new package.  
**Storage**: Existing `.docs/<group>/*.md` snapshots and `.docs/manifest.json`; only the existing GSAP Timeline Markdown snapshot is restored. The manifest is unchanged.  
**Testing**: `node scripts/test-refresh-docs.js`, which invokes the existing isolated end-to-end updater test.  
**Target Platform**: Existing GitHub Actions documentation-refresh runner (Node.js 26).

**Constraints**:
- Exclude only `/llmstxt/gsap_llms_txt`.
- Keep its group, inventory and source metadata; replace only the corrupted snapshot with the official Timeline documentation.
- Do not change updater schedules, workflows, application, dependencies, deployment configuration or AGENTS.md.
- Preserve the 495 MiB documentation-library cap and all existing updater safeguards.

## Constitution Check

| Principle | Assessment | Result |
| --- | --- | --- |
| Single source of truth | Current AGENTS.md and Spec Kit artifacts govern this task; no secondary governance is added. | PASS |
| Verify before acting | Live updater, manifest, tests, refresh and PR checker workflows, protected-file rules and Memory Bank were inspected. | PASS |
| Implementation sequence | Specify → plan → tasks → implement is recorded in this feature directory. | PASS |
| Protect core systems | No app, dependency, secret, payment, database, deployment or production resource changes. The updater script is protected and the PR will declare owner authorization; GitHub's separate environment gate remains required. | PASS |
| Evidence integrity | Regression coverage is added; Node 26-dependent local execution is not claimed under ChatGPT's Node 22 runtime. | PASS |

## Design

1. Define a narrow, explicit `Map` containing the one static GSAP reference ID and its rationale.
2. In `runRefresh`, detect the allowlisted ID while iterating the routed map, record it in `report.staticReferences`, and continue before adding it to `pendingUpdates`. This occurs before any upstream SHA lookup or download.
3. Keep the routed map unchanged. Manifest reconciliation, stale-snapshot cleanup and final consistency auditing continue to see the GSAP ID.
4. Add a distinct static-reference section and count to the existing Markdown/console refresh report.
5. Restore the checked-in snapshot from the official page already configured in `manifest.sources`, converting the rendered documentation page into readable Markdown and excluding navigation chrome and interactive UI.
5. Add a report-rendering assertion and extend the isolated end-to-end fixture to verify no GSAP network request, byte-identical snapshot content and intact manifest routing.

## QA and Delivery

- `scripts/refresh-docs.js` is a protected path under `.github/workflows/protected-files.yml`; include the exact Human Authorization declaration in the PR and leave the independent GitHub environment authorization gate intact.
- Root `scripts/` paths are not exempt from build or visual classification. The current build classifier requires the production build and the visual classifier requests Visual QA; do not bypass either workflow.
- Node.js 26.x / pnpm-dependent commands must run only in the repository's supported runtime. ChatGPT's current runtime is Node.js 22.x, so local project tests/build are not run here. GitHub checks are pending after PR creation.
- No manual browser evidence is required from the submitter; the existing Visual QA workflow owns Playwright execution.

## Project Structure

```text
scripts/refresh-docs.js
scripts/test-refresh-docs.js
scripts/test-refresh-docs-e2e.js
specs/227-gsap-static-reference-exemption/
  spec.md
  plan.md
  research.md
  tasks.md
.specify/feature.json
memory-bank/activeContext.md
memory-bank/techContext.md
memory-bank/progress.md
```
