# Feature Specification: Cloudflare Issue Remediation (GitHub #1814–#1829)

**Feature Branch**: `freebuff/a3ef72773064149acdf6c2ce`
**Created**: 2026-11-11
**Status**: Implemented; evidence recorded in `evidence.md`

**Input**: Investigate six open Cloudflare Workers Issues forwarded to GitHub
(#1814, #1821, #1825, #1826, #1827, #1829), determine whether each is a genuine
defect or external scan noise, fix genuine defects, verify the result, and
confirm the Crystal Ball daily fortune and follow-up still work as intended.

## Problem Statement

Six Cloudflare Workers Observability issues are open:

| GitHub | Cloudflare issue | Category |
| --- | --- | --- |
| #1814 | `a94d47c2…` | Potential vulnerability scan · wordpress |
| #1821 | `9d04f7f8…` | Oracle Error: Missing content in Groq API response |
| #1825 | `f8607191…` | Potential vulnerability scan · debug-endpoints |
| #1826 | `c17a7103…` | Potential vulnerability scan · source-control |
| #1827 | `7e965902…` | Potential vulnerability scan · known-scanner-path |
| #1829 | `555015df…` | Potential vulnerability scan · secret-files |

The five scan issues were previously triaged and resolved, then reopened as new
occurrences continued. The Oracle issue is a genuine production log error. The
owner requires a fresh, occurrence-level disposition for every issue rather than
another bare closure.

## Requirements

- **FR-001**: Each issue MUST be checked against its retained Cloudflare
  occurrences and live production behaviour.
- **FR-002**: The Oracle empty-content error MUST be fixed at its cause and MUST
  keep returning a usable reading when the provider fails.
- **FR-003**: The daily Crystal Ball fortune MUST continue to use the visitor's
  local date, local time, the four seasons, Canadian holidays and the
  established Canadian voice.
- **FR-004**: The follow-up question MUST continue to receive a specific,
  context-aware answer with the same calendar facts.
- **FR-005**: No security control, rate limit, validation, credential or
  deployment configuration may be weakened.
- **FR-006**: The production build MUST remain below 495 MiB.

## User Scenarios

### User Story 1 — Oracle readings survive reasoning models (P1)

A visitor opens `/crystal-ball`, requests the daily fortune, and always receives
a fortune instead of an empty provider response.

**Acceptance**: The Groq request uses `max_completion_tokens` with reasoning
headroom and low reasoning effort; blank or truncated provider content still
produces a usable fallback and a diagnostic log.

### User Story 2 — The daily fortune is locally correct (P1)

The fortune knows the visitor's local date, local time, season and nearby
Canadian holidays, and it stays funny and Canadian.

**Acceptance**: The route builds calendar facts from the validated local date,
adds the sanitized local time, recognises all four seasons, includes the
existing holiday set plus Labour Day and the National Day for Truth and
Reconciliation, and preserves the Canadian humour guidance.

### User Story 3 — Scan alerts are dispositioned with evidence (P1)

Each scan issue is confirmed as inbound scanner traffic or proven to be a real
defect.

**Acceptance**: Every retained occurrence shows the response Cloudflare saw;
live production probes and a repository asset scan confirm no secret, source or
debug surface is served.

## Edge Cases

- A visitor's clock or time zone is wrong: calendar facts still come from the
  validated local date; the time only affects atmosphere.
- Groq returns `finish_reason: "length"` with empty content: the fallback is
  returned and the reason is logged.
- Cloudflare retains only a bounded occurrence sample: live probes and the
  repository asset inventory supplement it.
- Scanner traffic continues after closure: the detection is expected for an
  internet-facing site; suppressing it requires a separately authorised edge
  rule.

## Success Criteria

- **SC-001**: The Oracle request uses `max_completion_tokens: 1024` and
  `reasoning_effort: "low"` and no longer sends `max_tokens: 250`.
- **SC-002**: Automated tests cover the reasoning-budget failure, local time and
  new holidays, and pass.
- **SC-003**: Live production returns 404 for every probed scanner path with the
  standard not-found body and no secret markers.
- **SC-004**: The production build stays below 495 MiB and verification passes.
