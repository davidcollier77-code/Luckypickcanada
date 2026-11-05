# Feature Specification: Freebuff Startup Command and pnpm Dependency Management

**Feature Branch**: `091-freebuff-startup-command`

**Created**: 2026-11-04

**Status**: Implemented

**Input**: User description (Master Work Request #1): stabilize Freebuff's verification process so the startup
command installs pnpm 10.30.3 and the project dependencies from the committed `pnpm-lock.yaml`; add weekly
Dependabot updates for JavaScript dependencies while keeping the GitHub Actions updates; replace `latest` for
React and React DOM with the exact versions the lockfile already installs; and reconcile the duplicated
top-level `overrides` and `pnpm.overrides` lists so the intended overrides are all applied and can no longer
diverge.

## Baseline findings (verified before changing anything)

- The worktree was clean at `037395d8` (main). The request describes a pre-existing untracked `bun.lock`, an
  existing `package.json` modification and `specs/091-freebuff-startup-command/`, but **none of them existed in
  this workspace**, so nothing unrelated was overwritten or discarded (see `tasks.md` T001–T003).
- `pnpm --version` → `10.30.3`; `pnpm install --frozen-lockfile` → exit 0, "Lockfile is up to date, resolution
  step is skipped". A bare `npm install -g pnpm` is not the path that produced it: the sandbox user cannot
  write the image's global npm prefix, so an install needs `--prefix "$HOME/.local"` (already recorded in
  `memory-bank/activeContext.md`). A fresh workspace therefore has **no** `pnpm`, and `./freebuff-verify.sh`
  failed at its first `pnpm` call instead of bootstrapping.
- `freebuff-verify.sh` invoked `pnpm tsc --noEmit`. That returned TypeScript 5.9.3 only because pnpm falls back
  to `node_modules/.bin`; the intent (run the local compiler) was implicit rather than expressed.
- `package.json` declared `"react": "latest"` and `"react-dom": "latest"`. The lockfile importer recorded
  `specifier: latest` with `version: 19.3.1` for both, so the installed, tested React was 19.3.1 and `latest`
  could move it on any future install.
- `package.json` carried **two** override lists: a top-level `overrides` object holding `postcss: ^8.5.10`, and
  `pnpm.overrides` holding 13 other entries. The lockfile's `overrides:` block listed exactly the
  `pnpm.overrides` entries and no `postcss`, proving pnpm ignored the top-level list — the postcss floor was
  declared but never applied.
- `.github/dependabot.yml` only configured `package-ecosystem: github-actions` with a weekly schedule.
- `package.json` and `pnpm-lock.yaml` are protected files (`.github/workflows/protected-files.yml`,
  `.github/CODEOWNERS`), so the change needs the protected-file authorization gate at merge time.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A fresh workspace verifies without manual setup (Priority: P1)

An agent or contributor starts from a fresh workspace with no `pnpm` and no `node_modules`, runs the repository
verification gate, and gets dependency installation and every check to run against the pinned package manager
instead of a "command not found" failure.

**Why this priority**: The verification gate is the only thing standing between a change and a merge; if it
cannot bootstrap itself, every task begins with undocumented manual setup and results become unreproducible.

**Independent Test**: Run the gate's bootstrap step with `pnpm` absent from PATH and with a fresh `$HOME`; it
installs pnpm 10.30.3 into `$HOME/.local`, reports the version, and `pnpm install --frozen-lockfile` succeeds
without touching the lockfile.

**Acceptance Scenarios**:

1. **Given** a workspace with no `pnpm` on PATH, **When** the bootstrap step runs, **Then** it provisions
   exactly the pinned version into `$HOME/.local` and puts it on PATH.
2. **Given** a workspace whose `package.json` no longer pins `packageManager`, **When** the bootstrap step runs,
   **Then** it fails with an explicit message instead of using an arbitrary pnpm.
3. **Given** a dependency tree that does not match `pnpm-lock.yaml`, **When** the gate runs, **Then**
   `pnpm install --frozen-lockfile` fails and the gate stops with that cause named.
4. **Given** the pinned pnpm and a matching tree, **When** the gate runs, **Then** the typecheck uses the local
   TypeScript binary explicitly and the lockfile is unchanged afterwards.

---

### User Story 2 - JavaScript dependencies get weekly update proposals (Priority: P1)

The maintainer receives one weekly Dependabot pull request stream for the pnpm-managed JavaScript dependencies,
alongside the existing weekly GitHub Actions updates, without a second lockfile appearing in the repository.

**Why this priority**: Update proposals are the only routine mechanism keeping the dependency set current; the
request explicitly asks for them and for the existing Actions updates to survive.

**Independent Test**: Read `.github/dependabot.yml` and confirm a weekly `npm` entry for `/` and the unchanged
weekly `github-actions` entry, with `pnpm-lock.yaml` still the only committed lockfile.

**Acceptance Scenarios**:

1. **Given** the Dependabot configuration, **When** it is inspected, **Then** it declares the `npm` ecosystem
   (which Dependabot uses for pnpm projects) at `/` on a weekly schedule.
2. **Given** the same file, **When** it is inspected, **Then** the `github-actions` entry is still present,
   still weekly, and still at `/`.
3. **Given** the repository, **When** lockfiles are listed, **Then** only `pnpm-lock.yaml` is authoritative and
   no `package-lock.json` or `yarn.lock` is introduced.

---

### User Story 3 - React is installed at a known, tested version (Priority: P1)

A dependency install produces the same React and React DOM versions the repository has already validated, and a
newer major or minor cannot arrive silently through a moving tag.

**Why this priority**: `latest` makes builds non-reproducible and can ship an untested React into the site's
UI without any code change.

**Independent Test**: `pnpm list react react-dom` reports 19.3.1 for both, and both `package.json` and the
lockfile importer record the exact same version.

**Acceptance Scenarios**:

1. **Given** `package.json`, **When** it is inspected, **Then** `react` and `react-dom` are the same exact
   version, not `latest` and not a range.
2. **Given** the lockfile, **When** its importer is inspected, **Then** the recorded specifier and resolved
   version equal the `package.json` pin.
3. **Given** the installed tree, **When** `pnpm install --frozen-lockfile` runs, **Then** it succeeds without
   changing any resolved version.

---

### User Story 4 - Every intended override is actually applied (Priority: P2)

A maintainer reads one override list, sees every security floor the repository intends, and can trust that
adding an entry in one place cannot be silently ignored because the same field exists in two places.

**Why this priority**: A declared-but-ignored override gives a false sense of a patched dependency; the
duplicate also invites the two lists to disagree.

**Independent Test**: `package.json` has no top-level `overrides` key, `pnpm.overrides` contains the postcss
floor and all 13 pre-existing entries, and the lockfile's `overrides:` block equals the `pnpm.overrides` map.

**Acceptance Scenarios**:

1. **Given** `package.json`, **When** override fields are inspected, **Then** `pnpm.overrides` is the only one
   and it contains `postcss: ^8.5.10` plus every previously declared entry.
2. **Given** the lockfile, **When** its `overrides:` block is compared with `pnpm.overrides`, **Then** the keys
   and values are identical.
3. **Given** a future edit that adds a second top-level `overrides` list, **When** the guard test runs, **Then**
   it fails and names the divergence.
4. **Given** a future edit that changes React back to `latest` or to a range, **When** the guard test runs,
   **Then** it fails.

### Edge Cases

- **Curated lockfile peer metadata.** The committed lockfile carries hand-curated peer ranges (for example
  `postcss: ^8.5.26` and `next: >=15.5.4 <16 || >=16.4.3`, from the security remediation commit `a3f42c86`).
  A full `pnpm install` regeneration rewrites ~30 of those ranges — loosening them to `^8.5.10` and
  `>=16.4.1` — so only the entries that express this task's intent may change. Preserving the curated ranges is
  required; the lockfile must still install in frozen mode.
- **Overrides and peer ranges.** Because pnpm rewrites a matching peer range with the override value, moving
  `postcss` into `pnpm.overrides` makes regeneration want to loosen postcss peer ranges. The curated values must
  survive, and frozen installs must still pass.
- **A second lockfile.** A pnpm-only policy must not be undermined by a committed `package-lock.json` or
  `yarn.lock`; any untracked `bun.lock` present in a workspace is left untouched and uncommitted.
- **Wrong package manager version.** A workspace carrying a different pnpm (for example a corepack shim) must not
  silently verify the repository.
- **Node engine mismatch.** The workspace runs Node 26 against `engines.node: 22.x`; this is a pnpm warning, not
  a failure, and the gate must not turn it into one.

## Requirements *(mandatory)*

- **FR-001**: The verification gate MUST bootstrap the pnpm version pinned by `package.json#packageManager`
  (10.30.3), installing it into a user-writable prefix when it is absent, and MUST fail with an explicit message
  when the pin is missing or cannot be satisfied.
- **FR-002**: The verification gate MUST install dependencies with `pnpm install --frozen-lockfile` and MUST stop
  when the tree or the lockfile is out of date.
- **FR-003**: The verification gate MUST invoke the local TypeScript compiler explicitly (`pnpm exec tsc`) rather
  than relying on pnpm's implicit binary fallback.
- **FR-004**: No test, check or gate step may be removed, skipped, softened or replaced by inspection only.
- **FR-005**: `.github/dependabot.yml` MUST add a weekly `npm` ecosystem update for `/` and MUST keep the existing
  weekly `github-actions` update unchanged.
- **FR-006**: `pkg.dependencies.react` and `pkg.dependencies["react-dom"]` MUST be the same exact version, MUST
  equal the version the lockfile resolves, and MUST NOT be `latest` or a range.
- **FR-007**: `package.json` MUST declare dependency overrides in exactly one place (`pnpm.overrides`), which MUST
  retain the previously declared top-level `postcss: ^8.5.10` entry and all 13 pre-existing entries.
- **FR-008**: The lockfile `overrides:` block MUST equal `pnpm.overrides`, and the lockfile importer specifiers for
  React and React DOM MUST equal their `package.json` pins.
- **FR-009**: A committed automated guard MUST fail when the override lists diverge, when React is not exactly
  pinned to the lockfile version, when the pnpm pin changes, or when the Dependabot configuration loses either
  weekly ecosystem entry.
- **FR-010**: The change MUST NOT alter application behaviour, visuals, image delivery (AVIF-first with WebP
  fallback), payments, email, database, deployment configuration or any second package manager/lockfile.

### Key Entities

- **`package.json`**: the dependency manifest — package-manager pin, React pins, single overrides list.
- **`pnpm-lock.yaml`**: the single authoritative dependency lockfile — importer specifiers, overrides, curated
  peer metadata.
- **`.github/dependabot.yml`**: weekly update schedule per ecosystem.
- **`scripts/bootstrap-pnpm.sh`**: resolves, provisions and exports the pinned pnpm for the gate and the startup
  command.
- **`__tests__/dependency-management.test.js`**: the guard that keeps those artifacts consistent.

## Success Criteria *(mandatory)*

- **SC-001**: With `pnpm` absent from PATH and a fresh `$HOME`, the bootstrap step installs pnpm 10.30.3 and
  reports it; with a manifest that drops the pin, it exits non-zero with an explanatory message.
- **SC-002**: `pnpm install --frozen-lockfile` exits 0 on the final tree and leaves `pnpm-lock.yaml` byte-identical.
- **SC-003**: `pnpm list react react-dom` reports exactly 19.3.1 for both packages.
- **SC-004**: `pnpm exec vitest run __tests__/dependency-management.test.js` passes, and the guard fails when any
  of its four conditions is deliberately violated.
- **SC-005**: `./freebuff-verify.sh` exits 0 on the final code, including the Spec Kit gate, the typecheck, the
  production build and the refresh-docs tests, with the measured build under the 495 MB hard maximum.
- **SC-006**: The final diff contains only the intended files: the manifest, the lockfile's intended entries, the
  Dependabot configuration, the verification gate, the bootstrap script, the guard test and this feature's
  artifacts.
- **SC-007**: The full unit suite (`pnpm exec vitest run`) passes, and no test was weakened or removed.

## Assumptions

- "The Freebuff Startup Command" is the platform-side workspace command that installs pnpm and the project
  dependencies; it is not stored in the repository. The repository-side equivalent is
  `scripts/bootstrap-pnpm.sh` plus `pnpm install --frozen-lockfile`, and the gate performs exactly that sequence,
  so the startup path is verifiable from the repository.
- Dashboard Dependabot settings are not repository configuration; only `.github/dependabot.yml` is in scope.
- React 19.3.1 is the correct pin because it is what the lockfile already resolves and what the existing tests,
  build and site run against; no upgrade is intended.
- The top-level `overrides` list was intended to be applied (postcss is a known CVE-adjacent floor), so it is
  preserved in the list pnpm actually reads rather than deleted.
- `package.json` and `pnpm-lock.yaml` being protected files means this PR needs the owner's authorization gate at
  merge, which is expected rather than a blocker to opening it.

## Follow-up acceptance criteria — PR-head QA repair

Current PR-head CI exposed defects in the new dependency guard and executable verification entry point. The bootstrap failure path also needs to honour sourced-call semantics.

- **FR-011**: When sourced, `scripts/bootstrap-pnpm.sh` MUST return a non-zero status on failure without exiting the caller; when executed directly, it MUST exit non-zero.
- **FR-012**: A missing or invalid package-manager pin MUST stop before any npm install command is attempted.
- **FR-013**: The lockfile guard MUST match direct dependency keys exactly so `react` and `react-dom` are independently validated; the Dependabot guard MUST parse both ecosystem blocks without malformed patterns or undefined variables.
- **FR-014**: `freebuff-verify.sh` MUST be committed as executable because CI workflows invoke it directly.
- **FR-015**: Visual QA and updater-scheduler verification MUST retain their full required checks; no test, governance check, build-size gate, or Wrangler dry run may be skipped.

### Follow-up success criteria

- **SC-008**: Automated shell tests prove sourced failures return non-zero while the caller survives, direct failures exit non-zero, and fresh environments install only the exact pinned version.
- **SC-009**: Focused dependency/bootstrap tests and the full unit suite pass on the updated PR head.
- **SC-010**: Visual QA and updater-scheduler verification pass on the updated PR head; the PR workflow remains verification-only and does not deploy production.
- **SC-011**: The repository verification script is executable in Git and the full verification gate completes with the production build below 495 MB.
## Visual QA follow-up — baseline and native image warning

The desktop homepage screenshot comparison on the PR head showed an 8% pixel difference because the committed desktop golden image dates from 2026-10-23 and predates the already-merged 2026-11-04 hero navigation consolidation. The current desktop page correctly renders the approved four-link navigation and centered artwork. The static baseline must be refreshed from the current rendered page; the 0.7% difference threshold must not be loosened. Mobile baselines already pass and remain unchanged.

The same run surfaced a separate React warning: the Lucky Map's native HTML `<img>` had a bare `priority` attribute. Its valid `loading="eager"` and `fetchPriority="high"` attributes already preserve eager/high-priority loading.

- **FR-016**: The desktop homepage golden screenshot MUST represent the current approved hero navigation and artwork layout; refresh only the stale desktop baseline and preserve the strict 0.7% mismatch limit.
- **FR-017**: The Lucky Map native `<img>` MUST retain `loading="eager"` and `fetchPriority="high"` without the unsupported `priority` attribute.
- **SC-012**: Current desktop, mobile-390, and mobile-412 homepage screenshot checks pass with the existing 0.7% cap; the approved current navigation/artwork remains visually represented in the baseline.
- **SC-013**: The invalid React DOM attribute warning is absent while AVIF, WebP and PNG fallback delivery and eager/high fetch priority remain intact.

## Final review-driven acceptance criteria — verification gate integrity

The verification entry point and package-manager bootstrap must remain deterministic and fail closed when a required operation fails. Sourcing the bootstrap must not leave helper functions or temporary status variables in the caller's shell.

- **FR-018**: Each required verification command (frozen install, TypeScript check, production build, and refresh-docs tests) MUST execute exactly once per gate invocation.
- **FR-019**: A non-zero result from any required verification command MUST stop the gate immediately with a clear failure message; a failed refresh-docs test MUST NOT be reported as success.
- **FR-020**: The package-manager bootstrap MUST read the exact pnpm version from `package.json#packageManager`, reject missing, non-pnpm, or non-exact pins before installation, and MUST install only that version.
- **FR-021**: A successful sourced bootstrap MUST expose the validated absolute pnpm binary directory on the caller's PATH for the remainder of that shell session.
- **FR-022**: A sourced bootstrap MUST return a non-zero status on failure without terminating the caller and MUST leave no bootstrap helper functions or temporary global status variables behind; direct execution MUST exit non-zero on failure.
- **FR-023**: Automated regression tests MUST cover dynamic package-manager pins, sourced and direct failure behavior, installer failure, same-shell PATH availability, namespace cleanup, exactly-once verification commands, and fail-closed refresh-docs handling.

### Follow-up success criteria

- **SC-014**: The gate invokes TypeScript, production build, and refresh-docs tests once each and exits non-zero at the first failed required step.
- **SC-015**: A fresh temporary home installs the exact package-manager pin read from the fixture manifest; the installed binary is callable in the same sourced shell.
- **SC-016**: Failed sourced bootstrap calls leave the caller alive, return non-zero, and do not leak helper functions or temporary variables; failed direct invocation exits non-zero.
- **SC-017**: Focused regression tests and the full PR-head CI pass without changing dependency versions, lockfiles, application behavior, artwork, AVIF/WebP delivery, or the 495 MiB build-size ceiling.

- **FR-024**: Re-sourcing the bootstrap in the same shell MUST remain idempotent and MUST NOT add a duplicate pnpm directory entry to PATH.
- **SC-018**: A regression test sources the bootstrap twice in one shell and confirms PATH remains byte-identical after the second successful source.
