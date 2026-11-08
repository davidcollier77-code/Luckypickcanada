# Tasks: Connected Integrations and QA Contract

## Phase 1 — Setup and specification
- [x] T001 Read `AGENTS.md`, Memory Bank context, `.docs/manifest.json`, `.freebuff/testing.md`, relevant QA references, and the existing Visual QA workflow/classifier.
- [x] T002 Specify the crawling-provider order and three QA user stories in `specs/119-connected-crawling-integrations/spec.md`.
- [x] T003 Plan a concise governance-only QA contract and preserve existing workflow/tool restrictions in `specs/119-connected-crawling-integrations/plan.md`.
- [x] T004 Define this ordered, independently reviewable task list in `specs/119-connected-crawling-integrations/tasks.md`.

## Phase 2 — User Story 1: Retrieve and verify website content (P1)
- [x] T005 Set Firecrawl as the primary website-content provider and Crawlbase as its conditional fallback in `AGENTS.md`.

## Phase 3 — User Story 2: Verify browser-visible changes (P1)
- [x] T006 Add a concise QA contract rule in `AGENTS.md` that preserves Playwright as the automatic PR Visual QA runner, the existing fail-closed classifier, and the direct-agent Browserless/Browserbase fallback and approval boundaries.
- [x] T007 Clarify in `AGENTS.md` that Firecrawl/Crawlbase content retrieval does not replace browser-rendering, interaction, or end-to-end verification.

## Phase 4 — User Story 3: Apply mandatory but relevant QA checks (P1)
- [x] T008 Define in `AGENTS.md` that applicable checks are mandatory, irrelevant checks are N/A with a reason, blockers are not product defects or passes, and failures require evidence.

## Final verification and handoff
- [ ] T009 Run the Spec Kit verifier and `./freebuff-verify.sh`; record the actual outcomes in the canonical PR summary.
- [x] T010 Review the complete PR diff and verify the PR remains open and unmerged; update the canonical PR summary with exact verification status and outstanding checks.
