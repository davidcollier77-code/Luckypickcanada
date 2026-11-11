# Feature Specification: Reliable Automatic Workers Issues → GitHub Forwarding

**Feature Branch**: `fix/cloudflare-issues-auto-forwarding`
**Created**: 2026-11-11
**Status**: Implemented; verification recorded in `evidence.md`

**Input**: Make Cloudflare Workers Issues automatically forward detected production issues to GitHub reliably,
without rotating credentials, replacing the bridge Worker, duplicating automations or weakening authentication.

## Problem Statement

Manual forwarding works. Automatic forwarding appeared not to. The live Cloudflare account shows why:

- The only issue automation is an **occurrence-threshold** automation (`threshold: 1`) on `luckypickcanada-app`,
  created 2026-11-10T07:08:08Z.
- Cloudflare documents that an occurrence-threshold automation "runs once when an issue's occurrence count crosses
  the configured threshold" and "does not run for every occurrence after the threshold".
- The five active security issues were first observed 2026-11-09, before the automation existed, and had already
  crossed the threshold. Their activity history contains **only manual runs** despite continuing occurrences.
- The one issue created after the automation (a log issue, 2026-11-10T20:01:44Z) crossed threshold 1 for the first
  time and produced an **automatic** run `62ddc528-ebe2-4099-ba26-383015d6c2df` at 2026-11-10T20:02:05Z, which created
  GitHub issue #1810 at 2026-11-10T20:02:07Z.

Automatic forwarding therefore works for brand-new issues and is structurally unable to forward an existing issue
that recurs, is reopened after resolution, or was created before the automation. Manual runs bypass the trigger,
which is why they always work.

## User Scenarios & Testing

### User Story 1 - Every newly detected issue is forwarded (Priority: P1)

As the site owner, when Cloudflare detects a new production issue, a GitHub issue is created automatically without
manual action.

**Acceptance**: An occurrence-threshold automation remains enabled and unchanged; the automatic run for the new log
issue is recorded with a matching GitHub issue.

### User Story 2 - A recurring or reopened issue is forwarded again (Priority: P1)

As the site owner, when an issue that already exists keeps occurring (or reopens after resolution), it is forwarded
again instead of being silently ignored forever by a one-shot trigger.

**Acceptance**: A recurrence-after-inactivity automation is enabled for the same service and notification policy, and
recurrences produce automatic runs rather than requiring manual runs.

### User Story 3 - Re-running setup never duplicates resources (Priority: P1)

As a maintainer, re-running the repository setup script reconciles the existing webhook, policy and automations by
their real identities instead of creating duplicates or aborting on a secret it cannot read back.

**Acceptance**: The script matches the webhook by name and URL without reading or rewriting its secret; matches the
policy by alert type and webhook destination; matches automations by service, policy and trigger type using the API's
read field names; and reuses every matching resource.

## Requirements

- **FR-001**: Automatic forwarding MUST remain enabled for new issues (existing occurrence-threshold automation
  preserved; no replacement or deletion).
- **FR-002**: Existing issues that recur after inactivity MUST produce automatic forwarding runs.
- **FR-003**: No API key, token, webhook secret or authentication credential may be changed, regenerated or rotated.
- **FR-004**: Authentication MUST NOT be weakened to work around delivery errors.
- **FR-005**: Duplicate protection MUST be preserved.
- **FR-006**: Notification destinations, policies and issue automations MUST NOT be added to `wrangler.jsonc`;
  Cloudflare supports them only through the dashboard and API/CLI (`cf`), not Wrangler configuration.
- **FR-007**: The checked-in Wrangler configuration MUST remain valid for the pinned Wrangler version and consistent
  with the dashboard's enabled Issues detector.
- **FR-008**: The repository setup script MUST be idempotent and MUST NOT create duplicate destinations, policies or
  automations on a second run.

## Edge Cases

- The webhook secret is write-only: Cloudflare never returns it from the API, so setup cannot verify it by comparison.
  It must reuse the destination without rewriting the secret.
- The dashboard names the policy and automation differently from the script's historical names. Identity must not
  depend on display names.
- Cloudflare's create and read payloads differ (`policyId`/`afterOccurrences`/`afterInactivitySeconds` on write;
  `ansPolicyId`/`threshold`/`inactivitySeconds`/`triggerType` on read).
- A recurring issue that already has an open GitHub issue must stay deduplicated by the bridge.
- Cloudflare may keep a notification run in `pending`; a succeeded run means Notifications accepted the event.

## Success Criteria

- **SC-001**: The live account has exactly one occurrence-threshold and one recurrence-after-inactivity automation for
  `luckypickcanada-app`, both enabled and linked to the existing policy `91cf4237e6f94ae2b062c7cf1bc72f94`.
- **SC-002**: A live Cloudflare delivery to the existing webhook succeeds after the change, proving the existing secret
  is intact and the bridge still accepts authenticated Cloudflare payloads.
- **SC-003**: The bridge still rejects an unauthenticated request with HTTP 401.
- **SC-004**: No credential value is read, printed, written or rotated.
- **SC-005**: A recurrence produces an automatic notification run with a new GitHub issue, or the remaining
  timing-dependent limitation is recorded explicitly.

## Assumptions

- The bridge Worker `workers-issues-to-github` is deployed outside this repository and is not modified.
- The existing notification policy and webhook destination are the ones referenced by the live automation, and their
  secret still matches the bridge binding (manual and automatic deliveries both succeeded on 2026-11-10/11).
- Cloudflare's current documentation (fetched 2026-11-11) governs trigger behaviour and configuration ownership.
