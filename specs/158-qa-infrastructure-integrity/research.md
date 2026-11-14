# Research: QA Infrastructure Integrity

**Date**: 2026-11-14

## Existing workflow findings

- `.github/workflows/visual-qa.yml` runs the full `pnpm run test` suite and the repository governance/type/build verifier for every PR. Visual changes run two Playwright shards. Existing Playwright projects cover desktop 1440×900, mobile 390×844 and mobile 412×915.
- `.github/scripts/classify-visual-changes.sh` fails closed when no paths are supplied or a path is not positively classified as non-rendering. Retained unchanged.
- `.github/workflows/verification-integrity.yml` checks evidence against the current PR head and treats skipped/unrun checks as NOT RUN. It is extended to require `PR Scope Verification` on the current head and rerun after PR edits/owner approval comments.
- `.github/workflows/protected-files.yml`, `.github/scripts/agents_md_protection.py`, its tests and CODEOWNERS enforce separate authorization for protected governance. Retained unchanged.
- `.github/workflows/devskim.yml` invokes DevSkim, validates/tests the conservative suppression filter, replays real SARIF, filters in place, uploads the filtered artifact and updates an append-only Markdown report on main/schedule. Before this change, it did not separately preserve the unfiltered SARIF artifact or emit a compact table of scanner/filter/replay/upload stage outcomes.

## Observed failure classification

The inspected PR #1899 Visual QA run failed in the general unit-test job and Playwright shard 2. Captured output showed:
- A feature image/social-sharing unit assertion expecting a particular object-position string.
- A Lucky Stories pagination browser test receiving HTTP 500 while expecting six story cards on mobile 390.
- A mobile accessibility text-size assertion below the 12px threshold on mobile viewports.

These are application/test observations, not proven QA-checker defects. They are out of scope and are not changed here. Crystal Ball daily-limit and follow-up outage specs were present and remain covered.

## DevSkim findings

- DevSkim completed successfully on PR #1899.
- Its SARIF contained one result after the audited suppression filter: rule `DS172411`, `ManualReview`, high confidence, at `components/DailyResonance.tsx:386`. The code schedules a fixed callback that checks the mounted-state ref and resets share status; it does not evaluate a string or untrusted input.
- This result remains visible for human review. It is not automatically declared a vulnerability or false positive.
- Historical DevSkim CI output showed a Python `IndentationError` in a suppression regression test, demonstrating that scanner-job failures can originate in test infrastructure.
- The current suppressor and SARIF replay are conservative and fail closed. No suppression rule or allowlist is weakened by this task.

## Agent MD decision

The existing Agent MD, nine Spec Kit command definitions, templates, constitution and protected-file workflow were reviewed. The new scope-evidence checker can record Playwright, Firecrawl and Browserless distinctly while the automatic visual workflow remains Playwright-based; this does not require changing the existing primary browser automation rule. AGENTS.md edits are subject to a dedicated protected-file authorization path, so this mixed QA infrastructure PR must not include an Agent MD edit. The new scope checker separately flags `.freebuff/` and relevant `.specify/` instructions/templates. This is a deliberate no-change decision, not an omitted review.

## Tool limitations

- Firecrawl-hosted Playwright access was tested. Its Node runtime did not have the `playwright` module installed (`Cannot find module 'playwright'`). No Playwright browser run is claimed.
- Browserless was not substituted because ChatGPT-specific repository instructions require Playwright through Firecrawl for ChatGPT's own browser testing.
- Repository startup scripts and `freebuff-verify.sh` were not run.
- Changes were made through the connected GitHub integration. GitHub Actions are triggered by PR creation. The new scope workflow is loaded from the default/base branch and therefore becomes active for subsequent PRs after it is merged to main.

## Design outcome

Use deterministic exact-path matching and digest-bound approvals; preserve raw DevSkim SARIF; add a transparent finding summary; retain existing tests and governance. Content-level semantic contradictions inside an already-declared file remain substantive diff-review work. The automated path checker does not claim to perform semantic code review.
