# Feature Specification: Connected Crawling Integrations

## Summary
Document the approved website-crawling provider order in repository governance: Firecrawl is the primary provider and Crawlbase is the fallback.

## User Scenarios
### Scenario 1 — Retrieve website content
A coding agent needs to crawl a website, map URLs, scrape pages, or extract page content. It checks the connected-integration guidance and uses Firecrawl first when suitable.

### Scenario 2 — Recover from Firecrawl failure
Firecrawl is unavailable, fails, is blocked, or cannot retrieve required content. The agent uses Crawlbase as the fallback and avoids redundant calls to both providers unless recovery or cross-checking is justified.

## Functional Requirements
- FR-001: AGENTS.md identifies Firecrawl as the primary/preferred website crawling and extraction provider.
- FR-002: AGENTS.md identifies Crawlbase as the secondary fallback and states the conditions for using it.
- FR-003: Guidance discourages unnecessary duplicate use of both providers.
- FR-004: Existing connected-integration guidance and approval safeguards remain intact.
- FR-005: The change is documented through the repository's four required Spec Kit stages.

## Scope and Constraints
- Documentation and governance guidance only.
- No application code, integration configuration, credentials, deployment settings, or unrelated audit work.
- Preserve all existing integration entries and authorization safeguards.

## Success Criteria
- SC-001: The Connected Integrations section contains the Firecrawl primary and Crawlbase fallback rules.
- SC-002: Existing integration entries and approval safeguards are retained.
- SC-003: The Spec Kit verifier detects the feature artifacts and passes.
- SC-004: The complete PR diff contains only the intended governance and Spec Kit records.

## Assumptions
- The existing PR branch and its AGENTS.md change are the authorized scope.
- No browser-visible behavior changes; automated governance verification is the relevant QA.
