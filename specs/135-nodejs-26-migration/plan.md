# Implementation Plan: Node.js 26 Migration

**Branch**: `freebuff/261525f05a3f083e00c056f2` | **Date**: 2026-11-11 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/135-nodejs-26-migration/spec.md`

## Summary

Move the repository's build/test runtime declaration from Node.js 22 to Node.js 26: update the root engine and `.nvmrc`, the six GitHub Actions workflows that configure Node.js, the Playwright agent setup guard, and the standalone updater-scheduler package documentation. Update the workflow assertion test to the new step name, record the runtime in the Memory Bank, and verify type checking, unit tests, repository verification, the production build, and the Cloudflare/OpenNext build. No application, dependency, hosting, secret, or integration configuration changes.

## Technical Context

**Language/Version**: JavaScript/TypeScript; Node.js 26.x (previously 22.x); Next.js 16.4.3 App Router; React 19.3.1.

**Primary Dependencies**: Unchanged. Installed compatibility confirmed: Next.js 16.4.3 (`node >=20.9.0`), `@opennextjs/cloudflare` 1.20.15, Wrangler 4.148.0 (`node >=22.0.0`), Playwright 1.64.1 (`node >=20`), Vitest 5.0.0 (`^22.12.0 || ^24.0.0 || >=26.0.0`), Sharp 0.35.5 (`node >=20.9.0`).

**Storage**: Unchanged. Neon PostgreSQL and existing Cloudflare bindings (R2, D1, KV, Durable Objects) are untouched.

**Testing**: Existing Vitest suite, `pnpm exec tsc --noEmit`, `./freebuff-verify.sh`, the updater-scheduler `node --test`, the production `pnpm run build`, and `pnpm exec opennextjs-cloudflare build`.

**Target Platform**: Cloudflare Workers through OpenNext for Cloudflare; the Node.js version is a build/test runtime, not the Worker runtime.

**Project Type**: Next.js App Router web application with a standalone updater-scheduler Worker.

**Constraints**: No dependency or lockfile changes; no application, UI, animation, integration, binding, environment-variable, or deployment-trigger changes; preserve historical Spec Kit and artifact records; builds must stay strictly below 495 MiB.

**Scale/Scope**: Root `package.json`, `.nvmrc`, six GitHub Actions workflows, one local setup script, the updater-scheduler engine/documentation, one test expectation, the Memory Bank, and task artifacts.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Single source of truth**: `AGENTS.md` remains authoritative; these artifacts record only this task.
- **Verify before acting**: All Node.js references, installed dependency engine ranges, build configuration, and deployment workflows were inspected before editing.
- **Sequence**: Specify → Plan → Tasks → Implement recorded in this directory.
- **Protect core systems**: No payment, database, authentication, secret, binding, hosting trigger, application code, or visual change. Only version declarations and directly related assertions/documentation change.
- **Resource conservation**: `.docs/` stays read-only; no new dependency or service.

**Result**: PASS. No unjustified violation.

## Project Structure

### Documentation (this feature)

```text
specs/135-nodejs-26-migration/
├── spec.md
├── plan.md
└── tasks.md
```

### Source Code and configuration (repository root)

```text
package.json                                   # engines.node 26.x
.nvmrc                                         # 26
.github/workflows/deploy-open-next.yml         # setup-node 26
.github/workflows/validate-open-next-repair.yml
.github/workflows/visual-qa.yml
.github/workflows/deploy-updater-scheduler.yml
.github/workflows/update-spec-kit.yml
.github/workflows/refresh-docs.yml
scripts/setup-playwright-agent.sh              # accepts Node 26
workers/updater-scheduler/package.json         # engines.node >=26
workers/updater-scheduler/README.md            # Node 26 requirement
__tests__/visual-qa-chromium-cache.test.js     # workflow step-name assertion
memory-bank/techContext.md                     # runtime fact
memory-bank/activeContext.md                   # current task
```

**Structure Decision**: Update the existing declarations in place. No new runtime configuration file is introduced because the repository already declares its Node version through `package.json` and `.nvmrc`, and deployment runs on GitHub Actions rather than a Cloudflare Pages build image.

## Phase 0: Research

- **GitHub Actions**: Node.js 26 is requested through the existing pinned `actions/setup-node` step by changing only `node-version`; no action upgrade is needed.
- **Next.js**: 16.4.3 declares `node >=20.9.0`, so Node 26 is supported without a framework upgrade.
- **Cloudflare/OpenNext**: Wrangler 4.148.0 requires `node >=22`; `@opennextjs/cloudflare` 1.20.15 does not constrain the local Node major. The Worker runtime remains governed by `compatibility_date` and `nodejs_compat`, which are unchanged.
- **Testing tools**: Playwright 1.64.1 requires `node >=20`; Vitest 5.0.0 explicitly supports `>=26.0.0`; Sharp 0.35.5 supports `>=20.9.0`.
- **Cloudflare Pages**: The repository deploys through GitHub Actions with Wrangler; there is no Pages build-image Node setting in the repository, so no dashboard or build-image change is required or authorized.
- **No dependency changes** are needed; the installed tree already supports Node 26.

## Phase 1: Design

- Change `package.json#engines.node` to `26.x` and `.nvmrc` to `26`; no lockfile effect because the lockfile does not record root engine metadata.
- Change every `actions/setup-node` `node-version` to `26` (or `26.x` where the existing style uses the `.x` suffix) and rename the human-readable step labels accordingly.
- Change the Playwright setup guard's required major from 22 to 26 and its messages to match.
- Change the updater-scheduler engine and README runtime note to 26.
- Update the existing Visual QA workflow test's step name and the Memory Bank runtime fact.
- Verify with the existing commands; no new test harness or application behaviour is introduced.

## Complexity Tracking

No constitution violations. No new dependency, service, database, storage, or deployment mechanism.
