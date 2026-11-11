# Active Context — Cloudflare Issues → GitHub Automatic Forwarding

- **Updated:** 2026-11-11
- **Repository:** davidcollier77-code/Luckypickcanada
- **Branch:** freebuff/76e10f03b7c69d37bc5b1dba
- **Spec Kit feature:** specs/139-cloudflare-issues-auto-forwarding
- **Pull request:** not submitted

## Current Task

Diagnose and repair the existing `workers-issues-to-github` integration so Cloudflare Workers Issues forward to GitHub
automatically, without rotating credentials, replacing the bridge Worker, duplicating automations or weakening
authentication.

## Root Cause (verified live)

- The only issue automation was an occurrence-threshold automation (`threshold: 1`) created 2026-11-10T07:08:08Z.
  Cloudflare runs that trigger **once per issue**, when its occurrence count crosses the threshold.
- The five active security issues were first observed 2026-11-09, before the automation, so they had already crossed
  the threshold and have only `manual` activity entries despite continuing occurrences.
- A new log issue created after the automation fired automatically (`62ddc528…`, succeeded) and created GitHub #1810,
  proving the webhook, secret and bridge worked all along.

## Implementation

- Added one complementary recurrence-after-inactivity automation (`ecda5e06-ae7f-4cf5-b848-58b0a2908f35`,
  3600 s, enabled, service `luckypickcanada-app`, same policy `91cf4237…`) through the Cloudflare API. The existing
  occurrence automation `8cbf45b7…` is unchanged.
- Repaired `scripts/cloudflare/workers-issues-to-github-setup.sh`: webhook identity without reading the write-only
  secret, policy identity by alert type and destination, automation identity by service/policy/trigger using the read
  schema, idempotent reconciliation of both triggers, and 14 normalized shell continuation lines that made `jq`
  payload construction fail at runtime.
- `wrangler.jsonc` is unchanged: Wrangler 4.148.0 accepts `observability.issues.enabled` (dry-run exit 0), and
  Cloudflare does not support destinations/automations in Wrangler configuration.

## Verification and Delivery Status

- **PASS:** live delivery runs `40b57c40…` and `7aa6ec27…` succeeded; GitHub #1821 and #1822 were created by the bridge.
- **PASS:** automatic path recorded as automatic run `62ddc528…` → GitHub #1810 with matching correlation ID.
- **PASS:** unauthenticated bridge POST returns HTTP 401; no credential was read, changed or rotated.
- **PASS:** `bash -n`, `git diff --check`, `./freebuff-verify.sh` (exit 0), build 320.38 MiB (< 495 MiB).
- **NOT OBSERVED:** a fresh automatic recurrence run; it needs a new occurrence after ≥1 h of inactivity.
- **FINDING:** the bridge does not deduplicate separate notification runs for the same Cloudflare issue (replaying the
  Oracle issue created #1821 while #1810 was open).

## Handoff

No PR has been opened. The live Cloudflare automation change is already applied; the repository change is the setup
script repair plus Spec Kit and Memory Bank artifacts.
