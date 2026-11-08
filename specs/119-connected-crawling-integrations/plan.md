# Implementation Plan: Connected Integrations and QA Contract

## Technical Context
- Repository authority: `AGENTS.md`.
- Change type: documentation/governance only.
- Relevant QA implementation: `.github/workflows/visual-qa.yml` and `.github/scripts/classify-visual-changes.sh`.
- Relevant integrations: Firecrawl/Crawlbase for page-content retrieval; Playwright/Browserless/Browserbase for browser-based verification.
- No application/runtime interfaces or integration configuration will change.

## Selected Task Group
- `testing` — define relevant mandatory checks, browser-verification boundaries, and honest evidence reporting.

## Phase 0 — Research
- Read the PR-branch `AGENTS.md`, Memory Bank context, `.docs/manifest.json`, `.freebuff/testing.md`, and the four Spec Kit command definitions.
- Inspected the current Visual QA workflow and change classifier on `main`. The workflow always runs its unit, TypeScript, and Spec Kit checks; its browser steps are conditional. The classifier skips only documented documentation-only paths and fails closed for unknown, empty, mixed, or unclassifiable input.
- Reviewed the existing Visual QA/Playwright specifications (098 and 109) to preserve their coverage, projects, assertions, and baseline behavior.
- Consulted `.docs/testing/_google_eng-practices.md`, `.docs/testing/_microsoft_playwright.md`, and `.docs/testing/_dequelabs_axe-core.md` for task-appropriate testing, real browser assertions, and the distinction between violations, incomplete results, and inapplicable checks. No other library documents were needed.

## Phase 1 — Design
- Add one short **QA Contract (mandatory)** subsection under AGENTS.md verification guidance.
- Make checks mandatory only when relevant to the changed paths, acceptance criteria, and affected user workflows. Explicitly mark irrelevant checks N/A with a reason; never silently skip an applicable required check.
- Keep the existing Spec Kit sequence and gate mandatory for every task.
- For automatic PR checks, preserve the existing Visual QA workflow: Playwright is the browser runner; the current classifier decides whether browser regression applies and fails closed for uncertain paths. Do not add or invoke Browserless or Browserbase from automatic PR-checker workflows.
- For direct agent browser work, refer to the existing AGENTS.md fallback order and approval rules: Playwright, then Browserless, then Browserbase only with owner approval.
- Clarify that Firecrawl/Crawlbase retrieve website content and do not replace interactive browser or end-to-end checks.
- Require evidence-based PASS/FAIL/BLOCKED/PENDING/NOT RUN/N/A reporting, distinguishing product defects from tooling or environment blockers.
- Do not modify workflows, scripts, thresholds, snapshots, application code, or integration configuration.

## Validation
1. Confirm the three feature artifacts remain together and the feature pointer still references this feature.
2. Run the repository Spec Kit verifier and `./freebuff-verify.sh`; record actual outcomes.
3. Inspect the complete PR diff and preserve the existing provider order, browser fallbacks, CI restrictions, and approval rules.
4. Let PR-head CI perform its normal checks. Do not claim verified completion while a mandatory check is pending, blocked, or failed.
