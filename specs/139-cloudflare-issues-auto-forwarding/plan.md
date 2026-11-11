# Implementation Plan: Reliable Automatic Workers Issues → GitHub Forwarding

**Branch**: `fix/cloudflare-issues-auto-forwarding` | **Date**: 2026-11-11 | **Spec**: [spec.md](spec.md)

## Summary

Preserve the working occurrence-threshold automation for first detection and add the complementary
recurrence-after-inactivity automation so recurring or reopened issues are forwarded again. Fix the repository setup
script so it reconciles the live resources idempotently against the current Cloudflare API. Leave `wrangler.jsonc`,
the bridge Worker, the webhook destination, the policy and every credential untouched.

## Technical Context

- **Platform**: Cloudflare Workers Observability Issues (account-level notification destinations, policies,
  issue automations) plus the separately deployed `workers-issues-to-github` bridge Worker.
- **Configuration ownership**: Cloudflare documents automations and destinations as dashboard- or `cf` CLI-managed.
  Wrangler has no schema for them. `wrangler.jsonc` only enables the Issues detector through
  `observability.issues.enabled`.
- **Wrangler**: 4.148.0 (pinned). A dry-run with `observability.issues.enabled: true` exits 0, so the checked-in block
  is supported and valid.
- **Testing**: live Cloudflare API reads, a live manual notification replay, GitHub issue verification, `bash -n`,
  and the repository verification script.

## Research (official Cloudflare documentation, fetched 2026-11-11)

1. **Trigger semantics** — <https://developers.cloudflare.com/workers/observability/issues/automations>:
   "Occurrence threshold: runs once when an issue's occurrence count crosses the configured threshold." and
   "An occurrence-threshold automation does not run for every occurrence after the threshold. A recurrence automation
   requires at least one earlier occurrence."
2. **Automation API** — create accepts `policyId`, `afterOccurrences` (min 1) or `afterInactivitySeconds`
   (3600–31536000), `enabled`, `name`, `service`; reads return `ansPolicyId`, `threshold`, `inactivitySeconds`,
   `triggerType`, `revision`.
3. **Manual runs** — `POST /workers/observability/issues/{issueId}/notification-runs` records a run with
   `initiatedBy: manual|automatic` and `status`; run history is exposed as the issue's `activity` entries.
4. **Generic webhook auth** — <https://developers.cloudflare.com/notifications/get-started/configure-webhooks/>:
   Cloudflare sends the configured secret in the `cf-webhook-auth` header on every request, and the endpoint should
   reject requests where it is absent or wrong.
5. **Configuration method** — the automations page states automations and destinations are configured in the dashboard
   or with the Cloudflare CLI (`cf`). Wrangler must not be used for them.

## Live evidence collected

- `GET /workers/observability/issues/automations`: one enabled automation, id `8cbf45b7-c1eb-45b1-9fff-abec0a92f146`,
  name `Issue notification`, `ansPolicyId 91cf4237e6f94ae2b062c7cf1bc72f94`, service `luckypickcanada-app`,
  `triggerType occurrence_threshold`, `threshold 1`, revision 1, created 2026-11-10T07:08:08Z.
- Five security issues (`a94d47c2…`, `555015df…`, `f8607191…`, `7e965902…`, `c17a7103…`) have occurrences up to
  2026-11-11T13:40:08Z but only `initiatedBy: manual` activity entries.
- The log issue `9d04f7f8…` (created 2026-11-10T20:01:44Z) has `initiatedBy: automatic` run
  `62ddc528-ebe2-4099-ba26-383015d6c2df`, status `succeeded`, and GitHub issue #1810 was created at 20:02:07Z with
  the same correlation ID.
- The bridge answers unauthenticated `POST /` with `401 {"error":"Unauthorized"}` and `GET` with `405`.
- The bridge Worker has no retained observability telemetry, so historical log lines are unavailable.

## Decisions

1. **Do not change `wrangler.jsonc`.** Its Issues detector setting is supported by the pinned Wrangler and matches the
   live enabled detector. Notifications and automations are not Wrangler-managed, so adding them is unsupported.
2. **Keep the occurrence-threshold automation exactly as-is** (same id, name, threshold and policy) to preserve
   first-occurrence forwarding and avoid any working-path regression.
3. **Add one complementary recurrence-after-inactivity automation** with the documented minimum 3600-second window,
   linked to the same policy and service. It is not a duplicate: it has a different trigger and covers a case the
   occurrence automation cannot. It reuses the existing destination and secret, so no credential changes.
4. **Repair the setup script's identity checks**:
   - Webhook: match by name and URL; never compare or rewrite the write-only secret.
   - Policy: match by `alert_type` and the webhook destination, because the dashboard name differs from the script's.
   - Automations: match by service, policy and `triggerType`, reading `ansPolicyId`/`threshold`/`inactivitySeconds`.
   - Reconcile both triggers and create only what is missing.
5. **Make the end-to-end checks dedupe-aware**: an already-open GitHub issue referencing the Cloudflare issue ID must
   expect no new issue, because duplicate protection is intentional.
6. **Do not touch** the bridge Worker, its bindings, the webhook, the policy, `WEBHOOK_SECRET`, `GITHUB_TOKEN`,
   `ISSUE_DEDUPE`, the Cloudflare API token or any GitHub secret.

## Verification Plan

- `bash -n scripts/cloudflare/workers-issues-to-github-setup.sh` and inspection of the changed regions.
- Live `GET` of automations before/after: existing automation unchanged, new recurrence automation enabled with the
  expected policy, service and inactivity window.
- Live manual notification replay for an already-forwarded issue: run must succeed (proving `cf-webhook-auth` still
  matches) and the bridge's dedupe must prevent a duplicate GitHub issue.
- Authenticated-vs-unauthenticated probe of the bridge: 401 without the secret remains.
- Poll the issue activity for an automatic recurrence run after the change; record success or the timing limitation.
- `./freebuff-verify.sh` and build-size measurement where the environment permits.

## Preserved behaviour

The site Worker, deployment workflow, `wrangler.jsonc`, all bindings and secrets, the bridge Worker, the webhook
destination, the notification policy, the occurrence automation and the bridge's duplicate protection are unchanged.
