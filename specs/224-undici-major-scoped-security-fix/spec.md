# Feature Specification: Major-Scoped Undici Security Overrides

**Feature Branch**: `freebuff/b7618803c1c98fa008653cb9-undici`
**Created**: 2026-11-26
**Status**: Implemented — locally verified; PR pending
**Input**: Replace the global `undici: 8.12.2` pnpm override with major-scoped patched versions (6.29.1, 7.30.2, 8.13.1). 8.12.2 is below the patched floor. Update the tests, regenerate the lockfile, verify, and open a regular PR.

## User Scenarios & Testing

### User Story 1 — Resolve each Undici major to a patched release (Priority: P1)

As the repository maintainer, I need every dependency that consumes Undici to receive a patched release in its own declared major, so the vulnerable 8.12.2 pin is removed without forcing a cross-major upgrade on Wrangler, Miniflare, workers-utils, dotenvx or jsdom.

**Why this priority**: The global pin currently forces every consumer onto 8.12.2, which upstream security releases identify as affected. The fix must remove that exposure while preserving each consumer's supported major.

**Independent Test**: Inspect `package.json`, the regenerated `pnpm-lock.yaml`, and `pnpm why undici`. Confirm the three major-scoped overrides exist, the bare override is gone, and the resolved graph contains only 6.29.1, 7.30.2 and 8.13.1.

**Acceptance Scenarios**:

1. **Given** `pnpm.overrides` contains the three major-scoped entries, **When** the manifest is inspected, **Then** no bare `undici` override remains.
2. **Given** `@dotenvx/dotenvx` declares `^6.28.1`, **When** the lockfile is regenerated, **Then** its Undici edge resolves to 6.29.1.
3. **Given** Wrangler, Miniflare and `@cloudflare/workers-utils` declare 7.30.2, **When** the lockfile is regenerated, **Then** their Undici edges resolve to 7.30.2.
4. **Given** jsdom declares `^8.12.3`, **When** the lockfile is regenerated, **Then** its Undici edge resolves to 8.13.1.
5. **Given** the complete lockfile, **When** every Undici snapshot and edge is enumerated, **Then** no 8.12.2 or earlier patched-floor version remains.

---

### User Story 2 — Prevent the global pin from returning (Priority: P1)

As a reviewer, I need automated guards that fail when the bare override is restored, a major-scoped override is removed, or a vulnerable Undici release is resolved, so this security regression cannot silently return.

**Why this priority**: The previous guard encoded the global pin as the expected state. It must now encode the per-major policy and the patched floors.

**Independent Test**: Run the two affected Vitest files against the updated manifest and lockfile. Then temporarily reason through the negative cases: a bare override, a missing `undici@6`/`@7`/`@8`, or a 8.12.2 snapshot must fail an assertion.

**Acceptance Scenarios**:

1. **Given** the updated `package.json`, **When** the dedicated Undici guard runs, **Then** it asserts the three exact major-scoped overrides and the absence of a bare override.
2. **Given** the updated lockfile, **When** the dedicated guard parses snapshots and resolved edges, **Then** it accepts only the three patched versions and rejects 8.12.2.
3. **Given** the dependency-management guard, **When** it compares `pnpm.overrides` with the lockfile's top-level `overrides:` block, **Then** the quoted `undici@6`, `undici@7` and `undici@8` keys match exactly.

---

### User Story 3 — Preserve toolchain and application behaviour (Priority: P2)

As the owner, I need the dependency correction to leave the Cloudflare toolchain and production build working, so the security fix is not coupled to an unsupported Wrangler, Miniflare, OpenNext or jsdom upgrade.

**Why this priority**: The global pin crossed major boundaries. The replacement must restore each consumer's supported range while preserving the existing deployment configuration and the 495 MiB production-build cap.

**Independent Test**: Build the OpenNext Worker artifact, run the Wrangler build and updater-scheduler dry-run, and measure the production build. Confirm no application code, workflow, binding, compatibility date or deployment setting changed.

**Acceptance Scenarios**:

1. **Given** the regenerated dependency graph, **When** the OpenNext build runs, **Then** it completes and produces the expected Worker and asset output.
2. **Given** the same graph, **When** the Wrangler build and updater-scheduler `deploy --dry-run` run, **Then** both complete without a dependency or configuration error.
3. **Given** a clean production build, **When** its output is measured, **Then** it remains strictly below 495 MiB.
4. **Given** the final diff, **When** it is reviewed, **Then** no application source, workflow, Cloudflare binding, compatibility flag, secret or deployment setting is changed.

---

### Edge Cases

- **pnpm 10 selector syntax**: The repository already uses major-scoped keys such as `glob@10`. The new `undici@6`, `undici@7` and `undici@8` keys must be accepted by pnpm 10.30.3 and appear in the lockfile's `overrides:` block, including any quoted-key form pnpm emits.
- **Consumer range compatibility**: 6.29.1 must satisfy `@dotenvx/dotenvx`'s `^6.28.1`; 7.30.2 must satisfy the exact 7.30.2 requests; 8.13.1 must satisfy jsdom's `^8.12.3`.
- **Future patch releases**: The guards pin exact patched releases. A later security bump must update the manifest, lockfile and test expectations together; this is intentional rather than silently accepting an unknown version.
- **Advisory-feed lag**: `pnpm audit` may report zero because the GitHub global advisory API does not yet contain the new Undici advisories. A zero audit result is not evidence that 8.12.2 is safe.
- **Separate OpenNext PR**: PR #2047 updates OpenNext to 1.20.19 on its own branch. This fix is based on `main` and must remain valid for both the current 1.20.18 graph and the updated graph; if #2047 merges first, rebase and rerun the dependency and build checks.

## Requirements

### Functional Requirements

- **FR-001**: Remove the bare `undici` entry from `package.json` `pnpm.overrides`.
- **FR-002**: Add exactly `undici@6: 6.29.1`, `undici@7: 7.30.2` and `undici@8: 8.13.1` to `pnpm.overrides`.
- **FR-003**: Regenerate `pnpm-lock.yaml` with pnpm 10.30.3 and Node.js 26.x. The lockfile must contain no 8.12.2 package snapshot or resolved edge.
- **FR-004**: Preserve each consumer's declared major. The resolved graph must contain only 6.29.1, 7.30.2 and 8.13.1, with no cross-major force.
- **FR-005**: Rewrite `__tests__/undici-security-override.test.js` to assert the three major-scoped overrides, the absence of a bare override, the exact patched lockfile versions, and the absence of 8.12.2 or lower patched-floor releases.
- **FR-006**: Update `__tests__/dependency-management.test.js` so its security-override expectation and lockfile comparison describe the new keys and versions.
- **FR-007**: Do not change application code, `open-next.config.ts`, `wrangler.jsonc`, the compatibility date or flags, bindings, workflows, secrets, Cloudflare settings or production resources.
- **FR-008**: Run the focused Vitest files, the full repository verification, the OpenNext build, the Wrangler build, the updater-scheduler dry-run and the production build-size measurement. Record actual results and limitations.
- **FR-009**: Add the Spec 224 specification, research, plan and task artifacts; point `.specify/feature.json` to Spec 224; update the affected Memory Bank facts.
- **FR-010**: Submit one regular, non-draft pull request against `main`. Do not merge it or deploy anything.

### Scope

The exact intended changed paths are:

- `.specify/feature.json`
- `__tests__/dependency-management.test.js`
- `__tests__/undici-security-override.test.js`
- `memory-bank/activeContext.md`
- `memory-bank/progress.md`
- `memory-bank/techContext.md`
- `package.json`
- `pnpm-lock.yaml`
- `specs/224-undici-major-scoped-security-fix/plan.md`
- `specs/224-undici-major-scoped-security-fix/research.md`
- `specs/224-undici-major-scoped-security-fix/spec.md`
- `specs/224-undici-major-scoped-security-fix/tasks.md`

No other path is authorized.

## Success Criteria

### Measurable Outcomes

- **SC-001**: `package.json` contains the three exact major-scoped overrides and no bare `undici` override.
- **SC-002**: `pnpm-lock.yaml` contains exactly 6.29.1, 7.30.2 and 8.13.1 as Undici snapshots and resolved versions, with zero 8.12.2 occurrences in dependency edges.
- **SC-003**: Each consumer's resolved Undici major equals its declared major; no 6.x or 7.x consumer resolves to an 8.x release.
- **SC-004**: Both affected Vitest files pass, and their assertions cover the bare-pin, missing-major and 8.12.2 regression cases.
- **SC-005**: Full verification, the OpenNext build, the Wrangler build and the updater dry-run pass; the production build remains strictly below 495 MiB.
- **SC-006**: The final diff contains exactly the 12 listed paths and no application, workflow, binding or deployment change.
- **SC-007**: One regular, non-draft PR is open against `main`; it is not merged and nothing is deployed.

## Verification Record — 2026-11-26

| Check | Result |
| --- | --- |
| `pnpm why undici` | PASS — dotenvx 6.29.1; Wrangler/Miniflare/workers-utils 7.30.2; jsdom 8.13.1. |
| Focused Vitest guards | PASS — 3 files, 50 tests (including the unchanged Chromium-cache fixture). |
| `./freebuff-verify.sh` | PASS — 520 Python tests, 113 Vitest files / 1,270 tests, TypeScript, Next.js build and size cap. |
| Production build size | PASS — 485,572,608 bytes (463.08 MiB), strictly below 495 MiB. |
| OpenNext build | PASS — `@opennextjs/cloudflare` 1.20.18, Worker saved in `.open-next/worker.js`. |
| Wrangler build | PASS — Wrangler 4.166.0, bindings parsed, 8,890.11 KiB upload. |
| Updater-scheduler dry-run | PASS — `workers/updater-scheduler/wrangler.toml`, no deploy. |
| Updater Node tests | PASS — 17/17. |
| Playwright / Visual QA | NOT RUN locally — dependency-only diff; PR-triggered checks remain pending. |

Local verification uses `main`'s `@opennextjs/cloudflare` 1.20.18 graph. PR #2047's 1.20.19 update is separate; the override policy must remain valid for both graphs.

## Assumptions

- The requested versions are the patched floors for their majors at the time of this task. 6.29.1 and 7.30.2 are the latest published releases in their majors; 8.13.1 is the latest published 8.x release.
- The declared consumer ranges accept those versions, so normal pnpm resolution can select them without a cross-major force.
- PR #2047's OpenNext 1.20.19 update is a separate task. This fix applies to both dependency graphs, but this branch does not claim that the adapter update is installed.
- The production build cap is the repository's hard 495 MiB limit, measured from a clean build.
- No production deployment is part of this task.
