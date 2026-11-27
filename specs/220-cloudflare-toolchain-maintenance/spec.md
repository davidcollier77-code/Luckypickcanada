# Feature Specification: Cloudflare Toolchain Re-Audit and OpenNext Patch

**Feature Branch**: `freebuff/b7618803c1c98fa008653cb9`

**Created**: 2026-11-26

**Status**: Implemented — verification recorded in `tasks.md` and the pull request

**Input**: User description: "Perform a completely fresh, independent audit of the repository's Wrangler and OpenNext toolchain, select the version combination with the strongest evidence of compatibility, security and stability, implement only the justified work, verify it, and open one regular, non-draft pull request against `main`."

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Keep the Cloudflare build toolchain supported and patched (Priority: P1)

As the site maintainer, I need the OpenNext Cloudflare adapter, Wrangler CLI and their transitive build dependencies to stay on a supported, security-current combination so the existing Cloudflare Worker continues to build and deploy through the unchanged pipeline.

**Why this priority**: These packages produce and validate the production Worker. Their peer requirements, transitive dependencies and generated artifacts must remain consistent with Next.js 16.4.6, Node.js 26.x and pnpm 10.30.3.

**Independent Test**: A clean frozen install from the committed lockfile succeeds under Node.js 26.x and pnpm 10.30.3, and the existing Next.js, OpenNext and Wrangler validation paths produce the expected Worker, assets and compiled CSS without changing application behaviour or deployment configuration.

**Acceptance Scenarios**:

1. **Given** the audited baseline (`@opennextjs/cloudflare` 1.20.18, `wrangler` 4.166.0), **When** the fresh audit evaluates the current stable releases and their published manifests, **Then** only the versions with a demonstrated security, compatibility or stability advantage are selected, and every retained pin is justified.
2. **Given** the selected adapter, **When** the manifest and lockfile are regenerated with Node.js 26.x and pnpm 10.30.3, **Then** a frozen install succeeds with no lockfile drift and every peer requirement of Next.js 16.4.6 and Wrangler 4.166.0 is satisfied.
3. **Given** the current Worker configuration, **When** the updated toolchain builds the application, **Then** the generated Worker, assets and compiled CSS satisfy the existing validation contracts and the combined production build stays strictly below 495 MiB.

---

### User Story 2 — Remove the advisory-affected glob/minimatch path without a cross-major override (Priority: P1)

As the site maintainer, I need the adapter's build-time glob dependency to resolve through a supported major so the repository no longer depends on forcing `minimatch` across a major boundary to stay patched.

**Why this priority**: The current adapter declares `glob ^13`, which requires `minimatch ^10`. That version line has a known moderate advisory with no patched 10.x release, and the current graph avoids it only through the root `minimatch@10 → 11.0.1` override. A cross-major override of a build-critical glob dependency is fragile and previously caused matching regressions elsewhere.

**Independent Test**: Inspect the regenerated lockfile and verify that no `glob@13` or `minimatch@10` package snapshot remains, that the adapter resolves `glob 14.0.6`, and that all other override policies still hold.

**Acceptance Scenarios**:

1. **Given** the selected adapter release, **When** the lockfile is regenerated, **Then** the adapter's `glob` edge resolves to `glob 14.0.6` and `minimatch 11.0.9`.
2. **Given** the regenerated graph, **When** the dependency-policy guard runs, **Then** it fails if a `glob@13` or `minimatch@10` snapshot returns, or if either Cloudflare build tool stops being exact-pinned and lockfile-consistent.

---

### User Story 3 — Preserve the existing dependency-security boundaries and release safeguards (Priority: P1)

As the site owner, I need the dependency audit to leave unrelated security overrides, application behaviour, Cloudflare configuration and release safeguards untouched.

**Why this priority**: The task is a focused toolchain maintenance change; weakening or silently changing other security resolutions would be an unrequested regression.

**Independent Test**: Review the complete diff and confirm it contains only the justified version pin, the regenerated lockfile, the dependency-policy regression test, Spec Kit artifacts and Memory Bank updates. Confirm every resolved `undici` version is at or above its advisory floor and the existing override policy is unchanged.

**Acceptance Scenarios**:

1. **Given** the existing overrides, **When** the lockfile is regenerated, **Then** every override remains declared and every resolved `undici` entry is at or above the patched floor for its major.
2. **Given** the dependency change, **When** the pull request is opened, **Then** the existing build validation, Visual QA, protected-file authorization and seven-category verification workflows remain active and unchanged, and no production deployment is initiated.

## Edge Cases

- A newer stable release may appear before implementation. Recheck npm dist-tags, peer requirements and release notes immediately before editing; do not silently substitute a newer target.
- The lockfile regeneration must not churn unrelated packages. Inspect the complete lockfile diff and explain every added, removed or changed package.
- A retained version is acceptable when a newer release has no applicable security, compatibility or stability benefit; record that reasoning instead of upgrading automatically.
- The new adapter must not require a Wrangler version outside the retained `4.166.0` peer range.
- Existing peer warnings (for example `eslint-plugin-jsx-a11y` and `eslint-plugin-react` versus ESLint 10) are pre-existing and outside this scope; they must not be introduced by this change.
- The adapter's new `glob 14` edge must not break the Next.js or OpenNext build; verify the generated Worker, assets and compiled CSS.
- Build output at or above 495 MiB is a release blocker.
- Missing, skipped, stale or wrong-head CI checks must not be reported as passed.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A fresh audit MUST re-derive the current stable releases, published peer/engine metadata, release notes and relevant advisories before editing, without treating earlier audits as authoritative.
- **FR-002**: The selected OpenNext Cloudflare adapter MUST support Next.js 16.4.6 and the retained Wrangler version through its declared peer ranges.
- **FR-003**: The manifest MUST update only `@opennextjs/cloudflare` to the justified release and MUST retain `wrangler` 4.166.0 and every unrelated dependency pin.
- **FR-004**: `pnpm-lock.yaml` MUST be regenerated by pnpm 10.30.3 under Node.js 26.x and MUST NOT be hand-edited.
- **FR-005**: The regenerated adapter graph MUST resolve `glob 14` and MUST contain no `glob@13` or `minimatch@10` package snapshot.
- **FR-006**: Every resolved `undici` version MUST be at or above the advisory floor for its major (6.29.1, 7.30.1, 8.12.2); the existing undici override MUST remain unchanged in this task.
- **FR-007**: Existing security and compatibility overrides MUST be preserved, including the `glob@10` compatibility override and unrelated floors. No unrelated dependency cleanup or upgrade is permitted.
- **FR-008**: A focused dependency-regression test MUST guard the exact pins, their lockfile consistency and the absence of the `glob 13`/`minimatch 10` path.
- **FR-009**: Application code, `open-next.config.ts`, `wrangler.jsonc`, compatibility date and flags, bindings, routes, migrations, workflows, Dependabot configuration, secrets and production resources MUST remain unchanged.
- **FR-010**: Verification MUST include a frozen install, the focused dependency tests, the full unit suite, the TypeScript check, the Next.js production build with its size measurement, the OpenNext build and its artifact checks, `wrangler build`, and the updater-scheduler Wrangler dry-run.
- **FR-011**: The production build output MUST remain strictly below 495 MiB.
- **FR-012**: No production deployment or merge may occur; exactly one regular, non-draft pull request is prepared for owner review.

## Success Criteria

- **SC-001**: A clean pnpm 10.30.3 `--frozen-lockfile` install completes under Node.js 26.x.
- **SC-002**: The manifest and lockfile resolve the selected OpenNext adapter, its `@opennextjs/aws` dependency and the retained Wrangler version, with the rationale for every retained version documented.
- **SC-003**: No `glob@13` or `minimatch@10` package snapshot remains, and the adapter resolves `glob 14.0.6`.
- **SC-004**: Every resolved `undici` entry is at or above its major's fixed floor and the override policy is unchanged.
- **SC-005**: The focused dependency tests, the full unit suite and the TypeScript check pass.
- **SC-006**: The Next.js and OpenNext builds complete; the Worker, assets and compiled Tailwind CSS exist; Wrangler validates both Worker configurations.
- **SC-007**: The combined `.next` and `public` output is strictly below 495 MiB.
- **SC-008**: No application behaviour, artwork, UI, Cloudflare setting, binding, compatibility date, secret or deployment workflow changes.
- **SC-009**: One regular, non-draft pull request against `main` is open and unmerged with the complete handoff report.

## Assumptions

- Node.js 26.x and pnpm 10.30.3 remain the required runtime and package-manager pins and are not changed by this task.
- Next.js 16.4.6 and React 19.3.1 remain unchanged.
- The current Cloudflare cache architecture, bindings, compatibility date, routes and production workflow remain the intended model.
- GitHub Actions continues to provide the pinned Node.js and pnpm versions for CI verification.
- The owner has authorized this dependency change and requested a reviewable pull request without merge or deployment.
