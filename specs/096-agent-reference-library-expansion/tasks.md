# Tasks: Freebuff Agent Reference Library Expansion

**Input**: Design documents from `specs/096-agent-reference-library-expansion/`
**Prerequisites**: `plan.md` and `spec.md`

## Phase 1: Register and route agent references (Priority: P1)

**Goal**: The manifest identifies every upstream source and maps it to the appropriate existing Freebuff groups.

**Independent Test**: Parse the manifest and verify all source IDs, URLs, inventory entries, SHA pins and group arrays.

- [X] T001 Repoint the Corey Haines source to the Copywriting skill and register its supporting references in `.docs/manifest.json`.
- [X] T002 Register Corey Haines Copy-Editing and its supporting references for Polishing.
- [X] T003 Register Vercel React/Next.js Best Practices for Creation and Polishing.
- [X] T004 Register Trail of Bits False Positive Check and its six Markdown references for Security and Deep Dive.
- [X] T005 Register Trail of Bits SARIF Parsing and its jq query reference for Security and Deep Dive.
- [X] T006 Register Trail of Bits Post-Patch Validation and its evidence model for Security and Testing.
- [X] T007 Add all source IDs to inventory and pin each source to the current upstream repository commit SHA.
- [X] T008 Remove the Corey source from SEO so the Strapi integration page is no longer presented as a marketing reference.

## Phase 2: Update group guidance and attribution (Priority: P1)

**Goal**: Agents know when to use each reference, where it lives, and which rules remain authoritative.

**Independent Test**: Verify each referenced `.docs` path is generated from a manifest source mapped to that group and group guidance warns against blindly applying upstream tool assumptions.

- [X] T009 Add conditional copywriting and Vercel performance routing to `.freebuff/creation.md`.
- [X] T010 Add conditional copy-editing and Vercel performance routing to `.freebuff/polishing.md`.
- [X] T011 Add False Positive Check, SARIF and Post-Patch Validation routing to `.freebuff/security.md`.
- [X] T012 Add investigation routing to `.freebuff/deep-dive.md` and security patch validation routing to `.freebuff/testing.md`.
- [X] T013 Remove the misrouted Marketing Skills entry from `.freebuff/seo.md` and add attribution in `.docs/AGENT_SKILL_ATTRIBUTION.md`.
- [X] T014 Update `.specify/feature.json` and the active Memory Bank context for feature 096.

## Phase 3: Verification and handoff

- [ ] T015 Run manifest/source-routing assertions and `node scripts/test-refresh-docs.js` on the PR head.
- [ ] T016 Run `./freebuff-verify.sh`, inspect the complete final diff and verify updater materialization once the manifest is available on `main`.
- [ ] T017 Update the canonical PR report with actual CI and updater outcomes; leave the PR open and unmerged.

## Dependencies & Execution Order

1. T001–T008 establish source and group mappings.
2. T009–T013 document when each source should be consulted.
3. T014 records task state; T015–T017 are verification and handoff.
