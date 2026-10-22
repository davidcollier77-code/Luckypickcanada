# Tasks: glob CVE-2025-64756 Remediation

- [X] T001 [US1] Apply `glob@10` override in `package.json`.
- [X] T002 [US1] Run `pnpm install --no-frozen-lockfile` to regenerate lockfile.
- [ ] T003 [US1] Run `./jules-verify.sh` to validate Spec Kit governance.
- [ ] T004 [US1] Run `pnpm test` to ensure existing tests pass.
- [ ] T005 [US1] Run `pnpm run build` to verify the build process.
- [ ] T006 [US1] Run `pnpm audit --audit-level=high` to confirm vulnerability resolution.
