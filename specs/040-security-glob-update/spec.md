# Security Remediation: glob CVE-2025-64756

## User Stories

1. As the project maintainer, I want the project's dependency tree to be free of the high-severity `glob` vulnerability (CVE-2025-64756) to ensure build/development environment security.

## Requirements

1. Update the vulnerable `glob` resolution (specifically `glob@10.3.3`) to a patched version (`10.5.0` or later within the 10.x line).
2. The remediation must target the transitive dependency path through `@opennextjs/cloudflare`.
3. Use a scoped `pnpm.overrides` configuration in `package.json` to force the patched version.
4. Regenerate `pnpm-lock.yaml` using the project's pinned package manager version.
5. Do not apply unrelated dependency upgrades.

## Success Criteria

1. `pnpm audit --audit-level=high` no longer reports the `glob` vulnerability for CVE-2025-64756.
2. The project builds successfully (`pnpm run build`) and passes all existing tests.
3. The build output size remains below the 495 MB maximum.
