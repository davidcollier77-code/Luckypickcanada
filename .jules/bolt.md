## 2026-09-05 - Fix Github Actions validation workflow
**Learning:** For Github actions where `pnpm install` fails due to lockfile versioning and frozen-lockfile flag matching, use `pnpm/action-setup@v4` in the github workflow with the correct `version` explicitly to install the correct `pnpm` runtime before running `pnpm install`.
**Action:** Replaced `npm ci` with `pnpm install --frozen-lockfile` and added `pnpm/action-setup@v4` with version 9. Regenerated `pnpm-lock.yaml` correctly using `pnpm install` with ignore scripts config set to true.
