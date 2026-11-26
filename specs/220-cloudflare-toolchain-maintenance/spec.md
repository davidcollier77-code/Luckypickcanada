# Feature Specification: Cloudflare Toolchain Patch Maintenance

**Feature Branch**: chore/220-cloudflare-toolchain-maintenance  
**Created**: 2026-11-26  
**Status**: Proposed — implementation authorized; execution blocked by the ChatGPT repository environment

## User Scenarios & Testing

### User Story 1 — Keep the Cloudflare build toolchain supported (Priority: P1)

As the site maintainer, I need the OpenNext Cloudflare adapter and Wrangler CLI to use mutually compatible stable patch releases so the application continues to build through the existing Cloudflare pipeline.

**Why this priority**: These packages produce and validate the production Worker. Their peer requirements, transitive dependencies and generated artifacts must remain consistent with the installed Next.js version and the repository's build process.

**Independent Test**: A clean install using the pinned package manager succeeds from the committed lockfile, and the existing OpenNext and Wrangler build-validation paths produce the expected Worker and assets without changing application behavior or deployment configuration.

**Acceptance Scenarios**:
1. Given the current pins OpenNext 1.20.18 and Wrangler 4.166.0, when the approved implementation updates the stable targets rechecked immediately before editing, then the selected versions satisfy the repository's Next.js 16.4.6 and OpenNext/Wrangler peer requirements.
2. Given the repository requires Node.js 26.x and pnpm 10.30.3, when the lockfile is regenerated in that supported environment, then a frozen install succeeds without engine warnings or lockfile drift.
3. Given the current Worker configuration, when the updated toolchain builds the app, then the generated Worker, assets and compiled CSS meet existing validation contracts.

### User Story 2 — Preserve dependency security and API compatibility (Priority: P1)

As the site maintainer, I need dependency overrides to enforce patched versions without forcing a package across a major-version boundary that its consumer did not declare.

**Why this priority**: The current global Undici 8.12.2 override also rewrites Wrangler's declared Undici 7.30.2 dependency. Undici 8 includes dispatcher API changes; a patched version is not sufficient if the override changes the API expected by Wrangler or Miniflare.

**Independent Test**: Inspect all Undici dependency paths in the regenerated lockfile and verify that each resolved major line is at or above its published fixed version, while Wrangler remains on a compatible patched v7 release. Confirm the new OpenNext dependency graph no longer contains an affected minimatch 10 path.

**Acceptance Scenarios**:
1. Given the existing root-level Undici override, when the approved implementation narrows it using a pnpm 10.30.3-supported version-aware rule, then the graph contains only patched Undici versions and does not force Wrangler's v7 consumer onto v8.
2. Given OpenNext 1.20.19 changes its glob dependency to v14, when the graph is regenerated, then minimatch 10 is absent where it was introduced by OpenNext's glob 13 path, without breaking another consumer.
3. Given existing security overrides and tests, when the dependency update is complete, then unrelated overrides remain intact and regression tests prevent vulnerable or incompatible resolutions from returning.

### User Story 3 — Retain existing release safeguards (Priority: P1)

As the site owner, I need current CI checks and Cloudflare deployment safeguards to remain authoritative while the dependency update is reviewed.

**Independent Test**: The dependency PR runs applicable validation, visual QA and protected-file workflows on its current head. No production deployment is initiated by the dependency PR.

**Acceptance Scenarios**:
1. Given package.json and pnpm-lock.yaml change, when the PR is opened, then protected-file authorization, application verification, both applicable Playwright shards, OpenNext validation and the seven-category PR report remain active.
2. Given the dependency build completes, when output is measured, then combined .next and public output remains strictly below 495 MiB.
3. Given the PR is reviewed and merged, then the unchanged main-branch deployment workflow remains the only production deployment path.

## Edge Cases

- A newer stable release may appear before implementation. Recheck npm dist-tags, peers, release notes and provenance before editing; do not silently use a newer target.
- A registry or package-manager resolution may produce a transitive version outside a consumer's declared range. Frozen install, lockfile inspection and package tests must expose it.
- A dependency may request another Undici major. Inspect every resolved major and apply its own fixed version only when required.
- Removing minimatch 10 overrides may expose another consumer. Remove only overrides proven obsolete by the complete post-update graph.
- Wrangler 4.168.0 includes a Miniflare prerelease dependency. Validate the main Worker build and updater-scheduler Wrangler path; do not independently override Miniflare without evidence.
- A frozen install or build failure under Node 26/pnpm 10.30.3 is a release blocker; do not hand-edit or force the lockfile.
- Build output at or above 495 MiB is a release blocker.
- Missing, skipped, stale or wrong-head CI checks must not be reported as passed.

## Functional Requirements

- **FR-001**: Recheck current stable npm versions and published metadata immediately before editing. Investigated targets as of 2026-11-26 are @opennextjs/cloudflare 1.20.19 and Wrangler 4.168.0.
- **FR-002**: The selected OpenNext release must support Next.js 16.4.6 and the selected Wrangler version according to declared peer ranges.
- **FR-003**: Update package.json and regenerate pnpm-lock.yaml using Node.js 26.x and pnpm 10.30.3. The lockfile must be produced by the pinned package manager, not assembled manually.
- **FR-004**: The Undici override must not globally force Wrangler's declared 7.x dependency onto 8.x. Use only pnpm 10.30.3-supported ordinary package-version selectors and/or parent-specific selectors, selected from the actual post-override dependency graph and original consumer requests. Wrangler 4.168.0's published manifest declares the exact dependency `undici: 7.30.2`; its lockfile path must therefore resolve to exactly 7.30.2, not merely any patched 7.x version. Preserve required v8 paths at or above 8.12.2. The empty-range convergence selector `undici@` was added in pnpm 11.13.0 and must not be used with pnpm 10.30.3. Any other major found in the graph must be resolved at or above its published fixed release without forcing an incompatible consumer range, or explicitly justified.
- **FR-005**: Inspect every resolved Undici package entry in `pnpm-lock.yaml` and enforce the advisory floors: v6 must be at least 6.29.1, v7 at least 7.30.1, and v8 at least 8.12.2. Additionally, verify that the Wrangler 4.168.0 dependency path resolves to exactly 7.30.2, matching its published manifest request. Tests must examine resolved versions and the consumer path, not just the major number.
- **FR-006**: Remove minimatch 10-specific overrides only if the complete post-update graph proves they are unused. Preserve the existing glob@10 compatibility override and unrelated security overrides unless separate evidence proves a change is required.
- **FR-007**: Resolve OpenNext Cloudflare 1.20.19 and its required OpenNext AWS 4.2.1 dependency, plus Wrangler 4.168.0 and its matching Workerd, Miniflare, Workers utility and integrity metadata. Explain any additional version changes from the actual graph.
- **FR-008**: Preserve application code, open-next.config.ts, wrangler.jsonc, compatibility date/flags, bindings, routes, migrations, deployment workflows, Dependabot schedule, Cloudflare settings, secrets and production resources.
- **FR-009**: Verification must include focused dependency tests, full unit suite, TypeScript, frozen install, production build and size measurement, OpenNext build/artifacts, Wrangler validation for the main app, and updater-scheduler Wrangler dry-run.
- **FR-010**: Retain both applicable Visual QA shards and the seven-category PR report. Do not weaken workflows, checkers, classifiers or protected-file rules.
- **FR-011**: Production build output must remain strictly below 495 MiB.
- **FR-012**: Do not deploy production, modify Cloudflare settings, change secrets or merge the PR.

## Success Criteria

- **SC-001**: A clean pnpm 10.30.3 frozen install completes under Node.js 26.x.
- **SC-002**: Manifest and lockfile resolve the current compatible stable OpenNext, OpenNext AWS and Wrangler versions, or a re-researched set with documented rationale.
- **SC-003**: Every Undici lockfile entry is at or above the fixed floor for its major, and Wrangler 4.168.0 resolves its Undici dependency to exactly 7.30.2 (not v8 or a lower v7 release).
- **SC-004**: The OpenNext graph no longer contains the minimatch 10 path caused by glob 13; any remaining minimatch 10 override has a named consumer and regression evidence.
- **SC-005**: Focused dependency tests, full unit suite and TypeScript check pass.
- **SC-006**: Next.js/OpenNext builds complete; expected Worker, CSS and assets exist; Wrangler validates both Worker configurations.
- **SC-007**: Combined .next and public output remains strictly below 495 MiB.
- **SC-008**: Both applicable Visual QA shards and all required current-head PR categories complete without bypass or misreporting.
- **SC-009**: No application behavior, artwork, UI, Cloudflare setting, binding, compatibility date, production deployment or secret changes occur.

## Assumptions

- Node.js 26.x and pnpm 10.30.3 remain the required runtime/package-manager pins and are not changed by this task.
- Next.js 16.4.6 and React 19.3.1 remain unchanged.
- The owner explicitly authorized dependency implementation on 2026-11-26. Implementation is in scope, but has not started because this ChatGPT environment does not meet the required Node.js 26.x / pnpm 10.30.3 runtime and the ChatGPT-only AGENTS.md rule prohibits repository shell scripts, dependency installs, builds and tests here. Production deployment and merging remain unauthorized.
- The current Cloudflare cache architecture, bindings and production workflow remain the intended model.
- GitHub Actions provides the pinned Node.js and pnpm versions for CI verification.
