# Vitest Mocker Security Remediation Plan

## Selected Task Group
Security — this task directly remediates two Moderate dependency security alerts.

## Implementation
1. Keep the direct `vitest` dependency at its existing `^5.0.0` range to avoid an unnecessary test-runner upgrade.
2. Add `pnpm.overrides["@vitest/mocker"] = "5.0.5"` to `package.json`.
3. Update the lockfile package metadata and snapshots so the transitive mocker resolves to 5.0.5 and its `@vitest/spy` / `magic-string` dependencies match the published patched package.
4. Inspect the complete final diff for unintended changes. Preserve the site's application code and production configuration.

## Verification Plan
Run in the PR's CI environment:
- `pnpm install --frozen-lockfile`
- `pnpm test`
- `pnpm audit` and confirm the two named findings no longer apply
- `./jules-verify.sh`
- `pnpm run build` and measure `.next + public`; it must remain below 495 MiB

## Execution Environment Limitation
The connected local shell could not resolve `github.com`, so package installation, tests, audit, build, and the governance script were not run locally. These results must be taken from the PR's actual CI checks; none may be reported as passed without evidence.
