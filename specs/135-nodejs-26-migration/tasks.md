# Tasks: Node.js 26 Migration

**Input**: Design documents from `specs/135-nodejs-26-migration/`

## Phase 1: Setup and baseline

- [X] T001 Confirm the current Node.js 22 references, installed dependency engine ranges, deployment workflows, and build commands; record a pre-change production build baseline.
- [X] T002 Create the Spec Kit artifacts and point `.specify/feature.json` at this feature.

## Phase 2: Runtime declarations

- [X] T003 [US1] Set `package.json#engines.node` to `26.x` and `.nvmrc` to `26`.
- [X] T004 [P] [US1] Update `node-version` and step labels to 26 in `.github/workflows/deploy-open-next.yml`, `.github/workflows/validate-open-next-repair.yml`, `.github/workflows/visual-qa.yml`, `.github/workflows/deploy-updater-scheduler.yml`, `.github/workflows/update-spec-kit.yml`, and `.github/workflows/refresh-docs.yml`.
- [X] T005 [P] [US1] Update `scripts/setup-playwright-agent.sh` to accept Node.js 26 and report the correct requirement.
- [X] T006 [P] [US1] Update `workers/updater-scheduler/package.json` and `workers/updater-scheduler/README.md` to Node.js 26.

## Phase 3: Documentation and guard consistency

- [X] T007 [P] [US1] Update the workflow step-name assertion in `__tests__/visual-qa-chromium-cache.test.js`.
- [X] T008 [P] [US1] Record Node.js 26.x in `memory-bank/techContext.md` and the current task in `memory-bank/activeContext.md`.
- [X] T009 [US1] Search for remaining active Node.js 22 references and update only those that must move; leave historical `specs/` and `artifacts/` records unchanged.

## Phase 4: Verification and reporting

- [X] T010 [US3] Run the updater-scheduler `node --test`, `pnpm exec tsc --noEmit`, the full Vitest suite, and focused workflow/tooling tests.
- [X] T011 [US3] Run `./freebuff-verify.sh` and record the production build size of `.next` + `public` against the 495 MiB cap.
- [X] T012 [US3] Run `pnpm exec opennextjs-cloudflare build`, verify `.open-next/worker.js` and `.open-next/assets`, and measure the OpenNext output against the cap.
- [X] T013 [US2] Audit the complete diff to confirm no dependency, application, visual, integration, secret, binding, or deployment-trigger change.
- [X] T014 [US2] Update the Memory Bank progress record and report exact verification results, unresolved risks, and whether a PR was requested; do not deploy.
