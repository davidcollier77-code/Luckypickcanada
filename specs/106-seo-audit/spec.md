# Feature Specification: Sitewide SEO Audit and Findings Report

**Feature Directory**: `specs/106-seo-audit`
**Created**: 2026-11-07
**Status**: Implemented (audit documentation only)
**Input**: Master Work Request #1 — conduct a comprehensive, evidence-based SEO audit of `https://luckypickcanada.ca/`, covering every publicly reachable page discovered through the sitemap and internal links, and report findings by priority with evidence, rationale, recommendation, expected benefit, difficulty, dependencies and confidence.

## Overview

The repository owner requested an audit **and a report**, not an implementation. The deliverable is a prioritized, point-form findings report that separates verified problems from possible improvements and unverified observations, and that never invents rankings, traffic, keyword positions, indexing status or performance measurements.

The audit covers technical SEO, crawlability and indexability, sitemap/robots/canonicals, titles and descriptions, heading structure, content and intent, internal and broken links, structured data, images, mobile SEO, performance, duplicate/thin content, redirects and status codes, URL consistency, and social presentation.

**Authorized scope is documentation only.** No application code, page content, metadata, image, configuration, DNS, Cloudflare, indexing or deployment change is permitted. The only permitted repository changes are these Spec Kit artifacts, the Memory Bank record, and the canonical PR report.

## User Scenarios & Testing

### User Story 1 — Owner can prioritize SEO work from evidence (Priority: P1)

As the repository owner, I need a single report that ranks verified SEO problems by severity, shows the exact URL and the measured or inspected evidence behind each one, and states the effort and risks of the fix, so I can decide what to approve without commissioning re-discovery.

**Independent Test**: Every finding in the report names at least one live URL or repository path, an evidence statement produced by this audit, a recommendation, and a confidence level. No finding asserts rankings, traffic, indexing or Core Web Vitals values that were not measured.

**Acceptance Scenarios**:

1. **Given** the report, **When** a reader checks any factual claim, **Then** the claim is traceable to a live HTTP response, a parsed page artifact, a file in this repository, or is explicitly labelled unverified.
2. **Given** the priority sections, **When** the reader scans them, **Then** each finding states description, affected URL, evidence, SEO rationale, recommendation, expected benefit, difficulty, dependencies/risks, and confidence/verification status.
3. **Given** a claim that would need Google Search Console, Analytics, CrUX or Cloudflare data, **When** it appears, **Then** it is listed under Unverified Items instead of being presented as a result.

### User Story 2 — Scope boundary is provable (Priority: P1)

As the repository owner, I need to confirm that the audit changed no website behaviour, so the report can be reviewed without risk to the live site.

**Independent Test**: The final diff contains only `specs/106-seo-audit/**`, `PR_SUMMARY.md`, `.specify/feature.json` and Memory Bank records; no `app/`, `public/`, `themes/`, `next.config.mjs`, `wrangler.jsonc`, workflow, dependency or `.docs/` path is modified.

**Acceptance Scenarios**:

1. **Given** the committed change set, **When** it is audited path by path, **Then** every path is documentation or evidence, and no application, asset or configuration file is touched.
2. **Given** the live site, **When** the audit finishes, **Then** no deployment, DNS, cache or indexing action was taken by the agent.

### User Story 3 — Findings are reusable as a backlog (Priority: P2)

As the repository owner, I want an implementation order and a shortlist, so approved fixes can later become separate, scoped tasks.

**Independent Test**: The report ends with an ordered sequence and a shortlist of the highest-value items, each with effort and benefit stated, and no item is begun in this task.

## Requirements

- **FR-001**: The audit MUST examine the live site's homepage, sitemap, robots.txt, every page reachable through the sitemap or internal links, and the corresponding source files in this repository.
- **FR-002**: The report MUST be organized by CRITICAL, HIGH, MEDIUM and LOW priority, and MUST state explicitly when a priority band contains no verified finding.
- **FR-003**: Every finding MUST provide description, affected page/URL, evidence, SEO rationale, recommendation, expected benefit, implementation difficulty, dependencies/risks, and confidence with verification status.
- **FR-004**: The report MUST contain the ten requested sections: Executive Summary; Existing Strengths; Critical and High-Priority Findings; Medium- and Low-Priority Findings; Page-by-Page Findings; Previous Audit Comparison; Recommended Improvements; Unverified Items; Recommended Implementation Order; Top Recommendations.
- **FR-005**: The report MUST distinguish verified problems from possible improvements and from unverified observations.
- **FR-006**: The report MUST compare findings only against SEO-related records actually present in the repository or workspace, and MUST state plainly which comparisons were impossible.
- **FR-007**: The report MUST state the data sources and tools actually used, and must not invent rankings, traffic statistics, keyword positions, indexing information or performance measurements.
- **FR-008**: The report MUST NOT recommend keyword stuffing, artificial backlinks, doorway pages or other manipulative practices.
- **FR-009**: No application code, content, metadata, image, configuration, dependency, DNS, Cloudflare, indexing or deployment change may be part of the task.
- **FR-010**: The complete findings report MUST appear in the PR body as the single report; no duplicate report document may be created.
- **FR-011**: Unverified items MUST name the specific evidence source that is missing (Search Console, Analytics, CrUX/PageSpeed, Cloudflare, browser rendering) and what it would change.

## Success Criteria

- **SC-001**: A reader can locate, for every public URL found, its HTTP status, title, description, canonical, headings, structured data and text volume from the page-by-page section.
- **SC-002**: Zero findings claim a ranking, traffic, keyword or Core Web Vitals outcome that this audit did not measure.
- **SC-003**: The final diff contains no production behaviour change and no recommendation is implemented.
- **SC-004**: The report is published once, in the PR body, and the pull request remains open and unmerged.
- **SC-005**: The repository gate (`./freebuff-verify.sh`) is executed and its real result, plus the measured production build size, is recorded in the PR body.

## Key Entities

- **Finding**: priority, category, description, URL, evidence, rationale, recommendation, benefit, difficulty, dependencies/risks, confidence, verification status.
- **Page record**: URL, status, redirect target, title and length, description and length, canonical, robots directive, headings, structured-data types, image inventory, approximate text volume, internal links.
- **Audit evidence**: HTTP responses, parsed page data, asset byte sizes and dimensions, repository paths.

## Assumptions and Limits

- The live deployment is assumed representative of the committed `main` tree; the audit spot-checks source files to confirm observed metadata and routes.
- Field Core Web Vitals, indexing coverage, queries and traffic require Google Search Console, CrUX/PageSpeed Insights and Analytics access, none of which is available in this workspace; their absence is reported, not worked around.
- Performance conclusions are limited to static measurements (transfer bytes, response timing, render-blocking resource counts) and markup inspection; no browser-based lab audit was run.
- Page text volume is an approximate word count of extracted rendered text and includes sitewide navigation and footer text.
- Any automated request (including to social platforms) may be answered differently for automated clients than for a signed-in browser; such results are reported with that caveat.
