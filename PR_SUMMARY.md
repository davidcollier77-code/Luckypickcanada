# Cloudflare MCP Authentication — Fresh Investigation and Credential-Shape Fix

**Branch** `freebuff/470e1a482c31244d064438de` → `main`. Feature artifacts reused in place:
`specs/087-skill-mcp-audit` (revision 4). No duplicate feature directory was created.

## Assigned task and selected task groups

**Assigned task:** conduct a fresh investigation of the Freebuff Cloudflare API MCP connection and resolve
its authentication problem; identify the cause, implement a fix where possible, and verify that read-only
Cloudflare API access works.

**Selected task groups:**

- **`troubleshooting`** — the task is a live third-party connection failure that has to be reproduced and
  attributed from evidence, not inspection.
- **`deep-dive`** — the failure crosses three layers (repository, agent connector, Cloudflare credential);
  the group's investigation rules require the root cause to be proven and the boundary stated.
- **`security`** — the subject is an authentication header and a credential; the investigation must never
  read, print, rotate or store the secret, and must not weaken any validation.
- **`testing`** — a fix-instrument was implemented, so it had to be executed for real rather than inspected.

## Result in one line

**Cause identified and demonstrated:** the connection transmits a credential that is **not** a
40-character API Token inside `Authorization: Bearer`, and Cloudflare rejects the *header format* before it
ever evaluates the credential's identity. The repair is a 40-character scoped API Token through the same
header the connector already builds; that value can only be supplied on the owner's side. A read-only
verifier is now committed so the owner can confirm the repair. **Read-only MCP access is still BLOCKED —
no call has returned provider data. `USEFUL RESULT: NO`.**

## Evidence 1 — live connection, four calls in separate requests

| Call (read-only) | Result |
|---|---|
| `CLOUDFLARE_API_KEY_LIST_ZONES` `per_page=20` | `6003 Invalid request headers` + chain `6111 Invalid format for Authorization header` |
| `CLOUDFLARE_API_KEY_LIST_ZONES` `name=luckypickcanada.ca` | identical `6003` + `6111` |
| `CLOUDFLARE_API_KEY_LIST_ZONES` `per_page=5` (third call, later) | identical `6003` + `6111` |
| `CLOUDFLARE_API_KEY_LIST_DNS_RECORDS` `zone_id=0af2a3985db329cdb671829cb59a41f1` | `9106 Authentication failed (status: 400)` |

No retry succeeded, so the connector's own documented pitfall ("HTTP 403 that later succeeded after
retrying") does **not** explain this failure. The two endpoints return **different** codes in the same
session, which no single-endpoint theory explains.

## Evidence 2 — provider boundary, synthetic credentials only

Deliberately shaped fake values were sent to the public API from this workspace. No real credential was
used, read or printed.

| `Authorization: Bearer …` | `/zones` | `/zones/:id/dns_records` |
|---|---|---|
| *(no header)* | 403 `9106`+`9107` missing headers | 400 `9106` missing headers |
| empty / `undefined` / `null` | 400 `6003`+`6111` | 400 `9106` Authentication failed |
| length 1, 8, 9, 31, 32, 36, **37**, 38, 39 | 400 `6003`+`6111` | 400 `9106` Authentication failed |
| 37 hex (**Global API Key shape**) | **400 `6003`+`6111`** | **400 `9106` Authentication failed** |
| 40 characters, token charset | 403 `9109` Invalid access token | 401 `10000` Authentication error |
| 40 characters containing `!` | 400 `6003`+`6111` | 400 `9106` Authentication failed |
| 41 / 64 characters, token charset | 403 `9109` | not probed |

The boundary is exactly **40 token-charset characters**. Below it, or with an off-charset character,
Cloudflare rejects the header on format; at or above it, the credential reaches identity validation.

**A 37-hex bearer value reproduces both connector errors exactly. No 40-character value can produce
either of them.** `X-Auth-Key: <40 chars>` yields chain `6103`, and `X-Auth-Key: <37 hex>` + email yields
`9103`/403 — different classes from the observed one, so the connector is definitively not using the
legacy key transport.

## Why the earlier conclusion was wrong (recorded, not overwritten)

Revision 2 withdrew the credential-shape cause and blamed "a placeholder or mutated value". That
withdrawal tested a Global-API-Key-shaped value **only in `X-Auth-Key`** and never in `Authorization`, and
it did not account for the 40-character bearer boundary. A 37-character Global API Key sent as a bearer
token is fully consistent with `6111`, so the withdrawal is itself **withdrawn** in
`specs/087-skill-mcp-audit/spec.md`.

**Still open, stated honestly:** provider codes cannot separate "37-hex Global API Key" from "short
placeholder" — both give identical codes on both endpoints. The connection is registered as
`cloudflare_api_key` (the legacy Global API Key scheme), which points to the former, but that is an
inference from the connection type, not a measurement.

## The fix

- **Path A (recommended, no connector change):** supply a **40-character scoped API Token**
  (`Zone:Read`, `DNS:Read`) to the existing connection. The connector already sends
  `Authorization: Bearer <value>`; with a format-valid token the request reaches identity and permission
  checks instead of failing on header format. This remedy is also correct if the stored value is a
  placeholder, because the same re-save replaces it.
- **Path B (only if the Global API Key must be kept):** the connector must send `X-Auth-Key: <37 hex>` plus
  `X-Auth-Email`. Measured: `X-Auth-Key` with 40 characters is rejected as `6103`, so the connector has to
  branch on credential shape. This is Freebuff platform work, outside this repository.

**Corroboration that Path A is available for this account:** GitHub Actions run
[`41822284071`](https://github.com/davidcollier77-code/Luckypickcanada/actions/runs/41822284071)
("Deploy OpenNext to Cloudflare", `main` `86ace203`) completed `success` at 2026-11-04T11:39Z setting only
`secrets.CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`. Wrangler sends that variable as a bearer token,
so the owner already holds a format-valid, authorised API Token for this account. The repository secret was
**not** used, copied or read by this task.

## What was implemented

`scripts/cloudflare-auth-diagnose.mjs` — read-only, dependency-free (Node built-ins only, no build step):

- classifies the credential **by shape only** (length and character class) and never prints, stores or
  transmits the value anywhere except `api.cloudflare.com`;
- refuses to call Cloudflare with a shape that cannot authenticate, so a 37-hex key fails closed with a
  plain explanation instead of a confusing provider error;
- with a compatible credential, performs `GET /user/tokens/verify`, `GET /zones` (optional name filter) and
  `GET /zones/:id/dns_records`, and prints zone names or provider error codes only;
- `--probe` replays the synthetic shape matrix on both endpoints so the evidence above is reproducible.

Exit codes: `0` read-only access verified, `2` not verified, `3` usage error.

## Files changed

- **Added** `scripts/cloudflare-auth-diagnose.mjs`
- **Updated** `specs/087-skill-mcp-audit/spec.md` (revision 4: FR-024…FR-030, measured result, withdrawal)
- **Updated** `specs/087-skill-mcp-audit/plan.md` (round 4 design, alternatives rejected)
- **Updated** `specs/087-skill-mcp-audit/tasks.md` (Phase 10, T039–T048)
- **Updated** `PR_SUMMARY.md`, `memory-bank/activeContext.md`

No application source, test, dependency, lockfile, workflow, environment, `.docs/` or `AGENTS.md` file was
changed. No credential, connection, token, DNS record, secret or Cloudflare setting was created, read,
changed or deleted.

## Spec Kit stages (in order, reused artifacts)

| Stage | Artifact | Outcome |
|---|---|---|
| Specify | `specs/087-skill-mcp-audit/spec.md` | Revision 4 appended: fresh re-test, boundary requirements FR-024…FR-030, withdrawal record |
| Plan | `specs/087-skill-mcp-audit/plan.md` | Round 4 design: repeat reproduction, two-endpoint sweep, signature match, committed verifier |
| Tasks | `specs/087-skill-mcp-audit/tasks.md` | Phase 10, T039–T048 |
| Implement | `scripts/cloudflare-auth-diagnose.mjs` + artifacts above | Implemented, executed, diff-audited |

## Library documents reviewed

| Document | Used | Useful | Note |
|---|---|---|---|
| `AGENTS.md` | USED | YES | Canonical workflow, scope, approval and PR rules; read first, unmodified |
| `.freebuff/freebuff.md` | USED | YES | Entry point confirming group selection and PR reporting |
| `.freebuff/troubleshooting.md` | USED | YES | Investigation/evidence expectations for a live connection failure |
| `.freebuff/deep-dive.md` | USED | YES | Root-cause and boundary rules; authorises investigation scope |
| `.freebuff/security.md` | USED | YES | Credential-handling posture (no read, no print, no weakening) |
| `.freebuff/testing.md` | USED | YES | Requires real execution, which drove running the verifier end to end |
| `.docs/manifest.json` | USED | YES | Routed the group documentation list; no `.docs/` file modified |
| `.docs/{troubleshooting,deep-dive,security,testing}/_google_eng-practices.md` | NOT USED | NO | Cross-cutting review guidance; not material to a provider-API diagnosis |
| `.docs/*/_debian_debian-reference.md` | NOT USED | NO | No Linux/package-management question arose |
| `.docs/*` Cloudflare/OpenNext snapshots | NOT USED | NO | The failure was measured directly against the provider; no framework behaviour was in question |
| `memory-bank/projectBrief.md`, `memory-bank/activeContext.md` | USED | YES | Prior Cloudflare rounds and their (now corrected) conclusions |

## Verification (each check recorded independently)

| Check | Status | Evidence |
|---|---|---|
| `./freebuff-verify.sh` with `SPEC_KIT_BASE_REF=HEAD` | **PASS** | exit 0; Spec Kit gate verified `spec.md`, `plan.md`, `tasks.md`; type check clean; production build succeeded; refresh-docs 19 passed |
| Production build size vs 495 MB maximum | **PASS** | `.next` 301,019,497 B + `public` 32,840,043 B = **333,859,540 B / 318.4 MiB** |
| `node --check scripts/cloudflare-auth-diagnose.mjs` | **PASS** | syntax OK |
| Verifier, no credential | **PASS** | reports shape `absent`, performs no authenticated call, exit 2 |
| Verifier, synthetic 37-hex credential | **PASS** | classifies `global-api-key`, refuses to call the API, exit 2 |
| Verifier, synthetic 40-character credential | **PASS** | reaches identity validation: `/user/tokens/verify` 401 `1000`, `/zones` 403 `9109`, `/dns_records` 401 `10000`; exit 2 |
| Verifier `--probe` matrix, both endpoints | **PASS** | reproduced the full table above live |
| Live MCP read-only Cloudflare access | **BLOCKED** | four calls, all failing; no zone or DNS data returned |
| Owner-side repair confirmation | **PENDING** | requires the owner to save a 40-character API Token and re-run the verifier |
| PR-head CI | **PENDING** | checks run after push |

## Remaining issues and limitations

1. **The repair itself is not applied.** Resolving the connection needs an owner-side credential change;
   `AGENTS.md` §5 requires explicit owner authorization for secrets/authentication, and the request forbids
   handling the credential. The MCP remains unusable until then.
2. **Credential shape is narrowed, not identified.** Codes prove "not a 40-character token"; they cannot
   prove whether the stored value is a 37-hex Global API Key or a placeholder.
3. **The repository cannot fix the connector.** `code_search` finds no `api.cloudflare.com` client, no
   `Authorization` construction and no MCP configuration; only workflow `secrets.CLOUDFLARE_API_TOKEN`
   references exist.
4. **No Cloudflare write or deploy was attempted**, and no DNS record was read from a successful call
   because none succeeded.
