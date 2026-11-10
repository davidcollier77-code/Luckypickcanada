# Implementation Plan: Security Alert Ledger Remediation

**Branch**: `freebuff/6b10109631c978f16411d5d3` | **Date**: 2026-11-10 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/133-security-alert-remediation/spec.md`

## Summary

Audit all 29 `devskim-alerts.md` entries and every open code-scanning and Dependabot alert. The 23 open DevSkim alerts are reviewed false positives from five heuristics: Playwright `test.setTimeout` configuration, a callable zero-delay timer in a test-only mock transport, a test assertion containing a placeholder word, public identifiers (Cloudflare account ID and a pinned upstream commit), and loopback text inside committed probe-report JSON strings. Extend the repository's existing fail-closed SARIF filter for exactly those reviewed paths, lines and tokens, add positive/negative regression tests and real-SARIF replay coverage, empty the ledger, and fix the one genuine CodeQL finding by declaring workflow token permissions. Attempt the single Dependabot alert with a verified transitive override.

## Technical Context

**Language/Version**: Python 3 for the DevSkim filter/tests/replay; TypeScript and shell for the reviewed source; YAML for GitHub Actions.

**Primary Dependencies**: No new direct dependency. One existing pnpm override pins `minimatch@10` to the patched `11.0.1` (dual CJS/ESM, Node 18/20/22+).

**Storage**: Repository source, transient SARIF, the append-only alert ledger; nothing persisted at runtime.

**Testing**: `python3 -m unittest discover -s .github/scripts -p 'test_suppress_devskim_false_positives.py'`, a local filter replay over SARIF assembled from the stored alert coordinates, `pnpm exec tsc --noEmit`, `pnpm run build`, `pnpm test`, `./freebuff-verify.sh`.

**Target Platform**: GitHub Actions on Ubuntu; Cloudflare Pages/Workers production deployment unchanged.

**Project Type**: Next.js application plus Python-based scan/report tooling.

**Constraints**: 495 MiB production build cap; no scanner rule, workflow trigger, secret, deployment or application behaviour change; `.docs/` read-only.

**Scale/Scope**: 29 ledger entries, 23 open DevSkim alerts, 1 CodeQL alert, 1 Dependabot alert; 2 filter/replay scripts plus tests, 1 workflow, 1 manifest.

## Constitution Check

| Principle | Assessment |
|---|---|
| I. Single source of truth | PASS — `AGENTS.md` and the task request govern. |
| II. Verify before acting | PASS — every recorded location and every open alert was checked against current source before editing. |
| III. Implementation sequence | PASS — Specify → Plan → Tasks → Implement with one feature directory. |
| IV. Protect core systems | PASS — no route, visual, payment, email, storage or security-control change. |
| V. Resource conservation | PASS — narrow filter additions, no unnecessary artifact, no `.docs/` change. |

Post-design re-check: PASS.

## Research

No separate research artifact was needed. The filter's existing contracts (path allowlist, validated source span, justification removal, replay gate) were read in full and reused. Prior DevSkim triage specs (`037`, `042`, `045`, `066`, `082`, `095`) establish the same pattern for reviewed false positives.

## Project Structure

- `.github/scripts/suppress_devskim_false_positives.py` — reviewed path/line/token families and the fail-closed checks.
- `.github/scripts/verify_devskim_sarif_replay.py` — audited families the real-SARIF replay must remove.
- `.github/scripts/test_suppress_devskim_false_positives.py` — positive and negative regression coverage.
- `.github/workflows/deploy-open-next.yml` — least-privilege `permissions` block.
- `package.json` / `pnpm-lock.yaml` — patched transitive `minimatch`.
- `devskim-alerts.md` — corrected ledger.
- `specs/133-security-alert-remediation/` and `memory-bank/` — task records.

## Verification Plan

1. Compile the filter, replay and tests; run the DevSkim suppression unittest suite.
2. Build SARIF from the stored alert coordinates and confirm the filter removes exactly those results.
3. Run the type check, build, unit tests and `./freebuff-verify.sh`; measure build size.
4. Inspect the complete final diff and confirm no unreviewed path changed.
