# Feature Specification: Cloudflare Production Dependency Modernization

**Feature Branch**: `freebuff/94bbe053cb1ed6af61ade216`
**Created**: 2026-11-27
**Status**: Implemented — locally verified; PR pending
**Input**: Modernize the Cloudflare production dependency stack to a current, secure, mutually compatible and reliable configuration; review the OpenNext Cloudflare adapter and Wrangler versions together; remove dependency overrides (`glob`, `minimatch`, and the rest) that the updated graph no longer needs; verify the dependency tree, security findings, compatibility, production build and tests, with the build strictly below 495 MiB.

## User Scenarios & Testing

### User Story 1 — Keep the Cloudflare adapter and Wrangler on a supported pair (Priority: P1)

As the repository maintainer, I need the OpenNext Cloudflare adapter and Wrangler to be a mutually supported, current stable pair, so production deploys are built and uploaded by supported tooling.

**Why this priority**: These two packages build and upload the production Worker. Their peer contract decides which combinations are supported.

**Independent Test**: Inspect `package.json`, the lockfile importer and `pnpm why wrangler`; compare the resolved versions with the adapter's declared peer range and the published stable releases.

**Acceptance Scenarios**:

1. **Given** the current registry state, **When** the adapter version is inspected, **Then** it is `@opennextjs/cloudflare` 1.20.19, the latest published release.
2. **Given** that adapter, **When** Wrangler is selected, **Then** the selected version satisfies the adapter's `wrangler: ^4.148.0` peer range and is the latest stable release (4.168.0).
3. **Given** the updated pair, **When** the OpenNext build and a Wrangler dry-run run, **Then** both complete and the Worker artifact, bindings and compatibility settings are unchanged.

---

### User Story 2 — Keep only overrides with a verified reason (Priority: P1)

As a reviewer, I need `pnpm.overrides` to contain only overrides that a specific verified advisory or genuine compatibility requirement justifies, so dependency management is maintainable and no consumer is forced across its declared major without evidence.

**Why this priority**: Eighteen historical entries accumulated; several referenced parent versions that no longer exist in the graph or restated a direct dependency.

**Independent Test**: Compare `package.json` with the lockfile `overrides:` block, inspect every resolved version and run `pnpm audit`.

**Acceptance Scenarios**:

1. **Given** the updated manifest, **When** `pnpm.overrides` is read, **Then** it contains exactly the three major-scoped Undici security floors and nothing else.
2. **Given** the regenerated lockfile, **When** every `glob`, `minimatch` and `brace-expansion` snapshot is enumerated, **Then** no affected release is resolved and no cross-major force is required.
3. **Given** the regenerated lockfile, **When** `pnpm audit` runs, **Then** it reports no known vulnerabilities.
4. **Given** the removed overrides, **When** the graph is inspected, **Then** each affected package still resolves within its consumers' declared ranges.

---

### User Story 3 — Preserve production functionality and the build limit (Priority: P1)

As the owner, I need the dependency change to leave the application, Cloudflare configuration and build limit intact.

**Why this priority**: A dependency refresh must not change site behaviour, deployment configuration or exceed the 495 MiB production-build cap.

**Independent Test**: Review the final diff, run the full repository verification and measure the production build.

**Acceptance Scenarios**:

1. **Given** the final diff, **When** it is reviewed, **Then** no application source, `open-next.config.ts`, `wrangler.jsonc`, compatibility date/flag, binding, workflow, secret or production setting changed.
2. **Given** the updated graph, **When** the repository gate runs, **Then** TypeScript, the full Vitest suite and the Next.js build pass.
3. **Given** a clean production build, **When** `.next` + `public` are measured, **Then** the total stays strictly below 495 MiB.

---

### Edge Cases

- **Companion-package drift**: `@vitest/mocker` and `@vitest/spy` must match the installed Vitest release; a mismatch is a downgrade, not a security fix.
- **Cross-major forcing**: An override that raises a package past its consumer's declared major (for example ajv's `fast-uri ^3` forced to 4.2.3) is not a safe simplification, even when the forced version is patched.
- **Advisory-scoped floors**: `minimatch` 3.x is outside GHSA-g3hv-75wg-m249's affected range (`>=7.0.0 <11.0.1`), so it must not be forced to 11.
- **Duplicates accepted**: Normal resolution may keep more than one copy of a dependency (for example Next's own postcss line). That is upstream's declared range, not a defect, and audit-clean.
- **Peer warnings**: `eslint-plugin-jsx-a11y` and `eslint-plugin-react` declare ESLint ≤9 peers while the repository installs ESLint 10. This pre-existing warning is unchanged and out of scope.

## Requirements

### Functional Requirements

- **FR-001**: Keep `@opennextjs/cloudflare` at 1.20.19; it is the latest published release.
- **FR-002**: Update `wrangler` from 4.166.0 to 4.168.0, the latest stable release that satisfies the adapter's `^4.148.0` peer range.
- **FR-003**: Reduce `pnpm.overrides` to the three Undici major floors (`undici@6` 6.29.1, `undici@7` 7.30.2, `undici@8` 8.13.1).
- **FR-004**: Remove the `glob@10` and `minimatch@10` overrides; with `glob 14.0.6` and `@typescript-eslint/typescript-estree` 8.74.0 no consumer selects glob 10/13 or minimatch 10.
- **FR-005**: Remove the `brace-expansion@1`, `brace-expansion@2` and parent-scoped `minimatch@…>brace-expansion` overrides; normal resolution selects patched 1.1.21 and 5.0.13, and the parent selectors referenced versions absent from the graph.
- **FR-006**: Remove the `proxy-addr`, `source-map-js`, `qs`, `fast-uri`, `sharp`, `vite`, `postcss` and `@vitest/mocker` overrides; each restated a direct dependency, was satisfied by normal resolution, or forced a version outside the consumer's declared range.
- **FR-007**: Update `@typescript-eslint/typescript-estree`, `@typescript-eslint/utils` and `@typescript-eslint/scope-manager` to 8.74.0 so the only minimatch-10 consumer resolves minimatch `^11.0.1` upstream.
- **FR-008**: Regenerate `pnpm-lock.yaml` with pnpm 10.30.3 and Node.js 26.x; the resolved graph must contain `glob 14.0.6`, no minimatch release in the affected range, and no dependency in an affected Undici release.
- **FR-009**: Update `__tests__/dependency-management.test.js` to encode the new override policy and the patched floors instead of the removed workarounds.
- **FR-010**: Do not change application code, `open-next.config.ts`, `wrangler.jsonc`, the compatibility date or flags, bindings, workflows, secrets, Cloudflare settings or production resources.
- **FR-011**: Run the focused guards, the full repository verification, the OpenNext build, the Wrangler build and the updater-scheduler dry-run, and measure the production build size.
- **FR-012**: Add the Spec 226 artifacts, point `.specify/feature.json` to them and update the affected Memory Bank facts.
- **FR-013**: Submit one regular, non-draft pull request against `main`; do not merge or deploy.

### Scope

The exact intended changed paths are:

- `.specify/feature.json`
- `__tests__/dependency-management.test.js`
- `memory-bank/activeContext.md`
- `memory-bank/progress.md`
- `memory-bank/techContext.md`
- `package.json`
- `pnpm-lock.yaml`
- `specs/226-cloudflare-dependency-modernization/plan.md`
- `specs/226-cloudflare-dependency-modernization/research.md`
- `specs/226-cloudflare-dependency-modernization/spec.md`
- `specs/226-cloudflare-dependency-modernization/tasks.md`

No other path is authorized.

## Success Criteria

### Measurable Outcomes

- **SC-001**: `pnpm.overrides` contains exactly the three Undici major floors.
- **SC-002**: The lockfile resolves `glob` only at 14.0.6 and `minimatch` only at 3.1.5 and 11.0.9.
- **SC-003**: `pnpm audit` reports zero advisories of any severity.
- **SC-004**: `wrangler` resolves at 4.168.0 with `workerd 1.20261123.1` and `miniflare 5.20261123.1-beta`, and the adapter's peer range is satisfied.
- **SC-005**: The focused guards, full verification, OpenNext build, Wrangler build and updater dry-run pass, and the production build is strictly below 495 MiB.
- **SC-006**: The final diff contains exactly the 11 listed paths.
- **SC-007**: One regular, non-draft PR is open against `main`; nothing is merged or deployed.

## Verification Record — 2026-11-27

| Check | Result |
| --- | --- |
| `pnpm audit` | PASS — 0 advisories, 999 dependencies. |
| `pnpm why` graph inspection | PASS — glob 14.0.6; minimatch 3.1.5/11.0.9; brace-expansion 1.1.21/5.0.13; undici 6.29.1/7.30.2/8.13.1. |
| Focused Vitest guards | PASS — 2 files, 15 tests. |
| Full verification (`SPEC_KIT_BASE_REF=2fe486e6 ./freebuff-verify.sh`) | PASS — frozen install, Spec Kit gate, 520 Python tests, TypeScript, 113 Vitest files / 1,272 tests, Next.js build, docs tests and the 495 MiB cap. |
| OpenNext build | PASS on `@opennextjs/cloudflare` 1.20.19 with Wrangler 4.168.0; `.open-next/worker.js` written and `BUILD_ID` matched the injected SHA. |
| Wrangler build and updater-scheduler dry-run | PASS — 8,893.61 KiB upload with all seven bindings; updater dry-run 7.87 KiB with no deploy; updater Node tests 17/17. |
| Production build size | PASS — 440,279,040 bytes (419.88 MiB), strictly below 495 MiB. |
| Playwright / Visual QA | NOT RUN locally — dependency-only diff; PR-triggered checks remain pending. |

## Assumptions

- 4.168.0 is the latest stable Wrangler and is within the adapter's supported peer range; the adapter itself has no newer release.
- Removing an override is safe only when normal resolution selects a supported version within every consumer's declared range, proven by the regenerated lockfile rather than by the absence of a warning.
- `pnpm audit` reflects the advisory database at the time of the run; the patched floors are additionally encoded in the unit guard.
- The production cap is the repository's hard 495 MiB limit, measured from a clean build.
- No deployment is part of this task.
