# Cloudflare MCP — the saved token is not transmitted, and where that defect lives

**PR** #1707 (open, unmerged). **Branch** `freebuff/470e1a482c31244d064438de` → `main`. Feature artifacts
reused in place: `specs/087-skill-mcp-audit` (revision 5). No duplicate feature directory was created.

## Assigned task and selected task groups

**Assigned task:** finish fixing the existing Freebuff Cloudflare API MCP connection. Continue the existing
investigation and PR #1707; treat the already-saved Cloudflare API token and its independent verification by
Agent Lee as established evidence; do **not** create, replace, regenerate or re-save the token and do **not**
create another connection. Find and fix why Freebuff's connector does not correctly retrieve or transmit the
existing credential — investigating the connector's authentication and header construction, not synthetic
credential tests — and verify read-only access to the `luckypickcanada.ca` zone and its DNS records.

**Selected task groups:**

- **`troubleshooting`** — a live third-party connection failure that must be reproduced and attributed from
  measurement.
- **`deep-dive`** — the failure crosses four layers (repository, Freebuff connector, credential store,
  Cloudflare); the root cause and its boundary must be proven, not assumed.
- **`security`** — the subject is an authentication header and a live credential; the investigation must
  never read, print, replace or rotate it, and must not weaken validation.
- **`testing`** — every claim below was produced by executing a real call; the diagnostic was re-run, not
  merely inspected.

## Result in one line

**Cause proven:** the connector does **not transmit the credential that is saved in it.** With a saved,
independently verified token, the connection returns the *identical* signature it returned before the
credential existed — `6003` + `error_chain[6111]` on `/zones`, `9106 Authentication failed (status: 400)` on
`/zones/:id/dns_records` — and a control call with an all-zero zone id returns the same `9106`, so the request
dies at the `Authorization` header before the zone, account or any permission is consulted. **Read-only zone
and DNS access for `luckypickcanada.ca` is still BLOCKED. `USEFUL RESULT: NO`.**

## Evidence 1 — the error did not change when the credential did

| Call (read-only) | When | Result |
|---|---|---|
| `LIST_ZONES(name=luckypickcanada.ca, per_page=20)` | 09:28Z–12:0xZ, **before** the save (3 calls) | `6003 Invalid request headers` + chain `6111 Invalid format for Authorization header` |
| `LIST_ZONES(name=luckypickcanada.ca, per_page=20)` | 12:29Z, **after** the save | **identical** `6003` + `6111` |
| `LIST_DNS_RECORDS(zone_id=0af2a3985db329cdb671829cb59a41f1)` | before the save | `9106 Authentication failed (status: 400)` |
| `LIST_DNS_RECORDS(zone_id=0af2a3985db329cdb671829cb59a41f1, per_page=100)` | 12:29Z, after the save | **identical** `9106 Authentication failed (status: 400)` |

That comparison is the discriminator. A 40-character token-charset bearer can only produce provider data, or
`403`/`9109`, or `401`/`10000`. It can never produce `6003`/`6111` or `9106` at HTTP 400. So the value on the
wire is not the saved token.

## Evidence 2 — control: the rejection precedes the resource and permission layers

| Call | Result |
|---|---|
| `LIST_DNS_RECORDS(zone_id=00000000000000000000000000000000, per_page=5)` | **identical** `9106 Authentication failed (status: 400)` |

An all-zero zone id is indistinguishable from the real one, so the zone id, the account, and the
`Zone:Read`/`DNS:Read` scope are all **not** implicated. The failure happens at header construction.

## Evidence 3 — the boundary is unchanged (re-run this round)

`node scripts/cloudflare-auth-diagnose.mjs --probe`, 12:30Z, against `api.cloudflare.com` with synthetic
values only:

| `Authorization: Bearer …` | `/zones` |
|---|---|
| *(no header)* | `403` `9106` + `9107` missing headers |
| 9 (`undefined`), 31, 37 (Global-Key shape), 39 chars | `400` `6003` + `6111` |
| 40 chars, token charset | `403` `9109` Invalid access token |
| 41 chars | `403` `9109` |
| 40 chars with `!` | `400` `6003` + `6111` |

Every format-rejected value produces the connector's signature and only format-rejected values do.

## Why revision 4's conclusion is wrong (recorded, not overwritten)

Revision 4 concluded the connection holds a 37-hex Global API Key and that this explains the failure. That
conclusion made a falsifiable prediction: replacing the stored value with a format-valid token must move the
signature to `403`/`9109`. **It did not move at all.** The identity of the stored value is therefore not the
operative cause; the non-transmission of the saved credential is. A stale 37-hex binding survives only as one
candidate for the *stale* payload, not as the finding.

## The defect, precisely — and where it must be fixed

Three surviving hypotheses produce the identical signature and **cannot be separated from this workspace**:

| # | Hypothesis | Measurement that would separate it |
|---|---|---|
| **H1** | Stale binding — the connector resolved the secret at connection creation and never re-reads it | a binding resolved per request, or a redacted fingerprint in the connector's log |
| **H2** | Field mismatch — the header is built from a different field than the save wrote (a `cloudflare_api_key` connection is the legacy key + email scheme, yet the transport is `Bearer`) | the connection's field mapping |
| **H3** | Mangling — the value is transmitted quoted, truncated below 40 characters, or percent-encoded | the outgoing header's length and character classes |

**Required platform change (Freebuff connector, not this repository):**

1. resolve the saved connection secret **per request**, not once at creation;
2. construct `Authorization: Bearer <value>` from that resolved value, with the field mapping for a
   `cloudflare_api_key` connection made explicit;
3. fail closed when the credential is absent or not bearer-compatible, so the error names the real cause;
4. log a **redacted shape fingerprint** — length, character-class membership, and equality with the literals
   `undefined`/`null`, never the value. That single field separates H1, H2 and H3 in one call.

**Why no repository change can fix it:** `code_search` finds no `api.cloudflare.com` client, no `Authorization`
construction and no MCP configuration anywhere in the repository (only workflow references to
`secrets.CLOUDFLARE_API_TOKEN`), and the connection exposes five Cloudflare tools with **no**
connection-management or connection-status tool. The header is built entirely on Freebuff's side.

## What was implemented

- **`scripts/cloudflare-auth-diagnose.mjs`** — its context header and `--probe` reading now state the
  invariance result instead of the superseded "which credential shape is stored" framing. Runtime behaviour is
  unchanged: still read-only, dependency-free, never prints the credential, still refuses bearer-incompatible
  shapes, still verifies `/user/tokens/verify`, `/zones` and `/zones/:id/dns_records`, exit `0`/`2`/`3`.
- **`specs/087-skill-mcp-audit/spec.md`** — revision 5: FR-031…FR-037, the measured table, the withdrawal of
  revision 4, H1–H3 with their separating measurements, acceptance scenarios 11–14.
- **`specs/087-skill-mcp-audit/plan.md`** — round 5 design, the connector defect report, alternatives rejected.
- **`specs/087-skill-mcp-audit/tasks.md`** — Phase 11, T049–T057.
- **`PR_SUMMARY.md`**, **`memory-bank/activeContext.md`** — this report and the round-5 context entry.

No application source, test, dependency, lockfile, workflow, environment, `.docs/` or `AGENTS.md` file was
changed. No credential, connection, token permission, DNS record, secret or Cloudflare setting was created,
read, replaced, re-saved, rotated or deleted.

## Spec Kit stages (in order, reused artifacts)

| Stage | Artifact | Outcome |
|---|---|---|
| Specify | `specs/087-skill-mcp-audit/spec.md` | Revision 5: post-save re-test requirements, withdrawal, H1–H3 |
| Plan | `specs/087-skill-mcp-audit/plan.md` | Round 5: invariance test, zone-id control, connector defect report |
| Tasks | `specs/087-skill-mcp-audit/tasks.md` | Phase 11, T049–T057 |
| Implement | verifier context + artifacts above | Implemented, executed, diff-audited |

## Library documents reviewed

| Document | Used | Useful | Note |
|---|---|---|---|
| `AGENTS.md` | USED | YES | Canonical workflow, scope, approval and PR rules; read first, unmodified |
| `.freebuff/freebuff.md` | USED | YES | Entry point confirming group selection and PR reporting |
| `.freebuff/troubleshooting.md` | USED | YES | Evidence expectations for a live connection failure |
| `.freebuff/deep-dive.md` | USED | YES | Root-cause and boundary rules; required the layer to be localised, not guessed |
| `.freebuff/security.md` | USED | YES | Credential-handling posture; forbade reading or re-saving the token |
| `.freebuff/testing.md` | USED | YES | Required real execution, which drove the live re-test and the probe re-run |
| `.docs/manifest.json` | USED | YES | Routed the group documentation list; no `.docs/` file modified |
| `.docs/*/_google_eng-practices.md` | NOT USED | NO | Cross-cutting review guidance; not material to a provider-API diagnosis |
| `.docs/*/_debian_debian-reference.md` | NOT USED | NO | No Linux/package-management question arose |
| `.docs/*` Cloudflare/OpenNext snapshots | NOT USED | NO | Failure measured directly against the provider; no framework behaviour in question |
| `memory-bank/projectBrief.md`, `memory-bank/activeContext.md` | USED | YES | Prior Cloudflare rounds and their now-corrected conclusions |

## Verification (each check recorded independently)

| Check | Status | Evidence |
|---|---|---|
| `SPEC_KIT_BASE_REF=HEAD ./freebuff-verify.sh` | **PASS** | exit 0; Spec Kit gate verified `spec.md`, `plan.md`, `tasks.md`; type check clean; production build succeeded; refresh-docs 19 passed |
| Production build size vs 495 MB maximum | **PASS** | `.next` 318,426,045 B + `public` 32,840,043 B = **351,266,088 B / 335.0 MiB** |
| `node --check scripts/cloudflare-auth-diagnose.mjs` | **PASS** | syntax OK after the edit |
| Verifier `--probe` re-run, both endpoints | **PASS** | matrix above reproduced live after the edit; exit 2 |
| Verifier, no credential | **PASS** | reports shape `absent`, performs no authenticated call, exit 2 |
| Live `LIST_ZONES` after the token was saved | **BLOCKED** | `6003` + `6111`, unchanged from pre-save |
| Live `LIST_DNS_RECORDS` after the token was saved | **BLOCKED** | `9106 Authentication failed (status: 400)`, unchanged |
| Zone-id control (all-zero id) | **PASS** | identical `9106`, localising the rejection above the resource layer |
| Read-only zone + DNS data for `luckypickcanada.ca` | **BLOCKED** | no call has ever returned provider data |
| Connector credential re-binding (the actual repair) | **BLOCKED** | Freebuff platform work; no connection-management tool and no connector code in the repository |
| PR-head CI | **PENDING** | checks run after this push |

## Remaining issues and limitations

1. **The connection is still unusable.** The repair requires a change in Freebuff's connector; the request
   forbids re-saving or replacing the token and creating another connection, and `AGENTS.md` §5 requires
   explicit owner authorisation for secret/authentication changes.
2. **H1, H2 and H3 remain indistinguishable from here.** The report names each and the exact measurement that
   would separate them; it does not claim to know which one applies.
3. **The saved token's validity is taken from the owner's statement and Agent Lee's independent verification.**
   It was not re-verified here, because reading the credential is forbidden. If that premise were false, the
   invariance argument would need re-measuring.
4. **No Cloudflare write, deploy or DNS change was attempted**, and no DNS record was read because no call
   succeeded.

`USEFUL RESULT: NO`
