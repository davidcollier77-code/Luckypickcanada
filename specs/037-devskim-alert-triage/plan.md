# Implementation Plan: DevSkim Alert Triage and Minimal Remediation

**Branch**: `security/devskim-alert-remediation-037` | **Date**: 2026-10-20 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/037-devskim-alert-triage/spec.md`

## Summary

Use the recording and source inspection to distinguish real code weaknesses from heuristic matches. The confirmed source defect is the new-window gift-email link in `app/api/send-gift/route.ts` lacking opener protection. Add `rel="noopener noreferrer"` without changing its URL, text, email content, styling, or other behavior. Leave lockfile integrity data, read-only `.docs/`, manifests holding public checksums, and callback-based timers untouched. Record the alert-access limitation honestly: the connected GitHub interface rejects the Code Scanning alerts endpoint and does not expose a dismissal operation, so remaining false positives cannot be closed through the available interface.

## Technical Context

**Language/Version**: JavaScript and TypeScript; repository target Node.js 22.x.

**Primary Dependencies**: Existing Next.js 16.3.8 and Vitest; no added dependencies.

**Storage**: N/A.

**Testing**: A targeted regression check where feasible, then `pnpm exec vitest run __tests__/security-payment.test.js`, full repository tests, `./jules-verify.sh`, DevSkim rescan, and the existing build/Cloudflare CI checks when the PR runs. Do not claim any command passed unless actual output is available.

**Target Platform**: GitHub Actions and the Next.js/Cloudflare application.

**Project Type**: Existing web application with code-scanning workflow.

**Performance Goals**: No measurable runtime/performance change expected.

**Constraints**: Preserve all secret-store entries and credentials; do not print secret values; do not edit `.docs/`; do not weaken scanners or add suppressions; keep the diff narrowly security-related; any build must remain below the repository's 495 MiB hard limit. The video showed 113 open and 27 closed alerts, but that is a historical count, not a live query.

**Scale/Scope**: One confirmed code correction plus evidence-based classification of the displayed rule groups. A complete current individual-alert inventory and alert-level dismissal are blocked by the unavailable Code Scanning alert endpoint/action.

## Constitution Check

- **Single source of truth**: PASS — use current `AGENTS.md` and routed security guidance; task artifacts supplement them only.
- **Verify before acting**: PASS — source lines were inspected. The missing `rel` attribute is directly confirmed.
- **Minimal scope**: PASS — one HTML attribute and directly related regression evidence; no design, wording, API behavior, dependency, or deployment changes.
- **Secret preservation**: PASS — no external secret store or credential is modified, and no value is written to this task.
- **Security findings integrity**: PASS — no broad suppressions or unsubstantiated dismissals. False positives that require alert UI actions remain explicitly pending.
- **Required verification**: PENDING — the connected session cannot run the repository shell; PR CI must provide current-head test/governance/build evidence. The live alert status must be checked through an authorized Code Scanning interface.

## Research

No additional library research is required for the standard `rel="noopener noreferrer"` HTML link protection. Source inspection confirms the timer alerts use callback functions and fixed/dynamic numeric delays rather than user data passed as a code string. The lockfile entries flagged as weak hashes use SHA-512 integrity values; package names such as `sha1-browser` and `md5-js` are not evidence of weak integrity configuration. Manifest values inspected are commit/file-checksum metadata, not credentials. These classifications do not authorize bulk-dismissal; each visible alert still needs an individual valid disposition.

## Project Structure

### Documentation (this feature)

```text
specs/037-devskim-alert-triage/
├── spec.md
├── plan.md
├── tasks.md
├── triage.md
├── pr_summary.md
└── checklists/requirements.md
```

### Source Code

```text
app/api/send-gift/route.ts          # opener protection on the generated gift-email link
__tests__/security-payment.test.js  # existing endpoint security tests; use/update if feasible
```

**Structure Decision**: Keep the fix in the existing email-template source and place evidence in this task's `specs/037-devskim-alert-triage/` directory. Do not modify `.docs/`, manifests, lockfile hashes, or unrelated API routes.

## Phase 1 Design

- No data model or external contract changes.
- No new dependencies or configuration changes.
- A task-specific triage ledger will separate verified source observations from alerts that cannot be individually retrieved through the connected interface.
- The final PR summary will distinguish code corrections, false-positive evidence, alert-level actions not available through the connector, and all unrun/pending verification.

## Constitution Check — Post-Design

PASS — design preserves credentials, leaves scanners unchanged, avoids changes whose only purpose is to make findings disappear, and leaves every unsupported alert disposition unresolved rather than claiming success.