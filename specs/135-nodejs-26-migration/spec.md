# Feature Specification: Node.js 26 Migration

**Feature Branch**: `freebuff/261525f05a3f083e00c056f2`

**Created**: 2026-11-11

**Status**: In progress

**Input**: Migrate the repository's declared and CI Node.js runtime from 22 to 26, keep every existing dependency, integration, deployment path, and user-facing behaviour unchanged, and verify the production and Cloudflare/OpenNext builds remain below the 495 MiB cap.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Consistent Node.js 26 runtime (Priority: P1)

A contributor or automation job installs the project and runs it with Node.js 26 without an engine mismatch warning. Node.js 26 is the declared runtime in local version files, package metadata, CI workflows, and repository tooling.

**Independent Test**: Run `node --version`, read `package.json`, `.nvmrc`, and every workflow's setup-node step; install and run the verification commands with Node.js 26.

**Acceptance Scenarios**:

1. **Given** a fresh checkout on Node.js 26, **When** dependencies are installed, **Then** pnpm reports no unsupported-engine warning for the root package.
2. **Given** a CI workflow that sets up Node.js, **When** the workflow runs, **Then** it requests Node.js 26 and no workflow still requests Node.js 22.
3. **Given** the repository-local Playwright setup script, **When** it runs on Node.js 26, **Then** it accepts the runtime; on another major version it fails with an accurate message.

### User Story 2 - Unchanged application and integrations (Priority: P1)

A visitor sees exactly the same website, and Cloudflare, Neon, Stripe, Resend, and Turnstile continue to be used exactly as before. No dependency, application, visual, or hosting behaviour changes.

**Independent Test**: Review the complete diff for non-version changes and run the existing unit, type, production build, and Cloudflare/OpenNext build checks.

### User Story 3 - Builds stay under the size cap (Priority: P1)

The production build and the Cloudflare/OpenNext build succeed on Node.js 26 and remain strictly below 495 MiB.

**Independent Test**: Measure `.next` + `public` after the production build and measure `.open-next` after the OpenNext build.

## Requirements *(mandatory)*

- **FR-001**: Declare Node.js 26 in `package.json#engines` and `.nvmrc`.
- **FR-002**: Every GitHub Actions workflow that configures Node.js MUST use Node.js 26; pinned action SHAs, step order, and workflow behaviour otherwise remain unchanged.
- **FR-003**: Repository-local tooling that checks or documents the Node.js major version MUST accept 26.
- **FR-004**: The standalone updater-scheduler package and its documentation MUST reflect the Node.js 26 requirement.
- **FR-005**: The Memory Bank technical context MUST record Node.js 26.x.
- **FR-006**: Do not upgrade, downgrade, add, or remove dependencies; do not change the lockfile.
- **FR-007**: Do not change application code, visual output, animations, functionality, environment variable names, secrets, Stripe, Neon, Resend, Turnstile, Cloudflare bindings, deployment triggers, or the OpenNext/Cloudflare deployment path.
- **FR-008**: Historical Spec Kit and artifact records that mention Node.js 22 remain unchanged as historical evidence.
- **FR-009**: Type checking, the Vitest suite, repository verification, the production build, and the Cloudflare/OpenNext build MUST pass on Node.js 26.
- **FR-010**: The measured production build (` .next` + `public`) and the OpenNext output MUST remain strictly below 495 MiB.

## Key Entities

- **Node runtime declaration**: `package.json#engines.node`, `.nvmrc`, and the updater-scheduler package engine.
- **CI Node setup**: the setup-node step in each GitHub Actions workflow.
- **Build size measurement**: byte counts for `.next` + `public` and `.open-next`.

## Success Criteria *(mandatory)*

- **SC-001**: No active configuration, workflow, or repository script still requires Node.js 22.
- **SC-002**: Installation on Node.js 26 produces no engine mismatch for the project.
- **SC-003**: The complete diff is limited to Node.js 26 version declarations, related test expectations, documentation, and Spec Kit artifacts.
- **SC-004**: Existing tests, type checking, and repository verification pass.
- **SC-005**: Production and Cloudflare/OpenNext builds succeed and both measured outputs are below 495 MiB.

## Assumptions

- Node.js 26 is the intended Long Term Support runtime and is available to `actions/setup-node` on GitHub-hosted runners.
- The Cloudflare Workers runtime is unaffected by the local build runtime; `nodejs_compat` and the existing compatibility date remain appropriate and unchanged.
- Historical `specs/` and `artifacts/` records are not rewritten.
