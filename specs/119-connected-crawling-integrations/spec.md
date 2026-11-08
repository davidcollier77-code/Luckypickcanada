# Feature Specification: Connected Integrations and QA Contract

## Summary
Document the approved crawling-provider order and a concise, mandatory, task-relevant QA contract in repository governance. Firecrawl is primary and Crawlbase is fallback. The QA contract must explain which checks apply, preserve the existing browser-tool restrictions, and require evidence-based reporting without making irrelevant checks fail a task.

## User Scenarios

### Scenario 1 — Retrieve website content
A coding agent needs to crawl a website, map URLs, scrape pages, or extract content. It uses Firecrawl first when suitable and Crawlbase only when Firecrawl is unavailable, fails, is blocked, or cannot retrieve the required content.

### Scenario 2 — Verify a browser-visible change
A task changes rendered UI or an end-to-end browser workflow. The agent follows the mandatory browser-QA rules and the existing Visual QA workflow, without substituting a crawler result for interactive browser verification.

### Scenario 3 — Handle non-visual changes and unavailable tools
A documentation-only change is classified by the existing Visual QA workflow and may skip browser regression checks, while the workflow's other mandatory checks still run. An unknown path or failed/empty file listing must fail closed and request visual QA. A required check that cannot run is reported as blocked, not passed or misreported as a product defect.

### Scenario 4 — Verify connected integrations
A task depends on or changes an integration. The agent verifies a real result and relevant error/fallback behavior, follows the integration's existing priority and approval rules, and does not treat a connection alone as proof of success.

## Functional Requirements
- **FR-001**: AGENTS.md identifies Firecrawl as the primary/preferred provider for website crawling, scraping, URL mapping, and page-content extraction.
- **FR-002**: AGENTS.md identifies Crawlbase as the secondary fallback and states when to use it.
- **FR-003**: Guidance discourages redundant use of both crawling providers without a recovery or cross-check reason.
- **FR-004**: Existing connected integrations, tool order, approval safeguards, and restrictions remain intact.
- **FR-005**: AGENTS.md defines a mandatory QA contract: select checks from the task scope, acceptance criteria, and changed paths; run every applicable required check; mark irrelevant checks N/A with a reason.
- **FR-006**: The four Spec Kit stages and the repository verification gate remain mandatory as defined elsewhere in AGENTS.md.
- **FR-007**: Browser-visible or end-to-end changes require the existing Playwright Visual QA path and its full configured projects, assertions, and committed baselines.
- **FR-008**: The existing Visual QA classifier remains authoritative: documented documentation-only paths may skip browser regression, while empty, unknown, mixed, or unclassifiable changes fail closed and request visual QA.
- **FR-009**: Direct agent browser verification follows the approved Playwright → Browserless → Browserbase order and approval requirements already defined in AGENTS.md.
- **FR-010**: Browserless and Browserbase must not be added to or triggered by automatic PR-checker workflows.
- **FR-011**: Firecrawl/Crawlbase content retrieval does not replace Playwright browser rendering, interaction, or end-to-end verification.
- **FR-012**: QA reporting distinguishes PASS, FAIL, BLOCKED, PENDING, NOT RUN, and N/A (with a reason), and records evidence for failures and blocked checks.

## Scope and Constraints
- Documentation and governance only; no application code, integration configuration, credentials, deployment settings, or automatic QA workflow changes.
- Preserve existing visuals, functionality, approval rules, browser-tool order, and all unrelated integration entries.
- Keep the QA contract short and refer to existing AGENTS.md sections rather than duplicating their detailed instructions.

## Success Criteria
- **SC-001**: The Connected Integrations section retains Firecrawl-primary and Crawlbase-fallback behavior.
- **SC-002**: AGENTS.md contains one concise QA contract with mandatory-but-conditional checks and explicit outcome reporting.
- **SC-003**: Playwright, Browserless, Browserbase, Firecrawl, and Crawlbase retain their distinct roles and existing approval boundaries.
- **SC-004**: The current Visual QA workflow and classifier are not weakened or duplicated.
- **SC-005**: All three Spec Kit feature artifacts remain together and the repository verifier detects them.
- **SC-006**: The complete PR diff contains only the intended governance, specification, and required task-context updates.

## Assumptions
- The existing PR branch and its AGENTS.md change are the authorized scope.
- The current Visual QA workflow is authoritative for automatic PR checks; its classifier and Playwright coverage remain unchanged.
- Browserless and Browserbase remain direct agent-task fallbacks only, not automatic PR-checker services.
