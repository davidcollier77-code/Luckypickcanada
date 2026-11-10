# Feature Specification: Triage and Resolve Cloudflare Vulnerability-Scan Issues

**Feature Branch**: `freebuff/68fa75a8cf62b1b555921275`

**Created**: 2026-11-10

**Status**: Implemented; verification recorded in `evidence.md`

**Input**: Review all five open Cloudflare-related GitHub issues (#1789–#1793) in `davidcollier77-code/Luckypickcanada`, determine whether each reports a genuine problem, fix it if so, and otherwise resolve it with evidence-based reasoning.

## User Scenarios & Testing

### User Story 1 - Each alert is verified before any change is made (Priority: P1)

The owner receives five GitHub issues created by the Cloudflare Workers Issues integration. Each one is examined against its retained Cloudflare occurrences, the live production response, and the repository's actual routes/configuration so the owner can tell a real defect from internet scan noise.

**Why this priority**: Closing or fixing an alert without evidence would either hide a real vulnerability or waste work on a false positive. The evidence is the deliverable.

**Independent Test**: For every issue, retrieve its Cloudflare occurrences and confirm the requested path, method, response status and whether an outbound fetch occurred; compare those paths with the repository route tree and public assets; request the same paths from production.

**Acceptance Scenarios**:

1. **Given** a Cloudflare scan alert, **When** its retained occurrences are inspected, **Then** the requested paths, response codes and outbound-fetch evidence are recorded.
2. **Given** the reported paths, **When** the repository and live site are checked, **Then** the review establishes whether the application serves them, leaks data through them, or merely returns its normal not-found response.

---

### User Story 2 - Only genuine problems change code; false positives are resolved with evidence (Priority: P1)

If an alert reflects a real application weakness, the smallest correct fix is implemented and verified. If the alert is inbound scanning against endpoints the application does not have, no product code is changed and the issue is closed with the supporting evidence.

**Why this priority**: The request explicitly forbids closing issues merely to clear the inbox, and forbids unnecessary production changes.

**Independent Test**: Review the final change set. It contains only triage artifacts and records when every issue is a false positive; otherwise it contains a scoped fix with a failing-then-passing reproduction.

**Acceptance Scenarios**:

1. **Given** every occurrence is a 404 to a non-existent path with no outbound fetch, **When** the triage completes, **Then** no application source changes and each issue receives an evidence-based resolution.
2. **Given** any occurrence returns protected data, a successful response for a scanner path, or an unexpected outbound fetch, **When** the triage completes, **Then** that issue is treated as a genuine problem and fixed rather than closed.

---

### User Story 3 - Existing behaviour and safeguards are preserved (Priority: P2)

The investigation does not weaken security headers, validation, rate limiting, Turnstile, authentication or existing functionality, and does not add dependencies, credentials or Cloudflare account configuration.

**Why this priority**: The site is in production; an unnecessary change is a risk with no benefit.

**Independent Test**: Confirm the diff contains no application code, configuration, dependency, credential or deployment change when the alerts are false positives, and that production still returns 200 for the homepage and the normal 404 page for unknown paths.

**Acceptance Scenarios**:

1. **Given** the alerts are false positives, **When** the final diff is inspected, **Then** it contains only Spec Kit and Memory Bank records.
2. **Given** the site is unchanged, **When** production is re-checked, **Then** the homepage remains reachable and unknown paths remain 404.

### Edge Cases

- Cloudflare retains only a bounded sample of occurrences; the recorded sample must be representative of the issue's stated pattern rather than assumed to be exhaustive.
- An endpoint could return a 200 not-found page with a misleading body; response status and content must both be checked.
- A scanner path could be served by a static asset rather than an application route; public assets and build output must be considered.
- The Cloudflare API can expose a different issue type/status than the GitHub issue template; the authoritative Cloudflare record is checked.

## Requirements

### Functional Requirements

- **FR-001**: Every open Cloudflare-related GitHub issue MUST be individually identified and reviewed; none may be resolved as a group without per-issue evidence.
- **FR-002**: Each review MUST use the retained Cloudflare occurrence data (path, method, status, outbound fetch) as primary evidence.
- **FR-003**: Each reported path MUST be checked against the repository route tree, public assets and live production responses.
- **FR-004**: Application code MUST change only when the evidence shows a genuine defect or exposure.
- **FR-005**: Each issue MUST receive a concise, evidence-based resolution comment before it is closed.
- **FR-006**: Existing security controls, functionality and deployment configuration MUST remain unchanged unless a genuine defect requires a scoped fix.
- **FR-007**: Triage evidence MUST be recorded in a stable repository artifact for later audit.

### Key Entities

- **Cloudflare issue**: An observability record with an ID, title/category, status, type, occurrence count and retained occurrences.
- **GitHub issue**: The integration-created issue carrying the Cloudflare issue ID and notification payload.
- **Occurrence**: A retained request record with timestamp, method, URL, path, status code, request headers and error message.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Five of five open Cloudflare issues have a recorded, per-issue determination.
- **SC-002**: Zero reported scanner paths return a successful response or expose secret/source data.
- **SC-003**: The final change set contains no application code, dependency, credential or Cloudflare deployment change when all five are false positives.
- **SC-004**: Every issue is resolved with a comment that cites its own evidence.
- **SC-005**: The repository verification gate passes on the final head.

## Assumptions

- The five open issues are the current "Cloudflare issue inbox" for this repository.
- Cloudflare's retained occurrence sample is sufficient to classify the alert pattern; the issue titles and error messages also state the detected category.
- The owner's request to "resolve it appropriately" authorizes resolving these five specific issues, including closing their GitHub threads with evidence.
- Production responses measured during triage describe the deployed state at that time.
