# Implementation Plan: Freebuff Agent Reference Library Expansion

**Branch**: `docs/agent-reference-expansion-20261106` | **Date**: 2026-11-06 | **Spec**: [spec.md](./spec.md)

## Summary

Register focused upstream sources for Corey Haines Copywriting and Copy-Editing with their supporting Markdown references; Vercel's full agent-oriented React/Next.js best-practices guide; and Trail of Bits False Positive Check, SARIF Parsing, Post-Patch Validation and relevant supporting references. Route these into existing task groups only.

## Technical Context

**Repository**: Next.js App Router; pnpm 10.30.3. This is a documentation-routing and Freebuff-group-guidance change only.
**Updater**: `scripts/refresh-docs.js` already fetches configured `type: url` sources, derives the snapshot filename from the source ID, materializes the first group copy and links subsequent group copies. No updater code change is needed.
**Source pinning**: Each source is pinned to the current upstream repository commit SHA. The updater checks for missing group snapshots before skipping an unchanged upstream SHA.
**Workflow**: `refresh-docs.yml` is scheduled/manual. Once the manifest reaches `main`, its next scheduled or manual run fetches and writes the snapshots and opens/updates the updater PR if changes are found.
**Testing**: Validate the manifest JSON, source IDs, URLs, inventory membership, SHA pins, exact group routing and every path referenced by group notes. Run `node scripts/test-refresh-docs.js` and `./freebuff-verify.sh` through PR CI.
**Dependencies**: None.

## Constitution Check

- **Single source of truth**: PASS — `AGENTS.md` remains canonical; added documents are supplementary.
- **Verify before acting**: PASS — inspected group instructions, manifest, updater implementation, workflow and upstream files.
- **Implementation sequence**: PASS — specify → plan → tasks → implement, in this feature directory.
- **Protect core systems**: PASS — no application, payment, database, authentication, deployment or secret changes.
- **Documentation updater**: PASS — the owner explicitly authorized documentation-library and manifest routing changes; updater implementation remains unchanged.

## Phase 0 — Research

Confirmed the pre-existing Corey Haines source pointed to `tools/integrations/strapi.md`, not a marketing skill. The correct entrypoints are the upstream Copywriting and Copy-Editing `SKILL.md` files. Their Markdown support references were registered as separate updater sources so that links within the skills can resolve to local snapshots.

Vercel's `skills/react-best-practices/AGENTS.md` is the agent-oriented full guide. Trail of Bits False Positive Check, SARIF Parsing and Post-Patch Validation were selected with their relevant Markdown supporting references. The optional SARIF Python helper was not copied into the library because it is not required by the main Markdown guide.

The existing updater uses source IDs for grouping/filenames, raw URLs for downloads, and the first owner/repository segments for GitHub SHA checks. Its existing fan-out logic supports the multi-group routing used here.

## Phase 1 — Design

- `.docs/manifest.json`: repoint the original Corey source ID to Copywriting; add supporting skill/reference sources; add Vercel and Trail of Bits sources; update group arrays, inventory and upstream SHA pins; remove Corey from SEO.
- `.freebuff/creation.md`: conditional Copywriting and React/Next.js performance routing.
- `.freebuff/polishing.md`: conditional Copy-Editing and React/Next.js performance routing.
- `.freebuff/security.md`: False Positive Check, SARIF processing and security patch validation routing.
- `.freebuff/deep-dive.md`: investigation routing for False Positive Check and SARIF.
- `.freebuff/testing.md`: security patch validation routing.
- `.freebuff/seo.md`: remove the misrouted Marketing Skills entry.
- `.docs/AGENT_SKILL_ATTRIBUTION.md`: record upstream repositories and license information.
- `.specify/feature.json`, Spec Kit artifacts, and Memory Bank records: point to feature 095 and record verified status.

No new task group, application code, dependency, updater logic or scheduled workflow trigger is introduced.
