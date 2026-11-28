# Implementation Plan: Cloudflare Production Dependency Modernization

**Branch**: `freebuff/94bbe053cb1ed6af61ade216` | **Date**: 2026-11-27 | **Spec**: `specs/226-cloudflare-dependency-modernization/spec.md`

## Summary

Keep `@opennextjs/cloudflare` 1.20.19 (the latest release), move `wrangler` to 4.168.0 (latest stable inside the adapter's `^4.148.0` peer range), and reduce `pnpm.overrides` from eighteen entries to the three Undici major security floors. Remove the `glob`/`minimatch`/`brace-expansion` workarounds by fixing their only upstream consumer (`@typescript-eslint` 8.74.0 declares minimatch 11) and by relying on patched normal resolution. No application code, Cloudflare configuration or workflow changes.

## Technical Context

**Language/Version**: Node.js 26.13.0; TypeScript 5.9.3; pnpm 10.30.3.

**Primary Dependencies**: Next.js 16.4.6, React 19.3.1, `@opennextjs/cloudflare` 1.20.19, Wrangler 4.168.0 (`workerd` 1.20261123.1, Miniflare 5.20261123.1-beta, `@cloudflare/workers-utils` 0.57.0), jsdom 31.0.1, Vitest 5.1.1.

**Storage**: no change (R2 incremental cache, D1 tag cache, Durable Object queue and KV bindings untouched).

**Testing**: `__tests__/dependency-management.test.js` and `__tests__/undici-security-override.test.js` guards, the full Vitest suite, `./freebuff-verify.sh`, the OpenNext build, `wrangler build`, and the updater-scheduler `deploy --dry-run`.

**Target Platform**: Cloudflare Workers via OpenNext; Node.js 26.x build.

**Project Type**: dependency and toolchain maintenance for a production web application.

**Constraints**:
- Use only pnpm 10.30.3 and the committed lockfile.
- Do not force a package outside a consumer's declared major.
- Do not change application source, `open-next.config.ts`, `wrangler.jsonc`, compatibility date/flags, bindings, workflows, secrets or deployment settings.
- Do not merge the PR or deploy.
- Production build strictly below 495 MiB.

**Scale/Scope**: 11 exact paths — manifest, lockfile, one guard, four Spec 226 artifacts, the feature pointer and three Memory Bank files.

## Constitution Check

| Principle | Assessment | Result |
| --- | --- | --- |
| Single Source of Truth | `AGENTS.md` stays authoritative; the artifacts describe only the authorized dependency work. | PASS |
| Verify Before Acting | Registry metadata, advisories, the adapter's peer ranges, every override's resolved graph and the affected guards were inspected before editing. | PASS |
| Implementation Sequence | Specify → research → plan → tasks → implement → verify is recorded in order. | PASS |
| Protect Core Systems | No payment, auth, database, deployment or secret change. `package.json` and `pnpm-lock.yaml` are protected files the user explicitly authorized. | PASS |
| Resource Conservation | No new dependency, service or paid resource; three lint-only packages move to an already-supported release and eight overrides are deleted. | PASS |
| Evidence Integrity | Claims rest on `pnpm audit`, `pnpm why`, the lockfile and executed builds/tests; unrun browser checks are reported as not run. | PASS |

**Post-design re-check**: no data model, contract or deployment change; the same gates hold.

## Phase 0 — Research

`research.md` records the registry evidence, the per-override audit and the rejected alternatives. No further research is required.

## Phase 1 — Design

No `data-model.md`, `contracts/` or `quickstart.md`: the change is manifest policy plus a lockfile and a guard. The design is:

- `pnpm.overrides` = `{ "undici@6": "6.29.1", "undici@7": "7.30.2", "undici@8": "8.13.1" }`.
- `wrangler` = `4.168.0`.
- `@typescript-eslint/{typescript-estree,utils,scope-manager}` = 8.74.0 (transitive), so minimatch 11 resolves upstream.
- Guard asserts the three-override policy, absence of glob 10/13 and minimatch 10 snapshots, the minimatch advisory floor and the brace-expansion floors.

### Implementation Sequence

1. **Manifest**: set `wrangler` to 4.168.0; reduce `pnpm.overrides` to the three Undici floors.
2. **Lockfile**: `pnpm install --lockfile-only`, then update `@typescript-eslint` so minimatch 10 disappears; `pnpm install --frozen-lockfile`.
3. **Guard**: rewrite the override expectations in `__tests__/dependency-management.test.js`; add the patched-floor resolution checks.
4. **Verification**: focused guards, `pnpm audit`, full `./freebuff-verify.sh`, OpenNext build, Wrangler build, updater dry-run, size measurement.
5. **Records**: Spec 226 artifacts, `.specify/feature.json`, Memory Bank.
6. **Delivery**: commit, push, open one regular non-draft PR against `main`.

### Test Design

The dependency guard verifies exactly the three overrides exist, that no `glob@10`/`glob@13`/`minimatch@10` snapshot remains, that every minimatch release ≥7 is at or above 11.0.1, that brace-expansion releases meet their major's advisory floor, and that `@vitest/mocker` is not pinned below Vitest. The Undici guard is unchanged and still enforces the per-major floors.

### Verification Matrix

| Check | Command | What it proves |
| --- | --- | --- |
| Focused guards | `pnpm exec vitest run __tests__/dependency-management.test.js __tests__/undici-security-override.test.js` | Manifest/lockfile policy and floors. |
| Security | `pnpm audit` | No known advisories in the resolved graph. |
| Graph | `pnpm why glob minimatch …` | Resolved versions and consumers. |
| Repository gate | `SPEC_KIT_BASE_REF=<base> ./freebuff-verify.sh` | Frozen install, Spec Kit, Python checkers, TypeScript, full Vitest, docs tests, build and size cap. |
| OpenNext artifact | `pnpm exec opennextjs-cloudflare build` | Production Worker/asset build on the new pair. |
| Wrangler | `pnpm exec wrangler build --config ./wrangler.jsonc` | Bindings and configuration parse on 4.168.0. |
| Updater dry-run | `pnpm exec wrangler deploy --dry-run --config ./workers/updater-scheduler/wrangler.toml` | The scheduled Worker still validates, with no deploy. |

### Risks and Mitigations

- **Wrangler regression**: the version is three days old. Mitigation: full OpenNext build, `wrangler build` and a dry-run against the real `wrangler.jsonc` before push; CI re-runs the same protected workflow.
- **Removed override resurfaces a vulnerability**: mitigated by regenerating the lockfile, `pnpm audit` and a unit guard encoding the advisory floors.
- **Upstream consumer drift**: `@typescript-eslint` 8.74.0 is the latest 8.x; if a later version returns to minimatch 10 the guard's floor assertion fails instead of silently accepting it.
- **Duplicate postcss copy**: normal resolution keeps Next's own postcss line; audit-clean and upstream-declared. Accepting it is cheaper than a permanent override.

## Verification Results

- `pnpm audit`: 0 advisories across 999 dependencies.
- Focused guards: 2 files / 15 tests passed.
- `SPEC_KIT_BASE_REF=2fe486e6cf2deb4a0f2ff3310ec6cf1242bcbc1c ./freebuff-verify.sh`: exit 0 — frozen install, Spec Kit gate, 520 Python tests, TypeScript, 113 Vitest files / 1,272 tests, Next.js build, docs tests and the size cap.
- Production build measured at 440,279,040 bytes (419.88 MiB), strictly below 495 MiB.
- OpenNext build passed on `@opennextjs/cloudflare` 1.20.19 with Wrangler 4.168.0 and wrote `.open-next/worker.js`; `BUILD_ID` matched the injected SHA.
- `wrangler build` on 4.168.0 read 317 assets and produced an 8,893.61 KiB upload with the Durable Object, KV, D1, R2, service, assets and environment-variable bindings intact.
- Updater-scheduler `deploy --dry-run` passed (7.87 KiB, no deploy); its Node tests passed 17/17.
- Playwright/Visual QA was not run locally for this dependency-only change; PR-triggered checks remain pending.

## Project Structure

```text
.specify/feature.json
__tests__/dependency-management.test.js
memory-bank/activeContext.md
memory-bank/progress.md
memory-bank/techContext.md
package.json
pnpm-lock.yaml
specs/226-cloudflare-dependency-modernization/plan.md
specs/226-cloudflare-dependency-modernization/research.md
specs/226-cloudflare-dependency-modernization/spec.md
specs/226-cloudflare-dependency-modernization/tasks.md
```

## Delivery Boundary

- Protected-file authorization for `package.json` and `pnpm-lock.yaml` is explicitly granted by the user; the PR carries the exact human-authorization declaration.
- The PR is regular, non-draft, targets `main`, and stays open and unmerged.
- No deployment, secret change, Cloudflare setting change or production resource change.
