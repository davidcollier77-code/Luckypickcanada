# Implementation Plan: Cloudflare Toolchain Re-Audit and OpenNext Patch

**Branch**: `freebuff/b7618803c1c98fa008653cb9` | **Date**: 2026-11-26 | **Spec**: [spec.md](./spec.md)

## Summary

A fresh audit of the current stable Cloudflare toolchain selected **one** dependency change: upgrade `@opennextjs/cloudflare` from 1.20.18 to **1.20.19**, which replaces the advisory-affected `glob 13 → minimatch 10` path with `glob 14 → minimatch 11` and leaves behind a cookie/middleware 500 regression introduced in 1.20.18. **Wrangler 4.166.0 is retained** because neither 4.167.0 nor 4.168.0 contains an applicable security or compatibility fix for this deployment, while both adopt a newer Miniflare beta/workerd pair and new deploy-time behaviour. Existing overrides, including the undici security override, are unchanged. The lockfile is regenerated with Node.js 26.x and pnpm 10.30.3, a dependency-policy regression test guards the new graph, and the existing build, Worker and release safeguards are preserved.

## Technical Context

**Language/Version**: Node.js 26.x (observed 26.13.0); pnpm 10.30.3; TypeScript / JavaScript.

**Primary Dependencies**: Next.js 16.4.6; React 19.3.1; `@opennextjs/cloudflare` 1.20.19 (from 1.20.18); `@opennextjs/aws` 4.2.1 (transitive, from 4.2.0); Wrangler 4.166.0 (retained); `workerd` 1.20261119.1 and Miniflare 5.20261119.0-beta (unchanged with retained Wrangler).

**Storage**: No schema or production-data change. Existing R2 incremental cache, D1 tag cache, KV namespace and Durable Object queue remain unchanged.

**Testing**: Focused dependency tests; full Vitest suite; TypeScript check; Next.js production build with the 495 MiB gate; OpenNext Cloudflare build and artifact checks; `wrangler build`; updater-scheduler Wrangler dry-run. Playwright, DevSkim and deployment remain CI responsibilities.

**Target Platform**: Existing Cloudflare Worker built through OpenNext, plus the separate `workers/updater-scheduler` Worker.

**Project Type**: Next.js App Router web application with a separate Cloudflare updater-scheduler Worker.

**Performance Goals**: No runtime, rendering, cache-policy or UI change. Combined `.next` + `public` output remains strictly below 495 MiB.

**Constraints**: Use only Node.js 26.x and pnpm 10.30.3 for installation and lockfile generation; do not hand-edit the lockfile; do not change application source, `open-next.config.ts`, `wrangler.jsonc`, compatibility date/flags, bindings, routes, migrations, secrets, environment configuration, deployment workflows or the Dependabot schedule; do not deploy or merge.

**Scale/Scope**: `package.json`, `pnpm-lock.yaml`, `__tests__/dependency-management.test.js`, the Spec 220 artifacts, `.specify/feature.json` and the Memory Bank. No new package, script, service, configuration layer or runtime module.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Assessment | Result |
| --- | --- | --- |
| I. Single Source of Truth | `AGENTS.md` remains authoritative; these artifacts define only this task and link to the live configuration instead of duplicating it. | PASS |
| II. Verify Before Acting | Live manifest, lockfile, registry manifests, release notes, advisories, Worker configuration, workflows and dependency tests were inspected before planning; all conclusions are re-derived, not inherited. | PASS |
| III. Implementation Sequence | Specify → Plan → Tasks → Implement followed in order. The owner explicitly authorized autonomous implementation and the pull request. | PASS |
| IV. Protect Core Systems | No payment, authentication, database, secret, Cloudflare setting, binding, compatibility date or deployment-workflow change. The protected files (`package.json`, `pnpm-lock.yaml`) carry the required declaration and environment authorization gate. | PASS |
| V. Resource Conservation | No new service, dependency or paid usage; `.docs/` read-only; build remains below the 495 MiB cap. | PASS |

**Post-design re-check**: PASS. The design changes one existing dependency pin and its lockfile resolution, adds one regression test, and updates task artifacts only.

## Project Structure

### Documentation (this feature)

- `specs/220-cloudflare-toolchain-maintenance/spec.md`
- `specs/220-cloudflare-toolchain-maintenance/research.md`
- `specs/220-cloudflare-toolchain-maintenance/plan.md`
- `specs/220-cloudflare-toolchain-maintenance/tasks.md`

### Source code and configuration

- `package.json` — `@opennextjs/cloudflare` exact pin 1.20.19; Wrangler 4.166.0 and every other pin unchanged.
- `pnpm-lock.yaml` — pnpm 10.30.3-generated graph.
- `__tests__/dependency-management.test.js` — exact-pin/lockfile-consistency and glob 13/minimatch 10 regression guard.
- `.specify/feature.json` — points at this feature.
- `memory-bank/activeContext.md`, `memory-bank/techContext.md`, `memory-bank/progress.md` — verified state and milestone.

**Preserved unchanged**: `open-next.config.ts`, `wrangler.jsonc`, all application source, `workers/updater-scheduler/**`, every `.github/workflows/**` file, `.github/dependabot.yml`, `.docs/**` and all Cloudflare resources.

**Structure Decision**: Keep the change in the existing root manifest and single pnpm lockfile. No new package, script, configuration or runtime module is introduced; the only source edit is an existing dependency-policy test.

## Phase 0 — Research

Recorded in [research.md](./research.md). Key decisions:

1. Adapter 1.20.19 is the newest stable release and the only change with a demonstrated security/compatibility benefit: its `glob ^14.0.6` removes the `minimatch@10` advisory path and its `@opennextjs/aws 4.2.1` fixes several runtime edge cases and the 1.20.18 cookie/middleware regression. Its Next peer (`>=15.5.29 <16 || >=16.4.5`) accepts 16.4.6 and its Wrangler peer (`^4.148.0`) accepts the retained 4.166.0.
2. Wrangler 4.167.0 and 4.168.0 were evaluated and rejected for this task: no advisory fix, no compatibility requirement, and the applicable-looking changes concern first deploys, unused commands, unconfigured Images settings and interactive OAuth.
3. The undici override is unchanged. The graph resolves only patched `undici@8.12.2`; altering which major each consumer receives is a separate security-resolution decision with no observed defect.
4. Inert `minimatch@10` overrides are retained rather than removed, avoiding unrequested policy cleanup and keeping a floor if the path ever returns.

## Phase 1 — Design

### 1. Dependency pin

- `package.json`: only `"@opennextjs/cloudflare": "1.20.19"` changes.
- `wrangler` stays `"4.166.0"`; all other dependencies, devDependencies and `pnpm.overrides` stay byte-identical.

### 2. Lockfile

- Regenerate with the repository's pinned pnpm 10.30.3 under Node 26.x (`pnpm install --lockfile-only`), then prove it with `pnpm install --frozen-lockfile`.
- Expected and observed changes: adapter and `@opennextjs/aws` snapshots, `glob 13.0.7` and `path-scurry 2.0.2` removed, adapter `glob` edge moved to 14.0.6. No other package version changes.

### 3. Regression coverage

- Extend `__tests__/dependency-management.test.js` to require exact semver pins for both Cloudflare build tools, require their lockfile importer version to match the manifest, and fail if a `glob@13.x` or `minimatch@10.x` package snapshot returns.

### 4. Preserved configuration

No change to `open-next.config.ts` (R2 incremental cache, `queueCache(doQueue, { regionalCacheTtlSec: 5, waitForQueueAck: true })`, D1 tag cache), `wrangler.jsonc` (name, routes, bindings, migrations, compatibility date 2026-08-04, `nodejs_compat`, observability) or the deployment workflows.

## Phase 2 — Implementation Sequence

1. Recheck npm dist-tags and release metadata immediately before editing.
2. Update the single adapter pin in `package.json`.
3. Regenerate `pnpm-lock.yaml` with pnpm 10.30.3 under Node 26.x; never hand-edit it.
4. Inspect `pnpm why` for the adapter, glob, minimatch and undici; reconcile every edge and integrity record.
5. Add the dependency-policy regression test.
6. Review the complete diff for unrelated churn, stale references or configuration edits.

## Phase 3 — Verification Plan

Executed locally on Node 26.13.0 with pnpm 10.30.3; results are recorded in `tasks.md` and the PR.

1. `pnpm install --frozen-lockfile`.
2. `pnpm why` inspection for the adapter, glob, minimatch and undici; every undici entry checked against its advisory floor.
3. Focused dependency tests (`dependency-management`, `undici-security-override`).
4. `./freebuff-verify.sh` — Spec Kit gate, all Python checker suites, TypeScript, full Vitest, Next.js build, 495 MiB measurement and refresh-docs tests.
5. `pnpm exec opennextjs-cloudflare build`; verify `.open-next/worker.js`, `.open-next/assets`, compiled Tailwind CSS and the Lucky Meter vessel/dock rules.
6. `pnpm exec wrangler build --config ./wrangler.jsonc`.
7. `pnpm exec wrangler deploy --dry-run --config workers/updater-scheduler/wrangler.toml` (no credentials, no deployment).
8. CI-only and explicitly not claimed locally: the two Playwright shards, DevSkim, the OpenNext CI job, the seven-category report and deployment.

No production deployment is part of this sequence.

## CI and Release Safeguards

- Keep the `cloudflare-deploy` concurrency group, `cancel-in-progress: false`, bounded rate-limit retry and post-deploy CSS verification.
- Keep the updater-scheduler dry-run and main-only deployment.
- Keep the protected-file human authorization environment for `package.json` and `pnpm-lock.yaml`.
- Keep Dependency Health & Vulnerability Review and DevSkim reporting enabled.
- Do not edit classifiers, workflow conditions, branch protection, secrets or Dependabot schedules.

## Complexity Tracking

No constitution violations. The task changes one existing exact pin and its lockfile resolution; it introduces no package, service, build tool, runtime path or hosting configuration.

## Known Risks and Mitigations

| Risk | Mitigation |
| --- | --- |
| Adapter 1.20.19 is recently published and moves `glob` to a new major. | `glob 14.0.6` is already installed in this repository through the root devDependency; peers are unchanged; the Next.js and OpenNext builds plus compiled-CSS/Worker checks validate the result. |
| Lockfile regeneration churns unrelated packages. | Inspect the full lockfile diff; the expected changes are limited to the adapter, `@opennextjs/aws`, the removed glob 13 line and its `path-scurry`. |
| Inert `minimatch@10` overrides confuse future readers. | Documented in `research.md`; removal is deferred as out-of-scope policy cleanup. |
| The global undici override crosses consumer major ranges (Wrangler/Miniflare/workers-utils declare 7.30.2; jsdom declares ^8.12.3). | Pre-existing and unchanged; the graph resolves only patched 8.12.2. Recorded as residual risk and proposed as a separate task. |
| Protected-file gate blocks merge. | The PR carries the exact authorization declaration and is left for the owner's environment approval. |
| A newer release appears during review. | The pin is exact; any bump requires a new audit and is not applied silently. |
| CI checks are skipped or stale. | The PR reports them as PENDING and the owner reviews the current-head seven-category report. |
