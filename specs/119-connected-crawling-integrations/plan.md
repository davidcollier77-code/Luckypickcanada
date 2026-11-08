# Implementation Plan: Connected Crawling Integrations

## Technical Context
- Repository governance: AGENTS.md.
- Change type: documentation-only.
- Runtime or application interfaces: none.
- Existing integration guidance is extended in place; no new integration setup is performed.

## Constitution / Governance Check
- Required stage order: specify → plan → tasks → implement.
- Preserve approval safeguards and unrelated integration guidance.
- Keep .docs read-only.
- Do not change application behavior, secrets, deployment, or configuration.

## Phase 0 — Research
Inspected AGENTS.md on the PR branch and the Spec Kit command definitions. The governance file requires all four stages and the Visual QA workflow runs the AGENTS.md Spec Kit verifier. No external technical research is needed for this wording-only task.

## Phase 1 — Design
- Update the existing Connected Integrations list with Firecrawl as primary and Crawlbase as fallback.
- Add this feature's spec, plan, and tasks records under one feature directory.
- Point .specify/feature.json at the feature directory.
- Keep the PR scoped to AGENTS.md and these Spec Kit records.

## Validation
- Run the repository Spec Kit verification gate.
- Confirm all three feature artifacts exist together and the feature pointer resolves to them.
- Review the complete PR diff and verify existing integration guidance is preserved.
- Full repository gate and PR-head CI remain required; report their actual results.
