# Implementation Plan: Undici CVE-2026-109869 Remediation

**Branch**: `fix/security-undici-cve-2026-109869` | **Date**: 2026-10-24 | **Spec**: [spec.md](./spec.md)

## Summary

The current main branch overrides Undici with `>=7.29.1`, but the lockfile resolves the transitive package to `8.10.2`. The official advisory lists `8.12.2` as the patched 8.x release. Pin the pnpm override to exact version `8.12.2`, update only corresponding lockfile references and the package's verified integrity metadata, and add a focused regression test.

## Technical Context

- **Language/Version**: Node.js 22.x; pnpm 10.30.3.
- **Dependency paths**: lockfile currently references Undici in transitive tooling dependencies, including the reported OpenNext/Cloudflare, jsdom, Vitest and Wrangler paths.
- **Testing**: Vitest, `./jules-verify.sh`, existing test suite and Cloudflare/OpenNext-compatible build checks.
- **Constraints**: No application source or behavior changes; 495 MiB build-output maximum.

## Implementation Steps

1. Pin `pnpm.overrides.undici` to `8.12.2`.
2. Update the lockfile package entry, integrity hash, snapshot, and every dependency reference previously pointing to `undici@8.10.2`.
3. Add a regression test that asserts the exact override and absence of the vulnerable lockfile resolution.
4. Validate with the repository's pinned pnpm installation and required CI checks.

## Verification Caution

This editing environment does not provide a working repository shell/pnpm execution. The lockfile delta is based on the exact dependency references present in main and the verified npm integrity value for Undici 8.12.2. A frozen install and all required CI checks are mandatory before declaring this patch verified; no local test or build pass is claimed.

## Protected Behavior

No runtime application files, API contracts, visual assets, wording, audio, animations, deployment configuration, or Cloudflare settings are changed.
