# Feature Specification: HSTS Policy Reconciliation

**Feature Branch**: `freebuff/c941bc03442fc8f36d8df66f`

**Created**: 2026-11-13

**Status**: Draft

**Input**: User description: "Implement the approved P1 HSTS fix so Lucky Pick Canada's live Cloudflare security header and repository configuration use the same settings: Cloudflare HSTS max-age 12 months, includeSubDomains on, preload off, nosniff on; repository Strict-Transport-Security max-age=31536000; includeSubDomains."

## Context

The 2026-11-13 header audit found a genuine split-brain policy. Production is served by
Cloudflare with `strict-transport-security: max-age=15552000` (180 days, no `includeSubDomains`,
no `preload`), because Cloudflare's zone-level HSTS setting overwrites the origin header. The
repository still declares `max-age=63072000; includeSubDomains; preload`, which no browser ever
receives and which exceeds Cloudflare's 12-month maximum. The repository value must stop
declaring a policy that cannot be served and must match the approved edge policy.

## User Scenarios & Testing

### User Story 1 - The edge and the repository declare the same HSTS policy (Priority: P1)

A visitor over HTTPS receives a one-year HSTS policy that also covers subdomains, with preload
disabled, and the repository states exactly the same policy so the two can never silently diverge
again.

**Why this priority**: This is the whole defect. HSTS only protects users while browsers hold the
policy, and a repository that documents a different, unservable policy misleads every future
change and review.

**Independent Test**: Read the live `Strict-Transport-Security` header from production and compare
it with the `Strict-Transport-Security` entry in `next.config.mjs`; both must express
`max-age=31536000; includeSubDomains` with no `preload`.

**Acceptance Scenarios**:

1. **Given** Cloudflare HSTS is enabled, **When** any HTTPS page is requested, **Then** the
   response carries `max-age=31536000; includeSubDomains` and no `preload` directive.
2. **Given** the repository configuration, **When** the security header block is inspected,
   **Then** it declares exactly one HSTS entry whose value is
   `max-age=31536000; includeSubDomains`.
3. **Given** the previous two-year value, **When** the change is applied, **Then** no
   `63072000` and no `preload` remains anywhere in the header configuration.

### User Story 2 - Every required response path is verified (Priority: P2)

The policy is confirmed on the apex domain, on `www`, on an API route and on a static asset, so
the verification covers the paths that come from different layers (Next.js page headers,
Cloudflare edge headers, redirects and asset responses).

**Why this priority**: The original audit found the mismatch only because asset and API paths
behave differently from page paths. A page-only check would not prove surface coverage.

**Independent Test**: Request a page, `www`, an API route and a `/_next/static` asset and read the
HSTS header from each.

**Acceptance Scenarios**:

1. **Given** the deployed change, **When** `https://luckypickcanada.ca/` is requested, **Then**
   the response carries the target policy.
2. **Given** the deployed change, **When** `https://www.luckypickcanada.ca/` is requested,
   **Then** the redirect response carries the target policy.
3. **Given** the deployed change, **When** an `/api/*` route and a `/_next/static/*` asset are
   requested, **Then** both carry the same target policy.

### Edge Cases

- The Cloudflare API credential available to the task cannot read or write zone settings, so the
  edge half cannot be applied or verified; it must be reported as blocked rather than assumed.
- A browser already holding the 180-day policy keeps it until it expires and then adopts the new
  value on its next HTTPS visit; no action is required and no user is locked out.
- `preload` must remain absent even though one year plus `includeSubDomains` would satisfy the
  preload minimum, because preload is deliberately out of scope and close to irreversible.
- `send.luckypickcanada.ca` is mail-only (MX, no A/AAAA) and `www` already redirects to the apex
  over HTTPS, so `includeSubDomains` breaks no reachable host.
- If Cloudflare HSTS were ever disabled, the origin value would become the served policy, so the
  repository value must be safe to serve on its own.

## Requirements

### Functional Requirements

- **FR-001**: The repository MUST declare `Strict-Transport-Security: max-age=31536000; includeSubDomains`.
- **FR-002**: The repository MUST NOT declare a two-year max-age and MUST NOT declare `preload`.
- **FR-003**: The header configuration MUST contain exactly one HSTS definition, with no duplicate
  or conflicting entries in any route block.
- **FR-004**: The Cloudflare zone HSTS setting MUST be max-age 12 months, `includeSubDomains` on,
  `preload` off, `nosniff` on.
- **FR-005**: Preload MUST NOT be enabled at Cloudflare and MUST NOT be added to the preload list.
- **FR-006**: No CSP, other security header, DNS record, email-authentication record or unrelated
  Cloudflare setting may change.
- **FR-007**: The change MUST NOT alter application behaviour, appearance, routes, payments,
  database access or integrations.
- **FR-008**: The task MUST report the Cloudflare production change separately from the repository
  change, including any blocker that prevents it.

### Key Entities

- **Edge HSTS policy**: the Cloudflare zone setting that produces the served header.
- **Repository HSTS declaration**: the `Strict-Transport-Security` entry in the Next.js header
  configuration, which is authoritative only when Cloudflare is not overriding it.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Exactly one HSTS entry exists in the repository header configuration and its value is
  `max-age=31536000; includeSubDomains`.
- **SC-002**: The strings `63072000` and `preload` do not appear in any HSTS value in the repository.
- **SC-003**: A regression test fails if the HSTS value, duplication count or absence of `preload`
  changes.
- **SC-004**: Apex, `www`, API and static-asset responses all report the same HSTS policy once the
  Cloudflare change is applied.
- **SC-005**: `./freebuff-verify.sh` exits 0 and the production build stays below the 495 MiB cap.

## Assumptions

- The approved target is one year with `includeSubDomains` and no preload, as stated by the owner.
- The Cloudflare zone is `luckypickcanada.ca` (`0af2a3985db329cdb671829cb59a41f1`), plan Free.
- Applying the Cloudflare change needs a credential with Zone Settings edit permission or dashboard
  access; the credential available to this task has zone read only.
- One year is Cloudflare's maximum selectable HSTS max-age, so the repository cannot declare a
  longer value and stay honest.
