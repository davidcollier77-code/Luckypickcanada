# Vitest Mocker Security Remediation Spec

## Objective
Resolve the two open Moderate Dependabot alerts for `@vitest/mocker` in `pnpm-lock.yaml` without changing application features or the live deployment directly.

## Verified Baseline
- The lockfile resolved `vitest@5.0.0`, `@vitest/mocker@5.0.0`, and `@vitest/spy@5.0.0`.
- The alerts describe Windows backslash traversal through the mock redirect allowlist and code injection through unauthenticated manual mock registration.
- Both upstream fixes are available in `@vitest/mocker` 5.0.3 or later; this task targets 5.0.5.

## Scope
- Add a narrow pnpm override for the transitive `@vitest/mocker` package at 5.0.5.
- Reconcile `pnpm-lock.yaml` with the override, patched `@vitest/spy` dependency, and `magic-string` dependency required by the patched mocker release.
- Add this task's Spec Kit artifacts and the canonical PR summary.

## Out of Scope
- No changes to application source, visual design, wording, navigation, animations, audio, database, payments, API routes, authentication, Cloudflare, Vercel, secrets, environment settings, or deployment configuration.
- Do not merge the PR or deploy production from this task.

## Acceptance Criteria
1. The manifest and lockfile both record the `@vitest/mocker@5.0.5` override.
2. The lockfile has no remaining resolution/snapshot references to `@vitest/mocker@5.0.0` or `@vitest/spy@5.0.0`.
3. Frozen pnpm install, unit tests, dependency audit, `./jules-verify.sh`, production build, and the repository's 495 MiB build-size gate pass in CI before the fix is declared verified.
4. The PR diff is limited to the dependency patch, Spec Kit artifacts/pointer, and PR summary.
5. No merge or production deployment is performed by this task.
