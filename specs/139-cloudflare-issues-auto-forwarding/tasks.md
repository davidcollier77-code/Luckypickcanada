# Tasks: Reliable Automatic Workers Issues → GitHub Forwarding

**Input**: Design documents from `specs/139-cloudflare-issues-auto-forwarding/`
**Prerequisites**: `plan.md`, `spec.md`

## Phase 1: Specify

- [x] T001 Read `AGENTS.md`, the four Memory Bank files, `.docs/manifest.json`, `.freebuff/` guidance and `PR_SUBMISSION.md`.
- [x] T002 Inspect `wrangler.jsonc`, the deployment workflow, the Cloudflare automation setup script and the existing
  resolution route/module.
- [x] T003 Read the live Cloudflare automation, issue activity and notification-run history; read the bridge's
  unauthenticated responses; inspect GitHub issues created by the bridge.
- [x] T004 Compare the configuration with current official Cloudflare documentation for automations, trigger semantics
  and generic webhook authentication.
- [x] T005 Record the root cause: occurrence-threshold automation runs once per issue, so pre-existing and recurring
  issues are never forwarded automatically; manual runs bypass the trigger.
- [x] T006 Write `spec.md`, `plan.md` and this task list; point `.specify/feature.json` at this feature.

## Phase 2: Implement

- [x] T007 Verify `observability.issues.enabled` is supported by the pinned Wrangler (dry-run exit 0) and leave
  `wrangler.jsonc` unchanged because automations are not Wrangler-managed.
- [x] T008 Repair `scripts/cloudflare/workers-issues-to-github-setup.sh`: webhook identity without secret comparison,
  policy identity by alert type and destination, automation identity by service/policy/trigger with the API's read
  field names, idempotent reconciliation of both triggers, and normalization of 14 doubled shell continuation lines
  that made `jq` payload construction fail at runtime.
- [x] T009 Keep the script's end-to-end checks aligned with observed dedupe behaviour after a replay showed the bridge
  does not collapse separate runs for the same Cloudflare issue.
- [x] T010 Add the recurrence-after-inactivity automation in the live account (`ecda5e06…`), reusing the existing
  policy and secret.
- [x] T011 Update Memory Bank context and the progress record.

## Phase 3: Verify

- [x] T012 `bash -n` the setup script (exit 0), inspect the changed regions and confirm no doubled continuation lines.
- [x] T013 Confirm exactly one occurrence and one recurrence automation, both enabled and linked to policy
  `91cf4237e6f94ae2b062c7cf1bc72f94`; the original automation id, name, threshold, revision and `updated` timestamp are
  unchanged.
- [x] T014 Replay Cloudflare notifications: runs `40b57c40…` and `7aa6ec27…` both succeeded; GitHub issues #1821 and
  #1822 were created with matching correlation IDs.
- [x] T015 Confirm the bridge still returns HTTP 401 `{"error":"Unauthorized"}` for an unauthenticated POST.
- [x] T016 Confirm automatic forwarding end to end from the recorded automatic run `62ddc528…` → GitHub #1810. A fresh
  automatic recurrence run was NOT observed in the 170-second watch because it requires ≥1 h of inactivity.
- [x] T017 Confirm no credential was read, printed, written or rotated; audit the final diff, run
  `./freebuff-verify.sh` (exit 0) and measure the build (320.38 MiB, under 495 MiB).

## Dependencies

- T007–T011 depend on T001–T006.
- T012–T017 depend on T007–T011.

## Implementation Strategy

Keep the proven first-occurrence path untouched, add only the complementary recurrence trigger, and make the
repository tooling match the live API so future runs reconcile instead of duplicating. No Worker, binding, secret,
workflow or Wrangler change.
