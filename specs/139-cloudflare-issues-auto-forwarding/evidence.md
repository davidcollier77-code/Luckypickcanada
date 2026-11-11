# Evidence: Workers Issues → GitHub Automatic Forwarding

**Date**: 2026-11-11
**Cloudflare account**: `dbd3120f6fa0104b5fe66c201ea4251b`
**Worker**: `luckypickcanada-app`
**Bridge**: `https://workers-issues-to-github.davidcollier77.workers.dev`

## 1. Root cause

The live automation is an occurrence-threshold trigger:

```json
{
  "id": "8cbf45b7-c1eb-45b1-9fff-abec0a92f146",
  "name": "Issue notification",
  "enabled": true,
  "ansPolicyId": "91cf4237e6f94ae2b062c7cf1bc72f94",
  "service": "luckypickcanada-app",
  "triggerType": "occurrence_threshold",
  "threshold": 1,
  "revision": 1,
  "created": "2026-11-10T07:08:08Z"
}
```

Cloudflare documents that this trigger "runs once when an issue's occurrence count crosses the configured threshold"
and "does not run for every occurrence after the threshold"
(<https://developers.cloudflare.com/workers/observability/issues/automations>).

The five active security issues were first observed on 2026-11-09, before the automation existed, and had already
crossed threshold 1. Their activity records contain only `initiatedBy: "manual"` runs while occurrences continued:

| Cloudflare issue | Occurrences at inspection | Last observed | Automatic runs |
|---|---|---|---|
| `a94d47c2…` wordpress | 8 | 2026-11-11T15:23:00Z | 0 |
| `555015df…` secret-files | 249 | 2026-11-11T13:40:08Z | 0 |
| `f8607191…` debug-endpoints | 29 | 2026-11-11T09:27:41Z | 0 |
| `7e965902…` known-scanner-path | 11 | 2026-11-11T09:27:41Z | 0 |
| `c17a7103…` source-control | 51 | 2026-11-11T09:27:41Z | 0 |

The one issue created after the automation did cross the threshold for the first time and fired automatically:

- Issue `9d04f7f8…` "Oracle Error: Missing content in Groq API response", first observed 2026-11-10T20:01:44Z.
- Automatic run `62ddc528-ebe2-4099-ba26-383015d6c2df`, `initiatedBy: automatic`, status `succeeded`,
  created 2026-11-10T20:02:05Z.
- GitHub issue [#1810](https://github.com/davidcollier77-code/Luckypickcanada/issues/1810) created 2026-11-10T20:02:07Z
  with the same correlation ID.

**Conclusion**: automatic forwarding was not broken. It is a one-shot trigger per issue. Manual runs bypass the
trigger, so they always work. Any issue that already crossed the threshold, or that returns after resolution, can
never be forwarded automatically by that automation alone.

## 2. The 401 Unauthorized

- `POST /` to the bridge with no credentials returns `HTTP 401 {"error":"Unauthorized"}` (observed 2026-11-11).
- `GET /` returns `HTTP 405 {"error":"Method not allowed"}`.
- Cloudflare sends a generic webhook's configured secret in the `cf-webhook-auth` header and recommends rejecting
  requests without it (<https://developers.cloudflare.com/notifications/get-started/configure-webhooks/>).
- Real deliveries from the configured policy succeeded and created GitHub issues: automatic run `62ddc528…` → #1810,
  manual runs `6ec34bf4…` → #1814, `7aa6ec27…` → #1822, `40b57c40…` → #1821.

**Conclusion**: the 401 is the bridge correctly rejecting a request that did not carry the shared secret. It is not a
credential mismatch on the Cloudflare → bridge path, because that path authenticated and created GitHub issues both
before and after this change. No key, token or secret was rotated; rotating one would have broken a working path.
The bridge Worker retains no observability telemetry (a telemetry query over 2026-11-06 → 2026-11-11 returned zero
events), so the exact historical request that produced a 401 cannot be attributed from logs.

## 3. Configuration alignment

- `wrangler.jsonc` sets `observability.enabled: true` and `observability.issues.enabled: true`.
- Wrangler 4.148.0 accepts that block: a `wrangler deploy --dry-run` with the same `observability` and `issues`
  settings exited 0. No Wrangler change was required.
- Cloudflare documents destinations and automations as dashboard/`cf` CLI configuration, not Wrangler configuration
  (<https://developers.cloudflare.com/workers/observability/issues/automations>). They were therefore not added to
  `wrangler.jsonc`.
- The live dashboard detector is enabled and producing occurrences, consistent with the checked-in setting.

## 4. Changes

1. **Live Cloudflare automation added** (API, supported method):
   - id `ecda5e06-ae7f-4cf5-b848-58b0a2908f35`
   - name `Luckypickcanada App Issue Recurrence to GitHub`
   - `triggerType: recurrence_after_inactivity`, `inactivitySeconds: 3600`
   - `enabled: true`, `service: luckypickcanada-app`, `ansPolicyId: 91cf4237e6f94ae2b062c7cf1bc72f94`
   - It reuses the existing policy and webhook destination, so no credential or destination changed.
   - The original occurrence automation `8cbf45b7…` is unchanged (same id, name, threshold, revision 1, `updated`
     timestamp unchanged).
2. **`scripts/cloudflare/workers-issues-to-github-setup.sh` repaired**:
   - Webhook preflight no longer compares a secret Cloudflare never returns; it matches by name and URL and leaves the
     stored secret untouched.
   - Policy preflight identifies the policy by `alert_type` plus webhook destination instead of its display name
     (the dashboard names it `Workers Issues: workers-issues-to-github`).
   - Automation preflight uses the read schema (`ansPolicyId`, `threshold`, `inactivitySeconds`, `triggerType`) and
     matches on service + policy + trigger, so it reuses the dashboard's `Issue notification` automation instead of
     creating a duplicate.
   - The script reconciles both triggers, creating only what is missing.
   - Fourteen shell continuation lines had doubled trailing backslashes. A repro proved this fails at runtime
     (`jq: syntax error`, then `--arg: command not found`), so the script could not create or read its payloads.
     They were normalized to single backslashes; `bash -n` passes.
3. **No change** to `wrangler.jsonc`, the bridge Worker, its bindings (`GITHUB_TOKEN`, `WEBHOOK_SECRET`,
   `ISSUE_DEDUPE`), the webhook destination, the notification policy, the occurrence automation, the deployment
   workflow or any credential.

## 5. Verification

| Check | Result | Evidence |
|---|---|---|
| Wrangler accepts `observability.issues.enabled` | PASS | `wrangler deploy --dry-run` exit 0, Wrangler 4.148.0 |
| Script syntax | PASS | `bash -n scripts/cloudflare/workers-issues-to-github-setup.sh` exit 0 |
| Doubled continuation lines | PASS | 0 remaining; runtime repro showed the old form failed |
| Occurrence automation preserved | PASS | `8cbf45b7…`, `threshold: 1`, revision 1, `updated` 1794294488774 unchanged |
| Recurrence automation live | PASS | `ecda5e06…`, enabled, `recurrence_after_inactivity`, 3600 s, same `ansPolicyId` |
| Live delivery still authenticated | PASS | Manual run `40b57c40…` status `succeeded`; run `7aa6ec27…` status `succeeded` |
| GitHub issue creation through the existing bridge | PASS | #1821 (from `40b57c40…`, 2026-11-11T17:53:05Z) and #1822 (from `7aa6ec27…`, 17:53:45Z) |
| Automatic path end to end | PASS (recorded) | Automatic run `62ddc528…` → #1810 with matching correlation ID |
| Unauthenticated request rejected | PASS | `POST /` → HTTP 401 `{"error":"Unauthorized"}` |
| Automatic recurrence run observed | NOT OBSERVED | 170-second watch after creating the recurrence automation produced no run; it requires a new occurrence after ≥1 h of inactivity |
| Bridge runtime logs | BLOCKED | The bridge retains no Workers Observability telemetry |
| `./freebuff-verify.sh` | PASS | exit 0; Spec Kit gate, type check, production build and 36 documentation tests |
| Build size | PASS | 335,940,051 bytes = 320.38 MiB, under 495 MiB |
| `git diff --check` | PASS | exit 0, no whitespace errors |

## 6. Duplicate protection finding

Replaying the already-forwarded Oracle issue produced #1821 while #1810 was still open. This shows the bridge's
duplicate protection is scoped to retries of the same notification run/correlation ID, not to the Cloudflare issue
across separate runs. The setup script's existing dedupe test (same issue re-triggered seconds later) remains as it
was; no cross-run dedupe was added, removed or claimed. A recurrence automation therefore creates one GitHub issue per
recurrence event; existing open issues are **not** collapsed by the bridge.

## 7. Remaining limitations

- The recurrence trigger is time-based. Its first automatic run can only be observed after a matching issue occurs at
  least 3,600 seconds after its previous occurrence and after the automation was created (2026-11-11T17:51:36Z). The
  bounded watch in this task did not reach such an occurrence.
- Cloudflare's notification policy and webhook destination could not be read with the available API token
  (`/alerting/v3/policies` returned HTTP 403 Authentication error), so policy display names and delivery history are
  inferred from the automation's `ansPolicyId`, the issue activity and the GitHub issues the bridge created.
- The bridge Worker source, bindings and logs are not readable with the available token, so its dedupe TTL and
  payload handling are characterized from observed behaviour only.
- The setup script is interactive (Cloudflare token and webhook secret prompts). It was statically checked and its
  reconciliation logic was exercised against the live API manually, but it was not run end to end in this session.
