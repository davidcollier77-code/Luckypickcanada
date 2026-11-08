# Feature Specification: Connected Integrations and QA Contract

## Summary
Document the approved crawling-provider order and a concise, mandatory, task-relevant QA contract in repository governance. Firecrawl is primary and Crawlbase is fallback. The QA contract explains which checks apply, preserves existing browser-tool restrictions, and requires evidence-based reporting without making irrelevant checks fail a task.

## User Stories and Acceptance Scenarios

### User Story 1 — Retrieve and verify website content (Priority: P1)
A coding agent needs to crawl a website, map URLs, scrape pages, or extract content. It uses Firecrawl first when suitable and Crawlbase only when Firecrawl is unavailable, fails, is blocked, or cannot retrieve the required content.

**Independent Test**: Inspect the provider instructions in AGENTS.md and verify the primary/fallback order and safeguards.

**Acceptance Scenarios**
1. **Given** website content must be retrieved, **when** Firecrawl is suitable, **then** Firecrawl is used first.
2. **Given** Firecrawl cannot provide the required content, **when** recovery is needed, **then** Crawlbase is used as fallback without redundant duplicate calls.
3. **Given** page content has been retrieved, **when** browser rendering or interaction is part of the task, **then** crawler output is not treated as a substitute for browser verification.

### User Story 2 — Verify browser-visible changes (Priority: P1)
A task changes rendered UI or an end-to-end browser workflow. The agent must run the applicable browser checks using the approved browser tools and preserve the existing Visual QA coverage and restrictions.

**Independent Test**: Inspect the existing Visual QA workflow, classifier, and AGENTS.md browser-tool rules for consistency.

**Acceptance Scenarios**
1. **Given** a change can affect rendered output or browser workflows, **when** Visual QA classifies the PR, **then** the existing Playwright browser-regression path runs with its configured projects, assertions, and committed baselines.
2. **Given** a change is positively classified as documentation-only, **when** Visual QA runs, **then** only browser-regression steps may be skipped; the workflow's other required checks still run.
3. **Given** a file listing, path classification, or change set is empty, mixed, unknown, or unclassifiable, **when** the workflow decides whether visual QA is required, **then** it fails closed and requests visual QA.
4. **Given** direct agent browser verification cannot use Playwright, **when** a permitted fallback is needed, **then** the agent follows the existing Browserless then Browserbase order and approval rule.
5. **Given** an automatic PR-checker workflow runs, **when** it performs browser verification, **then** it does not invoke Browserless or Browserbase.

### User Story 3 — Apply mandatory but relevant QA checks (Priority: P1)
A checker uses the task scope, acceptance criteria, changed paths, and affected user workflows to determine the required checks. Every applicable mandatory check must run; checks unrelated to the task must not create false failures.

**Independent Test**: Review the QA contract in AGENTS.md and confirm it requires explicit outcomes and evidence for each applicable check.

**Acceptance Scenarios**
1. **Given** a task affects an application behavior, **when** its checks are selected, **then** relevant functional, accessibility, security, performance, integration, and browser checks are included as applicable.
2. **Given** a check is irrelevant to the changed scope, **when** results are reported, **then** it is marked N/A with a brief reason rather than failed or silently skipped.
3. **Given** a required tool or environment prevents a check from running, **when** results are reported, **then** it is marked BLOCKED or NOT RUN with evidence and is not represented as a product defect or a pass.
4. **Given** any check fails, **when** the result is reported, **then** the finding includes evidence that identifies the actual requirement, test, or affected behavior.

## Functional Requirements
- **FR-001**: AGENTS.md identifies Firecrawl as the primary/preferred provider for website crawling, scraping, URL mapping, and page-content extraction.
- **FR-002**: AGENTS.md identifies Crawlbase as the secondary fallback and states when to use it.
- **FR-003**: Guidance discourages redundant use of both crawling providers without a recovery or cross-check reason.
- **FR-004**: Existing connected integrations, tool order, approval safeguards, and restrictions remain intact.
- **FR-005**: AGENTS.md defines a mandatory QA contract: select checks from task scope, acceptance criteria, and changed paths; run every applicable required check; mark irrelevant checks N/A with a reason.
- **FR-006**: The four Spec Kit stages and repository verification gate remain mandatory for every task, as defined elsewhere in AGENTS.md.
- **FR-007**: Browser-visible or end-to-end changes require the existing Playwright Visual QA path and its full configured projects, assertions, and committed baselines.
- **FR-008**: The existing Visual QA classifier remains authoritative: positively classified documentation-only paths may skip browser regression, while empty, unknown, mixed, or unclassifiable changes fail closed and request visual QA.
- **FR-009**: Direct agent browser verification follows the approved Playwright → Browserless → Browserbase order and approval requirements already defined in AGENTS.md.
- **FR-010**: Browserless and Browserbase must not be added to or triggered by automatic PR-checker workflows.
- **FR-011**: Firecrawl/Crawlbase content retrieval does not replace interactive browser rendering, interaction, or end-to-end verification.
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
