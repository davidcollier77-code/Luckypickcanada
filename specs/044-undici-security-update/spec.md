# Feature Specification: Undici CVE-2026-109869 Remediation

**Feature Branch**: `fix/security-undici-cve-2026-109869`
**Created**: 2026-10-24
**Status**: Implementation proposed; CI verification pending

## User Scenario (Priority: P1)

As the repository maintainer, I need the transitive Undici package used by the development/build toolchain to resolve to a patched version so the known high-severity process-crash vulnerability is not present in the dependency lockfile.

**Why this priority**: Dependabot identifies a remotely triggerable denial-of-service issue in the resolved `undici@8.10.2` package.

**Independent Test**: Inspect `package.json` and `pnpm-lock.yaml`, then run a frozen pnpm install and the focused regression test to establish that all dependency paths resolve to the patched `undici@8.12.2`.

## Requirements

- **FR-001**: The pnpm override MUST pin Undici to the fixed version `8.12.2`, rather than allowing an older version such as `8.10.2`.
- **FR-002**: The lockfile MUST declare `undici@8.12.2` with verified npm registry integrity metadata and MUST NOT retain any `undici@8.10.2` package or snapshot references.
- **FR-003**: All dependency paths previously referring to `undici@8.10.2` MUST reference `8.12.2`.
- **FR-004**: A regression test MUST check the override and lockfile state so a later change cannot silently restore the known vulnerable resolution.
- **FR-005**: Verification MUST include the focused test, repository governance gate, existing relevant tests, production build, and applicable OpenNext/Cloudflare build validation. Build output MUST remain below 495 MiB.

## Scope and exclusions

In scope: `package.json`, `pnpm-lock.yaml`, a focused lockfile regression test, and these task artifacts.

Out of scope: application logic, UI, wording, artwork, animations, audio, unrelated dependency upgrades, deployment changes, and merging or deploying the PR.

## Risks

- A manually assembled lockfile delta must be validated by the pinned pnpm version with a frozen install in CI before it can be treated as complete.
- The patch only remediates the stated Undici advisory; it does not claim to resolve unrelated Node.js advisories.
