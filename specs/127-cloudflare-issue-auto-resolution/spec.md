# Feature Specification: Automatic Cloudflare Observability Issue Resolution

**Feature Branch**: `feature/127-cloudflare-issue-auto-resolution`

**Created**: 2026-11-10

**Status**: Draft

**Input**: User description: "Implement automatic resolution of Cloudflare Workers Observability issues through the existing Wrangler-managed GitHub integration. Use the existing `CLOUDFLARE_API_TOKEN` securely as a Wrangler-managed Worker secret so the deployed Worker can update the original Cloudflare issue to `resolved` after Freebuff fixes the underlying problem, passes the required tests, and successfully deploys the fix. Preserve the existing scanner, webhook, GitHub issue creation, duplicate protection, notification policy, and all existing Cloudflare automations and scheduled workflows. Only resolve the matching Cloudflare issue after Cloudflare confirms the status update. If the update fails, leave the issue unresolved and report the failure."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A fixed issue is resolved after the fix deploys (Priority: P1)

The owner receives a GitHub issue that the existing Workers Observability integration created for a production problem. A fix is prepared, passes the repository's required checks, and is deployed to production. Once that deployment succeeds, the corresponding Cloudflare Workers Observability issue is marked `resolved` in Cloudflare so the dashboard reflects reality without a manual step.

**Why this priority**: This is the requested outcome. Without it, resolved production problems keep appearing as open Observability issues and the GitHub issue trail never closes the loop.

**Independent Test**: Deploy a build whose commit message or pull request body carries `Cloudflare-Issue: <uuid>` for a real issue, then confirm that Cloudflare reports the issue as `resolved` and that the deployment run records the confirmation.

**Acceptance Scenarios**:

1. **Given** a successful production deployment of a fix that names one Cloudflare issue, **When** the post-deploy step runs, **Then** that issue's Cloudflare status becomes `resolved` and the run records Cloudflare's confirmation.
2. **Given** a successful production deployment that names no Cloudflare issue, **When** the post-deploy step runs, **Then** no issue changes status and the run reports that nothing was resolved.
3. **Given** a pull request that has not been deployed, **When** its checks run, **Then** no Cloudflare issue is resolved.

---

### User Story 2 - Only confirmed resolutions are claimed (Priority: P2)

If Cloudflare refuses the status update, returns a different status, or cannot be reached, the issue is left unresolved and the failure is reported instead of being treated as success.

**Why this priority**: A false "resolved" hides a production problem. The owner must be able to trust the reported state.

**Independent Test**: Force the Cloudflare status update to fail or to report a non-resolved status, and confirm the run fails with an explicit "remains unresolved" message and no resolved claim.

**Acceptance Scenarios**:

1. **Given** Cloudflare returns an error for the update, **When** the post-deploy step runs, **Then** the issue stays unresolved and the run reports the failure.
2. **Given** Cloudflare accepts the request but reports a status other than `resolved`, **When** the step runs, **Then** the run does not claim resolution and reports the reported status.
3. **Given** several referenced issues and only some are confirmed, **When** the step runs, **Then** the unconfirmed ones are reported as unresolved and the run fails.

---

### User Story 3 - Existing automation and credentials stay protected (Priority: P3)

The resolution path is closed to unauthenticated callers, never exposes credential values, and leaves every existing Cloudflare automation untouched.

**Why this priority**: The capability spends a privileged Cloudflare credential inside a public Worker. It must not become an open status-changing endpoint or disturb the working issue pipeline.

**Independent Test**: Call the resolution operation without a credential, with a wrong credential, and with credential configuration missing, and confirm it refuses each time without contacting Cloudflare.

**Acceptance Scenarios**:

1. **Given** no caller credential, **When** the resolution operation is called, **Then** it is refused and Cloudflare is never contacted.
2. **Given** the Worker secrets are not configured, **When** the operation is called, **Then** it reports "not configured" and changes nothing.
3. **Given** any failure, **When** the result is reported, **Then** no credential value appears in the response or the logs.
4. **Given** the scanner, webhook, GitHub issue creation, duplicate protection, notification policy, automations and scheduled workflows, **When** this feature is applied, **Then** all of them keep their current behaviour and configuration.

### Edge Cases

- A deployment references an already-resolved issue: Cloudflare confirms `resolved`, so the run succeeds and changes nothing further.
- A deployment references an issue from another account or service: Cloudflare rejects it; the failure is reported and nothing is claimed.
- A commit message repeats the same reference or names more issues than one request accepts: duplicates collapse and the list is bounded.
- The newly deployed route is not serving yet when the post-deploy step first calls it: a bounded, retried attempt set applies, and exhausting it is a reported failure.
- The caller credential is missing from repository secrets: the step fails explicitly instead of silently skipping resolution.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The deployed Worker MUST expose a resolution operation that sets a Cloudflare Workers Observability issue status to `resolved`.
- **FR-002**: The operation MUST use the existing `CLOUDFLARE_API_TOKEN` as a Wrangler-managed Worker secret; no credential value may be committed, logged or returned.
- **FR-003**: Resolution MUST be attempted only after the fix's required checks pass and the production deployment of that fix succeeds.
- **FR-004**: The operation MUST treat an update as successful only when Cloudflare's own response confirms `status: "resolved"`.
- **FR-005**: When the update is refused, unconfirmed, partially confirmed or unreachable, the issue MUST remain unresolved and the failure MUST be reported.
- **FR-006**: The operation MUST identify the issue only from an explicit `Cloudflare-Issue: <uuid>` reference in the deployed fix; it must never resolve an issue it was not told about.
- **FR-007**: The operation MUST be refused (HTTP 401) without a valid caller credential and MUST be closed (HTTP 503) when either Worker secret is missing.
- **FR-008**: The operation MUST reject malformed, empty and oversized issue lists without contacting Cloudflare.
- **FR-009**: The existing Workers Observability scanner, generic webhook, GitHub issue creation, duplicate protection, notification policy, issue automation and all scheduled workflows MUST remain unchanged.
- **FR-010**: No duplicate integration or second issue-creation path may be introduced.

### Key Entities

- **Observability issue**: A Cloudflare Workers Observability issue identified by a UUID, owned by one Cloudflare account and service, carrying one of the statuses `active`, `resolved` or `ignored`.
- **Issue reference**: An explicit `Cloudflare-Issue: <uuid>` label in a deployed commit message or the body of a pull request the deployment contained.
- **Resolution result**: The per-issue outcome recorded after the attempt: identifier, confirmed status, and a redacted failure reason when not confirmed.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A deployment that names one Cloudflare issue results in that issue reporting `resolved` afterward, with the confirmation recorded in the deployment run.
- **SC-002**: 100% of failed or unconfirmed updates leave the issue unresolved and produce a visibly failed, reported outcome; no failure is reported as a success.
- **SC-003**: 100% of unauthenticated and unconfigured calls change no issue state and contact no Cloudflare endpoint.
- **SC-004**: No credential value appears in any response, log line or repository file.
- **SC-005**: Deployments that name no Cloudflare issue change no issue state.

## Assumptions

- The Wrangler-managed Worker that serves the site is the deployed Worker allowed to hold `CLOUDFLARE_API_TOKEN`; its secrets are managed with Wrangler, not committed to the repository.
- The fix author knows the Cloudflare issue identifier, because the existing integration's GitHub issue and the Cloudflare dashboard both expose it.
- The existing Cloudflare notification policy, webhook and bridge Worker stay exactly as deployed; this feature adds a resolution path and changes none of them.
- A separate caller credential is acceptable for the resolution operation so the Cloudflare API credential is never transmitted to the site.
