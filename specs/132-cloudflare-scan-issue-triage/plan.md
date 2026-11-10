# Implementation Plan: Triage and Resolve Cloudflare Vulnerability-Scan Issues

**Branch**: `freebuff/68fa75a8cf62b1b555921275` | **Date**: 2026-11-10 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/132-cloudflare-scan-issue-triage/spec.md`

## Summary

Investigate the five open Cloudflare-created GitHub issues (#1789–#1793) using their retained Cloudflare occurrences, the repository route/asset inventory and live production responses. If the alerts are inbound scanning against paths the application does not serve, make no product change; record the per-issue evidence and resolve each issue with a comment that cites it. Only a genuine exposure would justify an application fix.

**Outcome**: All five alerts are Cloudflare "Potential vulnerability scan" detections (wordpress, secret-files, source-control, debug-endpoints, known-scanner-path). Every retained occurrence is a 404 to a non-existent path with no outbound fetch, and the live site returns its normal 404 page for the same paths. No application code change is warranted.

## Technical Context

**Language/Version**: Next.js 16.4.3 App Router on React 19.3.1, TypeScript; Cloudflare Workers via OpenNext.

**Primary Dependencies**: No dependency changes. Investigation uses the existing Cloudflare API token already present in the environment, `curl`, `jq` and `git`.

**Storage**: N/A — nothing is persisted by the application change set.

**Testing**: Cloudflare Observability issues/occurrences API, live HTTPS requests against `https://luckypickcanada.ca`, repository route/asset inspection, `./freebuff-verify.sh`, and the production build-size measurement.

**Target Platform**: Cloudflare Workers production deployment (`luckypickcanada-app`).

**Project Type**: Web application plus GitHub/Cloudflare automation.

**Performance Goals**: N/A — no runtime change.

**Constraints**: 495 MiB production build cap; no secret values in files, logs or reports; no Cloudflare deployment/configuration change; no application code change for false positives.

**Scale/Scope**: Five issues, 28 retained occurrence records, one evidence artifact, Spec Kit and Memory Bank records.

## Constitution Check

| Principle | Assessment |
|---|---|
| I. Single source of truth | PASS — `AGENTS.md` and the task request govern; no competing workflow is introduced. |
| II. Verify before acting | PASS — Cloudflare occurrences, production responses and repository routes are inspected before any resolution. |
| III. Implementation sequence | PASS — Specify → Plan → Tasks → Implement with artifacts under one feature directory. |
| IV. Protect core systems | PASS — no application, hosting, credential, dependency or security-control change. |
| V. Resource conservation | PASS — no `.docs/` modification, no new dependency, no unnecessary artifact. |

Post-design re-check: PASS.

## Research

No additional research artifact was needed. The task is evidence collection against an existing integration and an unchanged application. The Cloudflare API contract used is the one already documented and implemented by `specs/127-cloudflare-issue-auto-resolution` (`GET .../workers/observability/issues/{id}/occurrences`), and the repository already contains the protected resolution route and post-deploy job.

## Project Structure

### Documentation (this feature)

```text
specs/132-cloudflare-scan-issue-triage/
├── spec.md
├── plan.md
├── tasks.md
├── evidence.md
└── checklists/requirements.md
```

### Source Code

```text
(no application source changes)
```

**Structure Decision**: The deliverable is the triage record plus issue resolutions. No application file is edited because the evidence shows no application defect.

## Phase 0: Evidence Decisions

1. **Authoritative alert data** — the Cloudflare Observability issues and occurrences endpoints, not the truncated GitHub issue summary.
2. **Exposure test** — a path is only a genuine secret/source exposure if it returns a successful response or protected content. A 404 from the Next.js not-found handler is not exposure.
3. **Outbound-fetch test** — every occurrence message states "No matching outbound fetch was observed", ruling out the scanner request being used for SSRF.
4. **Resolution test** — each GitHub issue is closed only after its own evidence is recorded and posted; the matching Cloudflare observability issue is marked resolved so the dashboard reflects the same conclusion.

## Phase 1: Design

### Review flow

1. List open GitHub issues and isolate the five labelled `cloudflare-workers-issue` items.
2. For each, read the Cloudflare issue ID from the notification payload and fetch its retained occurrences.
3. Record path, method, response status, user agent, source country and outbound-fetch result.
4. Compare the paths with the repository route tree (`app/`), `public/` assets and tracked files.
5. Request representative paths from production and confirm status/content.
6. Conclude: genuine defect → scoped fix; otherwise → evidence comment and resolution.
7. Record the outcome in `evidence.md` and update Memory Bank context.
8. Run repository verification and measure the production build.

### Failure and safety decisions

- No application code, configuration, dependency or credential is changed for false positives.
- No Cloudflare deployment, Wrangler configuration, WAF rule, authentication or rate-limit change is made.
- Cloudflare credentials are never printed, committed or included in the evidence; only presence is used.
- A single unexpected 2xx response, secret body or outbound fetch would stop the false-positive conclusion for that issue.

### Preserved behaviour

Every application route, public asset, security header, Turnstile check, rate limit, validation rule, payment/email integration and deployment workflow remains untouched.
