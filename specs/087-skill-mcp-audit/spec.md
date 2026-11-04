# Feature Specification: Skill Library and MCP Connection Audit

**Feature Branch**: `freebuff/d39d4997e3eae68c62117cc1`
**Created**: 2026-11-04
**Status**: Draft

**Input**: Audit Freebuff's installed skill library and connected MCPs. List every installed skill and its
purpose; list every connected MCP with its available tools; verify each MCP is reachable and functioning
and identify disconnected, unavailable or misconfigured connections; determine whether Freebuff
auto-discovers and applies relevant skills and MCP tools or needs explicit instruction; explain how skills
are discovered, loaded, activated and applied; identify any skill or MCP Freebuff cannot discover or use;
provide examples of selection and use. Audit and report only.

## Scope and Boundaries

- **Audit-only.** No change to `AGENTS.md`, global configuration, MCP connections, permissions, installed
  skills, or application source. The only files written are the Spec Kit artifacts this repository's
  governance requires, the canonical PR summary, and the Memory Bank entry.
- **Verified versus unverified must stay separate.** A connection is reported as working only after a real
  tool call succeeded; a skill is reported as installed only after its instructions were actually read.
- **No secret exposure.** Failure messages are quoted only as provider error codes and text; no
  credential, token or key value is printed, stored or committed.

## User Scenarios & Testing

### User Story 1 — A trustworthy inventory of what is installed (Priority: P1)

The owner can read one list of every installed skill and every connected MCP, each with the purpose it
serves, so the capability surface is known rather than assumed.

**Why this priority**: Every later conclusion depends on the inventory being complete and read from the
real discovery surface rather than remembered.

**Independent Test**: The inventory enumerates all 14 skills declared by the skill tool, each confirmed by
a successful instruction read, and all 4 connected MCP accounts, each confirmed by a discovery call.

**Acceptance Scenarios**:

1. **Given** the skill discovery surface, **When** the audit runs, **Then** every declared skill is
   listed with its name, purpose and activation rule.
2. **Given** the connected-app surface, **When** the audit runs, **Then** every account is listed with its
   discoverable tools.
3. **Given** a skill or app that appears in a listing, **When** the audit reports it, **Then** listing
   alone is not treated as proof of use.

---

### User Story 2 — Broken connections are proven broken, not assumed (Priority: P1)

Each MCP is exercised with a read-only call, and a failure is reported with the provider's own error so the
owner can act on it.

**Why this priority**: The request explicitly forbids assuming a connection works because it appears in a
list; the value of the audit is separating the four accounts into working and failing.

**Independent Test**: Every account receives at least one read-only call; a failing account is called twice
to distinguish a persistent credential fault from a transient one; results are recorded per account.

**Acceptance Scenarios**:

1. **Given** a connected account, **When** a read-only tool call returns data, **Then** it is recorded as
   VERIFIED WORKING with the evidence summarised.
2. **Given** an account whose call returns a provider error, **When** the call is repeated and fails
   again, **Then** it is recorded as FAILING with the exact error code and message.
3. **Given** a write-capable tool, **When** the audit runs, **Then** no write, delete or deploy is
   performed.

---

### User Story 3 — The activation gap is stated plainly (Priority: P2)

The owner learns whether relevant skills and MCP tools are used automatically, and what — if anything —
in repository instructions or global configuration would make that reliable.

**Why this priority**: The inventory is only actionable once the owner knows whether capability is being
used by default or only when explicitly requested.

**Independent Test**: The audit compares the repository's instruction files against the skill surface and
shows whether any instruction causes skill or MCP invocation; the answer is backed by counts and by what
actually happened in the session.

**Acceptance Scenarios**:

1. **Given** `AGENTS.md`, **When** searched for skill guidance, **Then** the number of matches is reported
   as a measured fact.
2. **Given** the session transcript, **When** skill and MCP use is reviewed, **Then** each invocation is
   attributed to the explicit task instruction that caused it.

### Edge Cases

- A skill whose file is only a relocation stub, or that carries `disable-model-invocation`, cannot be
  model-invoked however relevant it is.
- A skill may declare sub-skills or helper scripts that are not installed; that is a broken dependency,
  not a working skill.
- A skill may depend on an MCP that is not connected.
- A repository instruction may gate a tool that is not connected at all, in which case the rule currently
  constrains nothing.
- Account-level connections are invisible to repository configuration; the repo cannot verify or repair
  them.

## Requirements

### Functional Requirements

- **FR-001**: The audit MUST list every installed skill with a brief purpose statement.
- **FR-002**: The audit MUST list every connected MCP account with its available tools and capabilities.
- **FR-003**: The audit MUST verify each MCP with at least one real read-only call and MUST label each
  account VERIFIED WORKING or FAILING.
- **FR-004**: The audit MUST identify skills or MCPs that Freebuff cannot discover, load or use, with the
  evidence for each.
- **FR-005**: The audit MUST explain how skills are discovered, loaded, activated and applied.
- **FR-006**: The audit MUST determine whether automatic selection occurs or explicit instruction is
  required.
- **FR-007**: The audit MUST identify whether additional `AGENTS.md` or global configuration would help,
  and MUST present recommendations separately for approval rather than applying them.
- **FR-008**: The audit MUST classify every finding as VERIFIED or UNVERIFIED and MUST NOT present an
  unverified claim as a result.
- **FR-009**: The audit MUST NOT expose any credential value.

### Key Entities

- **Skill**: a named instruction set in the account's skill library, discovered by name and description
  and loaded on demand.
- **MCP account**: an app connected to the Freebuff account, exposing named tools through a discovery
  tool and an execution tool.
- **Verification result**: the outcome of one real tool call, recorded per account.

## Success Criteria

### Measurable Outcomes

- **SC-001**: 100% of declared skills are listed and 100% have their instructions successfully read.
- **SC-002**: 100% of connected MCP accounts receive a real call and are labelled working or failing.
- **SC-003**: Every skill or MCP limitation names the exact missing dependency, disabled flag or provider
  error that causes it.
- **SC-004**: The repository verification gate passes with no application source file changed, and the
  production build stays below the 495 MB maximum.

## Follow-up Scope — Cloudflare MCP authentication repair (2026-11-04)

**Added by**: a follow-up instruction to investigate and repair the Cloudflare MCP authentication failure
and, where the cause lies outside the repository, to state exactly what must be corrected.

### Requirements

- **FR-010**: The investigation MUST establish whether `6003/6111` means an absent credential, a malformed
  credential, or a rejected credential, by differential test rather than inference.
- **FR-011**: The root cause MUST be attributed to a specific layer — repository, Freebuff connector, or
  the Cloudflare credential itself — and MUST NOT be blamed on the repository without evidence.
- **FR-012**: Where the cause lies outside the workspace, the exact correction the owner must perform MUST
  be stated, with a secret-free way for the owner to confirm it.
- **FR-013**: No token may be created, revoked, revealed, rotated or modified; no DNS record may be
  changed; no permission may be expanded; no credential value may be read or committed.
- **FR-014**: The repair MUST NOT be reported as verified unless a read-only Cloudflare call succeeds.

### Acceptance Scenarios

1. **Given** the failing connection, **When** read-only calls are made, **Then** the error is reproduced and
   recorded verbatim rather than paraphrased.
2. **Given** Cloudflare's header handling, **When** deliberately shaped fake credentials are sent to the
   public API, **Then** the error class for absent, malformed and invalid credentials is distinguished.
3. **Given** that distinction, **When** it is compared with the error the MCP returns, **Then** the layer
   at fault is identified from evidence.
4. **Given** a cause outside the repository, **When** the report is written, **Then** the owner's exact
   corrective step is stated and the repair is recorded as BLOCKED instead of complete.

### Edge Cases

- A credential that is present but empty produces the same error class as an unsupported or missing scheme.
- A Global API Key is not an API Token and cannot be sent as a bearer credential; sending one is a format
  fault, not a permissions fault.
- By error code alone, a quoted or truncated paste is indistinguishable from the wrong credential type, so
  the report names both possibilities rather than asserting one.

### Revision 2 — header-construction discrimination (2026-11-04)

**Trigger**: the owner reports that the restricted token authenticates as a direct bearer credential and
returns the `luckypickcanada.ca` zone, so the credential is valid and the first-round credential-shape
conclusion must be re-tested rather than repeated.

- **FR-015**: The diagnosis MUST read the full provider payload including `error_chain`, because Cloudflare
  nests the specific reason there instead of emitting a second top-level error.
- **FR-016**: The investigation MUST distinguish the bearer path from the legacy `X-Auth-Key`/`X-Auth-Email`
  path by their chain codes (`6111` versus `6103` versus `9106`/`9107`).
- **FR-017**: Any earlier conclusion contradicted by new evidence MUST be explicitly withdrawn in the
  artifacts and the PR summary, not silently overwritten.
- **FR-018**: The correction MUST be attributed to the layer that constructs the header, and a
  no-new-credential owner check MUST be offered; creating, rotating or revealing a credential remains
  forbidden under FR-013.

**Withdrawn in revision 2**: the claim that a 37-character Global API Key produces `6003/6111`. Measured
against the public API, that shape returns `9103` with an email header and `9106` without, and the legacy
slot returns chain `6103`, not `6111`. A doubled `Bearer ` prefix is also excluded because it parses as
well-formed and returns `9109`.

**Acceptance scenarios (revision 2)**

5. **Given** the connector's reported `error_chain` code, **When** the same code is reproduced with a
   placeholder bearer value, **Then** the fault is attributed to header construction rather than to the
   credential's validity.
6. **Given** an earlier hypothesis that a different credential shape is at fault, **When** measurement
   refutes it, **Then** the artifacts and the PR summary record the withdrawal with the counter-evidence.

### Revision 3 — transport status and escalation (2026-11-04)

- **FR-019**: Success requires both `LIST_ZONES` and `LIST_DNS_RECORDS` to return actual provider data; a
  connected indicator or a written diagnosis MUST NOT be accepted as verification.
- **FR-020**: The investigation MUST use a supplied `zone_id` to exercise the DNS endpoint directly, so a
  zone-listing failure cannot mask a second, independent defect.
- **FR-021**: The failure MUST be classified by HTTP status as well as error code, because `400` (structurally
  invalid header) and `403` (well-formed but rejected credential) identify different faults.
- **FR-022**: Where the fix is inaccessible, a complete engineering escalation MUST be produced: reproduction,
  evidence, candidate defects, the safe diagnostic to run, and expected behaviour.
- **FR-023**: The connector MUST NOT be deleted or disconnected, and no complete `Authorization` header may be
  logged, printed or requested, even for diagnosis.

**Measured in revision 3**: `LIST_ZONES` (name filter) → `6003`+`6111` at HTTP **400**;
`LIST_DNS_RECORDS(zone_id=0af2a3985db329cdb671829cb59a41f1)` → `9106 Authentication failed (status: 400)`.
A supplied zone ID does not bypass authentication, and the 400 status confirms structural invalidity rather
than an invalid credential.

## Assumptions

- Skills are an account-level library, and MCP connections are account-level, so the audit reads them
  through the agent's own tool surface. The Freebuff client's internal router and file layout are not
  inspectable from the workspace, and no claim is made about them.
- Read-only MCP verification is within the owner's request to "verify the MCPs are accessible"; the
  repository's approval rule for other MCPs is satisfied by that explicit instruction for reads only.
- Context7 is referenced by repository governance but is not a connected app here; that gap is reported,
  not worked around.

## Revision 4 — fresh re-test, credential-shape boundary and an implementable check (2026-11-04)

**Trigger**: a fresh work request asks for a new investigation and, where possible, an implemented fix.
Revision 3 attributed the failure to "the connector's header construction" and left the repair BLOCKED.
That attribution is re-tested from the provider side, and revision 2's withdrawal of the credential-shape
cause is itself refuted by measurement.

### Requirements

- **FR-024**: The failure MUST be reproduced on the live connection at least three times in separate calls
  before a conclusion is drawn, because the connector's own documentation claims a failing authentication
  can resolve on retry.
- **FR-025**: The probe MUST cover both endpoints the connector exposes, because they emit different codes
  for the same malformed header.
- **FR-026**: The probe MUST sweep the `Authorization` bearer value across lengths and character classes to
  locate the exact boundary between format rejection and identity rejection.
- **FR-027**: A conclusion contradicted by new measurement MUST be recorded as a withdrawal together with
  the measurement that refutes it, and it MUST NOT be silently overwritten.
- **FR-028**: The prescribed remedy MUST hold under every hypothesis the measurements still leave open.
- **FR-029**: A reproducible, secret-free verifier MAY be added so the owner can confirm the repair
  themselves; it MUST be read-only, MUST NOT print or store the credential, and MUST send it only to
  `api.cloudflare.com`.
- **FR-030**: No token, key, connection, repository secret, workflow, DNS record or account setting may be
  created, changed, deleted or revealed while performing this investigation.

### Measured result

- Live connection, four separate calls: `LIST_ZONES` ×3 → `6003` + chain `6111`; `LIST_DNS_RECORDS` ×1 →
  `9106 Authentication failed (status: 400)`. No retry succeeded, so the transient-failure hypothesis in
  the connector's documentation does not apply.
- `/zones` bearer sweep: 1–39 characters, or any character outside the token charset, → HTTP `400` +
  `6003`/`6111`; 40, 41 and 64 token-charset characters → HTTP `403` + `9109 Invalid access token`. The
  boundary is exactly 40 characters.
- `/zones/:id/dns_records` with the same 37-hex bearer value → HTTP `400` + `9106 Authentication failed`,
  three repeats; with 40 token-charset characters → HTTP `401` + `10000 Authentication error`.
- Therefore one 37-hex bearer value reproduces **both** errors the connector returns, and no 40-character
  value can produce either of them.

**Withdrawn in revision 4**: revision 2's withdrawal. It measured a Global-API-Key-shaped value only in
`X-Auth-Key` (`6103` with 40 characters, `9103` with 37), never in `Authorization`, and never noticed that
37 characters cannot satisfy Cloudflare's 40-character bearer format. A Global API Key sent as a bearer
token is therefore fully consistent with `6111`, and the revision 2 conclusion ("the connector must be
sending a placeholder, not the credential") is not established by its evidence.

**Still open**: the codes cannot separate "37-hex Global API Key" from "short placeholder"; both produce
identical codes on both endpoints. The remedy chosen in the report works for either, because a genuine
40-character API Token travels through the same header the connector already constructs.

**Corroboration outside the workspace**: GitHub Actions run `41822284071` ("Deploy OpenNext to
Cloudflare", `main` `86ace203`) completed `success` at 2026-11-04T11:39Z setting only
`secrets.CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`. Wrangler sends that variable as a bearer
token, so the repository already holds a format-valid, authorised 40-character API Token for this account.

### Acceptance scenarios (revision 4)

7. **Given** the live connection, **When** four read-only calls are made in separate requests, **Then**
   every call fails with the same code chain and no call returns provider data.
8. **Given** a 37-hex bearer value, **When** it is sent to both endpoints the connector uses, **Then** the
   responses match the connector's two errors exactly.
9. **Given** a 40-character token-charset value, **When** it is sent to the same endpoints, **Then** the
   response is an identity-level rejection, never a header-format rejection.
10. **Given** the committed verifier, **When** it runs without a credential, **Then** it reports the shape
    classes and performs no authenticated call.

## Revision 5 — the saved credential is not transmitted (2026-11-04)

**Trigger**: the owner has created a Cloudflare API token, saved it in the existing Freebuff connection, and
verified it independently (Agent Lee). The request therefore forbids replacing, regenerating or re-saving the
credential and asks for the connector's own credential retrieval and header construction to be investigated,
rather than more credential-shape probing.

### Requirements

- **FR-031**: The connection MUST be re-tested after the credential was saved and verified, because a
  save-then-retest is the only measurement that separates "the wrong value is stored" from "the stored value
  is not transmitted".
- **FR-032**: The pre-save and post-save signatures MUST be compared exactly — HTTP status, top-level code and
  the full `error_chain` — and not paraphrased.
- **FR-033**: The failure MUST be localised by a control call whose only defect is the resource identifier, so
  a zone id, account or permission defect cannot be mistaken for an authentication defect.
- **FR-034**: A conclusion whose prediction is contradicted by the post-save measurement MUST be withdrawn
  explicitly, with the measurement that refutes it.
- **FR-035**: Surviving hypotheses MUST be enumerated with the measurement that would separate them, and any
  that cannot be separated from the workspace MUST be labelled as such.
- **FR-036**: Where the defect lies in Freebuff's connector rather than the repository, the deliverable MUST be
  a defect report precise enough to implement: the observed value class, the expected value class, the
  discriminating control, and the redacted fingerprint the connector should log.
- **FR-037**: No credential, connection or token permission may be created, read, replaced, re-saved, rotated
  or printed, and no DNS record or account setting may be modified.

### Measured result

| Measurement | Result |
|---|---|
| `LIST_ZONES(name=luckypickcanada.ca, per_page=20)`, 12:29Z, **after** the save | `6003 Invalid request headers` + chain `6111 Invalid format for Authorization header` |
| `LIST_DNS_RECORDS(zone_id=0af2a3985db329cdb671829cb59a41f1, per_page=100)`, 12:29Z, after the save | `9106 Authentication failed (status: 400)` |
| `LIST_DNS_RECORDS(zone_id=00000000000000000000000000000000, per_page=5)` — **control** | **identical** `9106 Authentication failed (status: 400)` |
| Pre-save calls, 09:28Z–12:0xZ (four calls) | identical `6003` + `6111` and `9106` |
| `node scripts/cloudflare-auth-diagnose.mjs --probe`, 12:30Z | boundary unchanged: 9/31/37/39 characters and 40-with-`!` → `400` + `6003` + `6111`; 40/41 token-charset → `403` + `9109` |

Three facts follow directly from those rows:

1. **The error did not change when the credential changed.** A 40-character token-charset bearer never produces
   `6003`/`6111` on `/zones`, nor `9106` at HTTP 400 on the DNS endpoint; it produces provider data,
   `403`/`9109`, or `401`/`10000`. The post-save signature is therefore incompatible with the saved token
   being transmitted.
2. **The control isolates the layer.** An all-zero zone id returns the same `9106`, so the request is rejected
   before Cloudflare evaluates the zone, the account or any permission. The zone id and the `Zone:Read` /
   `DNS:Read` scope are not implicated.
3. **The invariant is the credential's class.** Every format-rejected value produces this signature and only
   format-rejected values do, so the transmitted value lies outside the 40-character token charset — absent,
   empty, truncated, quoted, re-encoded or stale.

**Withdrawn in revision 5**: revision 4's finding that the connection holds a 37-hex Global API Key and that
this is the cause. Revision 4 made a falsifiable prediction — replacing the stored value with a format-valid
token should move the signature to `403`/`9109` — and it did not move at all. The identity of the stored value
is therefore not the operative cause; **the connector does not transmit the credential that is saved in it.**
A 37-hex value bound at connection creation survives only as one candidate for the *stale* payload, not as the
conclusion.

**Still open — not separable from this workspace** (all three produce the identical signature):

- **H1 stale binding**: the connector resolved the secret when the connection was created and never re-reads
  it, so the original value is still sent.
- **H2 field mismatch**: the header is built from a different field than the one the save wrote — a
  `cloudflare_api_key` connection is the legacy key + email scheme, yet the transport is `Bearer`.
- **H3 mangling**: the value is transmitted but altered — quoted, truncated below 40 characters, or
  percent-encoded.

The separating measurement for H1 is a binding resolved at request time (or a connector log of a redacted
shape fingerprint); H2 needs the connection's field mapping; H3 needs the outgoing header's length and
character classes. None is reachable from the repository or through the five Cloudflare tools the connection
exposes, which include no connection-management or connection-status tool.

### Acceptance scenarios (revision 5)

11. **Given** a saved and independently verified token, **When** the connection is used, **Then** the signature
    MUST be compared with the pre-save signature and the difference, including its absence, recorded.
12. **Given** an all-zero zone id, **When** the DNS endpoint is called, **Then** an identical `9106` proves the
    rejection precedes resource and permission checks.
13. **Given** the invariance result, **When** the cause is reported, **Then** the stored-value hypothesis is
    withdrawn and the non-transmission of the saved credential is named as the cause.
14. **Given** the surviving hypotheses, **When** the report is written, **Then** each carries the measurement
    that would separate it and is marked unreachable from the workspace.
