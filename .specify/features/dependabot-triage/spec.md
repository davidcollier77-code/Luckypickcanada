# Dependabot Alert Triage Spec

## Objective
Remediate open Dependabot vulnerabilities mapped to the local `pnpm audit` inventory and justify any true/false positive classifications.

## Context
The full GitHub UI/API for Code/Secret Scanning is currently unavailable in this execution environment. However, since Dependabot relies directly on standard package manager advisory databases, the local `pnpm audit` serves as an accurate, actionable inventory of the vulnerable packages.

## Requirements
- Use `pnpm audit` to capture the current state of dependency vulnerabilities.
- For valid findings, implement the smallest effective fix using `pnpm.overrides` as established in `.jules/sentinel.md` (to safely resolve transitive issues without forcing major upgrades of primary libraries).
- Verify fixes by running `pnpm install` and re-running `pnpm audit`.
