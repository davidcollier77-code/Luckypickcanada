# Implementation Plan: Cloudflare Toolchain Patch Maintenance

**Branch**: chore/220-cloudflare-toolchain-maintenance | **Date**: 2026-11-26 | **Spec**: spec.md

## Summary

Update the root-pinned OpenNext Cloudflare adapter from 1.20.18 to the investigated stable 1.20.19 release and Wrangler from 4.166.0 to 4.168.0, subject to a fresh npm/peer/changelog check immediately before implementation. Regenerate the pnpm lockfile with Node 26.x and pnpm 10.30.3. Correct the global Undici override so it no longer forces Wrangler's declared patched v7 dependency into v8, and remove minimatch 10 overrides only when the final graph proves they are obsolete. Preserve all existing Cloudflare configuration and release safeguards.

The owner explicitly authorized the dependency implementation on 2026-11-26. The Spec 220 implementation has not started: the ChatGPT startup preflight reports Node.js 22.16.0 and no pnpm executable, so the required Node.js 26.x / pnpm 10.30.3 toolchain is unavailable in this session. Under the current `AGENTS.md` ChatGPT-only §6, only project operations requiring Node.js 26.x are blocked; other compatible repository and Freebuff QA/PR-support scripts remain permitted after their prerequisites, runtime, permissions and side effects are checked. The repository Playwright CLI/setup is unavailable to ChatGPT. Do not treat the planned dependency changes or Node-26-dependent verification as completed; perform them in a compliant Node.js 26.x / pnpm 10.30.3 environment.

## Technical Context

**Language/Version**: Node.js 26.x; pnpm 10.30.3; TypeScript / JavaScript.

**Primary Dependencies**: Next.js 16.4.6; React 19.3.1; current @opennextjs/cloudflare 1.20.18; current Wrangler 4.166.0; candidate OpenNext 1.20.19 and Wrangler 4.168.0; @opennextjs/aws is transitive and expected to move from 4.2.0 to 4.2.1. Undici and glob/minimatch are the transitive compatibility/security focus.

**Storage**: No storage schema or production data change. Existing R2, D1, KV and Durable Object resources remain unchanged.

**Testing**: pnpm frozen install; targeted dependency-management and Undici lockfile tests; full Vitest suite; TypeScript check; Next.js build and size gate; OpenNext Cloudflare build/artifact checks; Wrangler build validation for wrangler.jsonc; updater-scheduler Wrangler dry-run; both Visual QA shards; consolidated PR verification.

**Target Platform**: Existing Cloudflare Workers/OpenNext application and updater-scheduler Worker.

**Project Type**: Next.js App Router web application with a separate Cloudflare updater-scheduler Worker.

**Performance Goals**: No runtime behavior, cache policy, UI, or render-path change. Combined .next and public production build output remains strictly below 495 MiB.

**Constraints**: Use only Node.js 26.x and pnpm 10.30.3 for package installation, lockfile generation and verification. Do not hand-edit the lockfile. Do not change application source, open-next.config.ts, wrangler.jsonc, compatibility date/flags, bindings, routes, migrations, secrets, environment settings, Cloudflare dashboard settings, deployment workflows or Dependabot schedule. No production deployment or merge.

**Scale/Scope**: Root package.json, pnpm-lock.yaml, directly relevant dependency-policy tests, Spec 220 artifacts and minimal Memory Bank corrections. The implementation change must include the protected-file authorization declaration and pass the existing authorization environment before merge.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Assessment | Result |
| --- | --- | --- |
| I. Single Source of Truth | AGENTS.md remains authoritative; the feature artifacts define only this task's behavior and verification. | PASS |
| II. Verify Before Acting | Current root manifest/lockfile, adapter and Wrangler metadata, OpenNext config, Worker config, QA workflows and related tests were inspected before preparing this plan. | PASS |
| III. Implementation Sequence | Specify → Plan → Tasks are complete. The owner has authorized Implement. Dependency installation, lockfile generation and project verification requiring the repository runtime remain blocked until Node.js 26.x / pnpm 10.30.3 are available; compatible independent QA and PR-support scripts remain permitted under `AGENTS.md` §6 when their prerequisites and safety conditions are met. | BLOCKED |
| IV. Protect Core Systems | No payment, authentication, database, secret, Cloudflare setting, binding or deployment workflow change is included. The implementation PR will only alter the authorized dependency manifest/lockfile and relevant tests. | PASS |
| V. Resource Conservation | No new service or dependency is proposed; .docs remains read-only; build output remains below the 495 MiB hard cap. | PASS |

**Post-design re-check**: PASS. The plan does not change the Worker runtime compatibility date or configuration. Package-level security work stays within dependency resolution and its tests. The later implementation PR must pass protected-file authorization for package.json and pnpm-lock.yaml.

## Project Structure

### Documentation (this feature)

- specs/220-cloudflare-toolchain-maintenance/spec.md
- specs/220-cloudflare-toolchain-maintenance/research.md
- specs/220-cloudflare-toolchain-maintenance/plan.md
- specs/220-cloudflare-toolchain-maintenance/tasks.md

### Source Code and configuration (future implementation only)

- package.json — exact OpenNext/Wrangler pins and narrowly scoped overrides.
- pnpm-lock.yaml — pnpm 10.30.3-generated dependency graph.
- __tests__/dependency-management.test.js — preserve override/package-manager policies.
- __tests__/undici-security-override.test.js — assert patched Undici versions per major.

**Preserved files**: open-next.config.ts, wrangler.jsonc, .github/workflows/deploy-open-next.yml, .github/workflows/validate-open-next-repair.yml, .github/workflows/deploy-updater-scheduler.yml, .github/workflows/visual-qa.yml and .github/workflows/protected-files.yml remain unchanged.

**Structure Decision**: Keep the implementation in the existing root package manifest and single pnpm lockfile. Add no package, new script, config layer, service or runtime module. The only source/test files planned are the existing dependency-policy tests.

## Phase 0 — Research

Research findings and source links are recorded in research.md:

1. OpenNext 1.20.19 is the investigated current stable adapter and accepts the repository's Next.js 16.4.6 plus Wrangler 4.168.0 peer versions. It moves the adapter's glob requirement to v14 and OpenNext AWS to 4.2.1.
2. Wrangler 4.168.0 is the investigated current stable CLI; its Node engine supports the repository's Node 26.x runtime. Its Miniflare prerelease dependency and the separate updater-scheduler usage require CI validation.
3. The current global Undici 8.12.2 override crosses Wrangler's declared Undici 7.30.2 major boundary. The advisory's fixed releases are major-specific. Use pnpm 10.30.3-supported version-aware resolution so each consumer stays on a compatible patched major. A convergence override is preferred only if frozen resolution proves that every affected declared range admits the fixed target; otherwise use an explicit version-scoped override.
4. Remove minimatch 10-specific overrides only after proving that no package in the new dependency graph requires them. Retain glob@10 -> 14.0.4 and unrelated security overrides unless independently disproven.
5. The app uses queueCache with a five-second queue-cache TTL, R2 incremental cache and D1 tag cache. It does not configure withRegionalCache and its story submission uses revalidatePath, not revalidateTag. The release notes' regional-cache fix is not a confirmed correction for this app.
6. The app has no root proxy.ts or middleware.ts. The OpenNext cookie-middleware fix is a regression-test consideration, not a claim about an existing site defect.
7. Wrangler's explicit compatibility_date and nodejs_compat remain unchanged. The 4.168.0 images.url_transformations feature is not configured.

## Phase 1 — Design

### 1. Dependency pins

- Recheck npm latest stable tags, release notes, peer dependencies and engine metadata at implementation time.
- If still current and compatible, pin @opennextjs/cloudflare to 1.20.19 and wrangler to 4.168.0.
- Confirm the adapter resolves @opennextjs/aws 4.2.1 and the matching glob 14 package.
- Do not change Next.js, React, Node, pnpm, Playwright, Miniflare, Workerd, application dependencies or unrelated tool pins.

### 2. Undici compatibility/security policy

- Inspect consumers and requested ranges in the actual dependency graph, not only the current lockfile (the existing global override has already rewritten original requests).
- Replace the unqualified global Undici 8.12.2 override with pnpm 10.30.3-supported selectors. The documented v10 key forms are a package-version selector such as `"undici@^7.0.0": "7.30.2"` and a parent-specific selector such as `"wrangler@4.168.0>undici": "7.30.2"`. The former selects Undici package versions in the stated semver range; it does not prove that 7.30.2 satisfies every consumer's declared request. The latter targets only the named parent's edge. These are syntax examples, not pre-approved overrides: choose the actual selector only after examining every original consumer range and proving the replacement fits that edge.
- Do not use the empty-range convergence selector (`undici@`): pnpm added that syntax in v11.13.0, while this repository is pinned to v10.30.3. Do not upgrade pnpm as part of this task.
- First inspect the original Undici dependency requests after removing the global override. Use explicit package-version selectors only for vulnerable resolved lines where the fixed target is compatible with every affected consumer's declared range. Use a parent-specific selector where one consumer needs a distinct compatible target. Wrangler 4.168.0's published manifest requests Undici exactly `7.30.2`; its lockfile edge must resolve to exactly `7.30.2`. Prefer no Wrangler-specific override if removing the global override naturally restores that exact request.
- Inspect every exact Undici version resolved in the regenerated lockfile, not only the major line: no v6 below 6.29.1, v7 below 7.30.1, or v8 below 8.12.2. Confirm separately that the Wrangler 4.168.0 edge resolves exactly to 7.30.2. If any consumer cannot accept its major's patched release, stop and resolve the parent dependency instead of forcing a breaking version.
- If another major line or an incompatible consumer appears, stop and resolve it before merging; do not globally force a different major.

### 3. Glob/minimatch policy

- Regenerate the lockfile after the OpenNext adapter bump.
- Run pnpm why for glob and minimatch; inspect all remaining consumers.
- Remove minimatch@10 and minimatch@10.2.6>brace-expansion only if no package graph path requires those selectors.
- Retain glob@10 -> 14.0.4 because the existing dependency-management regression documents a compatibility issue when minimatch 11 is forced under glob 10. Preserve unrelated security overrides.

### 4. Dependency regression coverage

- Update __tests__/undici-security-override.test.js so it verifies the version-aware override policy, every resolved lockfile version against the per-major fixed floor, and the exact Wrangler 4.168.0 -> Undici 7.30.2 edge. It must fail if a vulnerable version returns, Wrangler is forced onto another major, or its exact declared request changes.
- Update __tests__/dependency-management.test.js only where current exact override assertions need to represent the approved new rule. Keep unrelated override checks.
- Keep assertions semantic and path-aware; do not weaken existing lockfile or package-manager protections.

### 5. Preserved deployment configuration

No changes to open-next.config.ts, wrangler.jsonc, workflows, bindings, cache strategy or compatibility date. Wrangler validation and the updater-scheduler dry-run use existing configurations. Production deployment continues only through the unchanged main-branch workflow.

## Phase 2 — Implementation Sequence

1. Owner authorization to begin dependency implementation was received on 2026-11-26. No further approval is required for the dependency scope defined here.
2. In a compliant Node.js 26.x / pnpm 10.30.3 environment, update only the approved package pins and pnpm override policy.
3. Regenerate pnpm-lock.yaml with pnpm 10.30.3. Do not hand-write or manually patch package snapshots, integrity values or references.
4. Inspect pnpm why output and lockfile snapshots for OpenNext, OpenNext AWS, Wrangler, Workerd, Miniflare, glob, minimatch and Undici. Reconcile every edge and integrity record.
5. Update the targeted dependency-policy regression tests.
6. Review the complete diff for unrequested transitive or configuration changes before submitting the implementation PR.

## Phase 3 — Verification Plan

All Node-26-dependent commands in this phase must run only in the compliant CI environment or another approved environment with Node.js 26.x and pnpm 10.30.3. The ChatGPT startup preflight for this session reports Node.js 22.16.0 and no pnpm executable; therefore dependency installation, lockfile generation, Node-26-dependent builds and tests are blocked here. Current `AGENTS.md` ChatGPT-only §6 does not impose a blanket repository-script prohibition: compatible scripts may be run after their prerequisites, runtime, permissions and side effects are checked. The repository Playwright CLI/setup remains unavailable to ChatGPT. No repository checkout is available in this session.

1. Frozen package installation with pnpm install --frozen-lockfile.
2. Dependency graph inspection using `pnpm why undici`, `pnpm why glob` and `pnpm why minimatch`; inspect every Undici lockfile version and consumer edge, enforce the fixed floors per major, and verify Wrangler 4.168.0 resolves exactly to Undici 7.30.2. Validate every chosen override selector with the pinned pnpm 10.30.3 binary and the regenerated lockfile.
3. Focused dependency-management and Undici regression tests.
4. Full Vitest suite and pnpm exec tsc --noEmit.
5. Next.js production build and combined .next + public size check, strictly below 495 MiB.
6. OpenNext Cloudflare build; verify .open-next/worker.js, assets, compiled CSS and existing Lucky Meter stylesheet contracts.
7. Wrangler build validation against ./wrangler.jsonc.
8. Wrangler dry-run against workers/updater-scheduler/wrangler.toml.
9. Both Visual QA Playwright shards. A package.json dependency change is not classifiable as scripts-only and must not bypass visual QA.
10. Review current-head PR Verification Report across all seven categories; confirm protected-file authorization and dependency-health results. Do not treat stale, missing, skipped or pending checks as passed.

No production deployment is part of this sequence.

## CI and Release Safeguards

- Keep the cloudflare-deploy concurrency group and cancel-in-progress: false.
- Keep the existing bounded Cloudflare API rate-limit retry conditions and post-deploy CSS verification.
- Keep the updater-scheduler's separate dry-run and main-only deploy.
- Keep the protected-file human authorization environment for package.json and pnpm-lock.yaml.
- Keep Dependency Health & Vulnerability Review and DevSkim reporting enabled.
- Do not edit QA classifiers, workflow conditions, branch protection, secrets or Dependabot schedules to reduce required checks.

## Complexity Tracking

No constitution violations. The task updates existing exact dependency pins and override rules; it introduces no new package, service, build tool, runtime path or hosting configuration.

## Known Risks and Mitigations

| Risk | Mitigation |
| --- | --- |
| OpenNext and Wrangler lock snapshots retain stale references after direct pins change. | Regenerate with pinned pnpm, run frozen install, inspect every package snapshot and consumer edge. |
| npm package integrity is inconsistent with the committed lockfile. | Let pnpm generate lock metadata and require frozen-install and CI verification. |
| Global Undici override forces a consumer onto another major. | Use pnpm 10.30.3-compatible version-aware override resolution and test Wrangler's v7 path. |
| Minimatch 10 override is removed while another consumer still needs it. | Inspect pnpm why and the full post-update graph; remove only when unused. |
| Wrangler's new Miniflare/Workerd dependency pair exposes runtime or build incompatibility. | Run main-app Wrangler validation and updater-scheduler dry-run in CI. |
| Updated toolchain changes Worker output or bundle size. | Verify Worker/assets/CSS and measure the 495 MiB gate. |
| PR workflows are skipped or stale. | Require both Visual QA shards, protected-file authorization and the seven-category current-head report. |
| Production is deployed unintentionally. | PR changes do not deploy; deployment workflow remains main-only and unchanged. |
