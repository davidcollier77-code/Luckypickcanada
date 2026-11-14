# Implementation Plan: HSTS Policy Reconciliation

**Branch**: `freebuff/c941bc03442fc8f36d8df66f` | **Date**: 2026-11-13 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/156-hsts-policy-reconciliation/spec.md`

## Summary

Cloudflare currently overwrites the origin HSTS header with a 180-day policy that omits
`includeSubDomains`, while `next.config.mjs` declares a two-year policy with `includeSubDomains`
and `preload` that no browser can ever receive. The approved fix is a one-year policy with
`includeSubDomains` and no `preload`, applied at the edge and mirrored exactly in the repository.

The repository half is a one-line configuration change plus a regression test that pins the value,
proves there is exactly one HSTS definition, and forbids `preload`. The Cloudflare half must be
applied through the zone settings API or dashboard; the credential available in this environment
can read the zone object but is unauthorized for zone settings, so that half is reported as
blocked with the exact error and remediation.

## Technical Context

**Language/Version**: Node.js 26.x, Next.js 16.4.3, React 19.3.1

**Primary Dependencies**: None added. Uses the existing `next.config.mjs` `headers()` block.

**Storage**: N/A

**Testing**: Vitest (unit/regression), `./freebuff-verify.sh`, production `next build`, live `curl`
header probes, Cloudflare zone settings API for the edge check.

**Target Platform**: Cloudflare Workers via OpenNext (`wrangler.jsonc`), custom domain
`luckypickcanada.ca` with `www`.

**Project Type**: Web application (Next.js App Router)

**Performance Goals**: No change; the header value is the only difference.

**Constraints**: Strictly HSTS only. No CSP, other header, DNS, email-authentication or unrelated
Cloudflare setting may change. Production build must remain below 495 MiB.

**Scale/Scope**: One configuration value, one regression test, one feature directory.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Single Source of Truth** — PASS. `AGENTS.md` remains authoritative; this plan and its
  artifacts are task-scoped and do not restate governance.
- **II. Verify Before Acting** — PASS. The current edge value, its Cloudflare origin, the zone
  setting permission failure, the DNS surface and the preload status were all inspected rather
  than assumed (`research.md`).
- **III. Implementation Sequence** — PASS. INSPECT → IDENTIFY → UNDERSTAND → PLAN → IMPLEMENT →
  TEST → DOUBLE-CHECK → REPORT → CREATE PR.
- **IV. Protect Core Systems** — PASS with explicit owner authorization. Cloudflare deployment
  settings are protected by default; the owner explicitly authorized this single HSTS change and
  prohibited every other Cloudflare change. Where the credential cannot perform it, the change is
  reported blocked, not worked around.
- **V. Resource Conservation** — PASS. `.docs/` is not modified.

## Project Structure

### Documentation (this feature)

```text
specs/156-hsts-policy-reconciliation/
├── spec.md
├── plan.md
├── tasks.md
├── research.md
└── evidence.md
```

### Source Code (repository root)

```text
next.config.mjs                                  # HSTS value (single change)
__tests__/hsts-policy.test.js                    # regression guard for the value and uniqueness
memory-bank/activeContext.md                      # current-task record, including the blocker
.specify/feature.json                             # pointer to this feature directory
```

**Structure Decision**: Single Next.js project at the repository root; the change touches the
existing Next.js header configuration only. No new routes, components or dependencies.

## Implementation Approach

1. Replace the single `Strict-Transport-Security` value in `next.config.mjs` with
   `max-age=31536000; includeSubDomains`.
2. Add `__tests__/hsts-policy.test.js` asserting one HSTS entry, the exact target value, and the
   absence of `preload`/`63072000` anywhere in the header configuration.
3. Apply the Cloudflare zone setting (max-age 31536000, `include_subdomains` true,
   `preload` false, `nosniff` true, `enabled` true) through the API, then re-read it and probe live
   responses on apex, `www`, an API route and a static asset. If the credential is refused, record
   the error and mark this step BLOCKED.
4. Run the focused test, `./freebuff-verify.sh`, and measure the production build.

## Risks and Rollback

- **Risk**: a browser holding the old 180-day policy cannot be shortened immediately. **Impact**:
  none; `max-age` is advisory and always moves forward on the next HTTPS response.
- **Risk**: `includeSubDomains` extends the policy to future subdomains. **Impact**: low; no
  wildcard DNS exists, `www` already redirects over HTTPS and `send` is mail-only. Rollback is a
  Cloudflare setting change plus waiting for `max-age` to expire; it is not instantaneous.
- **Risk**: the repository value becomes the served value if Cloudflare HSTS is disabled.
  **Impact**: acceptable; the approved target is safe to serve directly.
- **Rollback**: revert the one-line configuration change; the header returns to the previous
  repository value. No deployment is triggered by this PR.
