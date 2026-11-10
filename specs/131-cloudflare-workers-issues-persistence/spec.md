# Feature Specification: Keep Cloudflare Workers Issues Enabled Across Deployments

**Feature Branch**: `fix/keep-cloudflare-issues-enabled`

**Created**: 2026-11-10

**Status**: Implemented; awaiting repository verification and deployment

**Input**: Keep the Cloudflare Workers Issues detector enabled through normal deployments so detected issues continue to be available to the existing Cloudflare-to-GitHub issue workflow.

## User Scenarios & Testing

### User Story 1 - Preserve issue detection after deployment (Priority: P1)

As the site owner, I need Cloudflare Workers Issues detection to remain enabled after every normal Worker deployment so newly detected runtime issues continue to be captured without manual re-enabling.

**Why this priority**: Detection is the source of the existing issue-reporting route. If a deployment disables it, downstream forwarding cannot receive new detections.

**Independent Test**: Validate the deployed Worker configuration and confirm the Cloudflare Issues detector remains enabled after deployment.

**Acceptance Scenarios**:

1. **Given** the Worker is deployed through the repository's normal Wrangler deployment, **When** the deployment applies the checked-in configuration, **Then** the Workers Issues detector is explicitly enabled.
2. **Given** the detector is enabled, **When** Cloudflare detects a Worker issue, **Then** the existing Cloudflare notification/automation route remains the configured path to the existing `workers-issues-to-github` Worker.

## Edge Cases

- Existing observability logging must remain enabled.
- The configuration must not introduce a new credential, destination, automation, webhook, resolver, or scheduler change.
- Repository configuration validation must reject unsupported or incorrectly nested Issues settings.
- A successful repository deployment does not by itself prove the live Cloudflare account-side detector and automation state; that must be checked in Cloudflare after deployment.

## Requirements

### Functional Requirements

- **FR-001**: The Worker deployment configuration MUST explicitly enable the Workers Issues detector.
- **FR-002**: Existing observability logging MUST remain enabled.
- **FR-003**: The existing Notifications/Automations route to `workers-issues-to-github` MUST remain unchanged.
- **FR-004**: The change MUST NOT add credentials, API keys, tokens, new destinations, webhooks, automations, a separate resolver, or updater scheduler changes.
- **FR-005**: The change MUST take effect through the existing deployment pipeline without requiring a separate Cloudflare account credential to be added to the repository.

## Success Criteria

### Measurable Outcomes

- **SC-001**: The checked-in Wrangler configuration explicitly sets the Workers Issues detector to enabled.
- **SC-002**: Wrangler configuration validation accepts the setting using the repository's pinned Wrangler version.
- **SC-003**: The PR change set contains no changes to issue forwarding, credentials, resolver logic, or updater scheduling.
- **SC-004**: After deployment, the owner can confirm the detector remains enabled in Cloudflare and a test issue follows the existing route to GitHub.

## Assumptions

- The existing Cloudflare notification/automation and `workers-issues-to-github` route are already configured and working, based on the owner's successful manual test.
- The repository's existing Wrangler deployment is the authoritative deployment path.
- Live Cloudflare account-side state is verified after deployment; it is not inferred from the repository file alone.
