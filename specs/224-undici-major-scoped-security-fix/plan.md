# Implementation Plan: Major-Scoped Undici Security Overrides

**Branch**: `freebuff/b7618803c1c98fa008653cb9-undici` | **Date**: 2026-11-26 | **Spec**: `specs/224-undici-major-scoped-security-fix/spec.md`

**Input**: Feature specification from `specs/224-undici-major-scoped-security-fix/spec.md`

## Summary

Remove the global `undici: 8.12.2` override and replace it with `undici@6: 6.29.1`, `undici@7: 7.30.2` and `undici@8: 8.13.1`. Regenerate the pnpm lockfile, update the two guards that encode the old pin, and verify the Workers toolchain and production build. No application code or deployment configuration changes.

The fix is based on `main` at `8a18c44583192e2f32e801c81c44c6f1311e71d7`. PR #2047's OpenNext 1.20.19 update is separate; the major-scoped policy is valid for both graphs, and this branch does not claim the adapter update is installed.

## Technical Context

**Language/Version**: Node.js 26.13.0; TypeScript/JavaScript; pnpm 10.30.3.

**Primary Dependencies**: Next.js 16.4.6, React 19.3.1, `@opennextjs/cloudflare` 1.20.18 on this branch, Wrangler 4.166.0, Miniflare `5.20261119.0-beta`, `@cloudflare/workers-utils` 0.56.0, jsdom 31.0.1, `@dotenvx/dotenvx` 2.38.2.

**Storage**: No database or persisted-data change.

**Testing**: Vitest guards in `__tests__/undici-security-override.test.js` and `__tests__/dependency-management.test.js`; the repository `./freebuff-verify.sh` gate; OpenNext, Wrangler and updater-scheduler build checks.

**Target Platform**: Cloudflare Workers/Pages through OpenNext; Node.js 26.x local build.

**Project Type**: Web application dependency/security maintenance.

**Performance Goals**: No application performance change. The production build must remain strictly below 495 MiB.

**Constraints**:
- Use only pnpm 10.30.3 and the committed lockfile.
- Do not force any consumer across its declared Undici major.
- Do not change `open-next.config.ts`, `wrangler.jsonc`, compatibility date/flags, bindings, workflows, secrets or deployment settings.
- Do not merge the PR or deploy.
- Preserve the existing application behaviour, UI and integrations.

**Scale/Scope**: 12 exact paths: the manifest, lockfile, two tests, four Spec 224 artifacts, the feature pointer and three Memory Bank files.

## Constitution Check

| Principle | Assessment | Result |
| --- | --- | --- |
| Single Source of Truth | `AGENTS.md` remains authoritative; this plan and the Spec Kit artifacts describe only the authorized dependency fix. | PASS |
| Verify Before Acting | The current manifest, lockfile graph, consumer ranges, upstream release evidence, both affected tests, the Spec Kit templates and the post-patch validation guidance were inspected before editing. | PASS |
| Implementation Sequence | Specify, plan, tasks, implement, test and report are recorded in order in Spec 224. | PASS |
| Protect Core Systems | No payment, authentication, database, deployment or secret change. `package.json` and `pnpm-lock.yaml` are the only protected files, and the user explicitly authorized them for this task. | PASS |
| Resource Conservation | No new service, dependency, browser binary or `.docs/` change. The three Undici releases are patched replacements for an existing dependency. | PASS |
| Evidence Integrity | Results are recorded only after execution; `pnpm audit` is not treated as proof because the advisory feed lags. | PASS |

**Post-design re-check**: The design introduces no data model, external contract or deployment change. The same gates pass.

## Phase 0 — Research

The material decision was the override shape. `research.md` records the current graph, the 2026-11-05 Undici security releases, the latest per-major versions and the rejected alternatives. No additional research is required before implementation.

## Phase 1 — Design

No `data-model.md`, `contracts/` or `quickstart.md` is warranted: this task changes dependency resolution and two source guards, not entities, interfaces or a manual workflow. The design is the manifest override set plus the lockfile and test expectations.

### Implementation Sequence

1. **Manifest**: remove `"undici": "8.12.2"`; add the three major-scoped overrides in the same `pnpm.overrides` block.
2. **Lockfile**: run `pnpm install --lockfile-only`, then `pnpm install --frozen-lockfile`. Confirm the top-level overrides block and every Undici snapshot/edge.
3. **Guards**: rewrite `__tests__/undici-security-override.test.js` for the per-major policy; update `__tests__/dependency-management.test.js` for the new keys and absence of the bare pin.
4. **Verification**: focused Vitest, `pnpm why undici`, full `./freebuff-verify.sh` with the true base SHA, OpenNext build, Wrangler build, updater-scheduler dry-run and build-size measurement.
5. **Records**: update `activeContext.md`, `techContext.md` and `progress.md`; point `.specify/feature.json` to Spec 224.
6. **Delivery**: commit, push the feature branch, open one regular non-draft PR against `main`, leave it unmerged.

### Test Design

The dedicated guard will:

- assert `overrides.undici` is undefined;
- assert the three exact major-scoped values;
- parse every `undici@x.y.z` snapshot and every resolved `undici:` edge;
- require the set to equal 6.29.1, 7.30.2 and 8.13.1;
- reject any 8.12.0–8.12.3 edge;
- assert each resolved version is at or above its major's patched floor.

The dependency-management guard will continue to compare `package.json` with the lockfile's top-level `overrides:` block, including quoted keys.

### Verification Matrix

| Check | Command | What it proves |
| --- | --- | --- |
| Focused guards | `pnpm vitest run __tests__/undici-security-override.test.js __tests__/dependency-management.test.js` | The manifest and lockfile satisfy the per-major policy. |
| Graph inspection | `pnpm why undici` | Each consumer resolves in its declared major. |
| Repository gate | `SPEC_KIT_BASE_REF=8a18c44583192e2f32e801c81c44c6f1311e71d7 ./freebuff-verify.sh` | Frozen install, Spec Kit, Python checkers, TypeScript, full Vitest, docs tests, production build and size cap. |
| OpenNext artifact | `pnpm exec opennextjs-cloudflare build` | The production Worker/asset build still completes. |
| Wrangler | `pnpm exec wrangler build --config ./wrangler.jsonc` | The exact 7.30.2 consumer still builds. |
| Updater dry-run | `pnpm exec wrangler deploy --dry-run --config ./wrangler.updater-scheduler.jsonc` | The scheduled Worker graph still validates without deploying. |
| Size | measured from the clean build output | Strictly below 495 MiB. |

### Risks and Mitigations

- **pnpm selector misparse**: The repository already uses `glob@10`; the lockfile regeneration is the proof. If pnpm rejects a key, fall back to parent-specific selectors rather than reintroducing a global pin.
- **Cross-major resolution**: Inspect every edge, not only the override block. The guard fails if any 6.x or 7.x consumer resolves to 8.x.
- **Wrangler/Miniflare exact request**: Both request 7.30.2. Run the Wrangler build and dry-run directly.
- **OpenNext branch divergence**: PR #2047 may merge first. Rebase and rerun the focused and build checks if that happens; do not mix the two tasks.
- **Advisory-feed lag**: Do not cite `pnpm audit` zero as safety. Use the upstream release notes and the resolved versions.

## Verification Results

- `pnpm why undici` resolved exactly 6.29.1 (dotenvx), 7.30.2 (Wrangler, Miniflare, workers-utils) and 8.13.1 (jsdom).
- The focused guards passed 3 files / 50 tests, including the unchanged Chromium-cache fixture.
- `./freebuff-verify.sh` passed: frozen install, Spec Kit gate, 520 Python tests, 113 Vitest files / 1,270 tests, TypeScript, the Next.js build and the 495 MiB cap. The measured build was 485,572,608 bytes (463.08 MiB).
- The OpenNext build passed on `@opennextjs/cloudflare` 1.20.18 and wrote `.open-next/worker.js`.
- The Wrangler 4.166.0 build passed with the expected bindings and an 8,890.11 KiB upload.
- The updater-scheduler dry-run passed with `workers/updater-scheduler/wrangler.toml`; its Node tests passed 17/17.
- Playwright/Visual QA was not run locally for this dependency-only change; PR-triggered checks remain pending.

## Project Structure

```text
.specify/feature.json
__tests__/dependency-management.test.js
__tests__/undici-security-override.test.js
memory-bank/activeContext.md
memory-bank/progress.md
memory-bank/techContext.md
package.json
pnpm-lock.yaml
specs/224-undici-major-scoped-security-fix/plan.md
specs/224-undici-major-scoped-security-fix/research.md
specs/224-undici-major-scoped-security-fix/spec.md
specs/224-undici-major-scoped-security-fix/tasks.md
```

**Structure Decision**: A focused dependency-security change at the repository root. No application source tree is touched.

## Delivery Boundary

- Protected-file authorization is explicitly granted by the user for `package.json` and `pnpm-lock.yaml`; the PR will carry the exact human-authorization declaration.
- The PR is regular and non-draft, targets `main`, and is left open and unmerged.
- No deployment, secret change, Cloudflare setting change or production resource change is authorized or performed.
- PR-triggered checks are reported as pending until they run; local results are reported separately.
