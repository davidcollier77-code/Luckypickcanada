# Tasks: Browser Visual Inspection Enablement (Investigation Only)

**Feature**: `specs/077-browser-visual-inspection-enablement`

## Phase 1 — Setup

- [x] T001 Read `AGENTS.md`, `.freebuff/freebuff.md`, `memory-bank/projectBrief.md` and `memory-bank/activeContext.md`; select the task groups (`troubleshooting`, `deep-dive`) and read their instructions.
- [x] T002 Confirm the branch, worktree and the absence of an existing open PR for this task; confirm no duplicate feature directory exists under `specs/`.

## Phase 2 — Foundational (sandbox capability audit, read-only)

- [x] T003 Record OS, architecture and identity, and prove root escalation is refused (`sudo` → `no new privileges`).
- [x] T004 Record the package-manager situation (`apt` present, package lists unavailable, no root) and the Node/npm/pnpm/corepack state against `engines.node` and `.nvrc`.
- [x] T005 Prove that no browser engine is available: no `node_modules`, no `~/.cache/ms-playwright`, no `chromium`/`chromium-browser`/`google-chrome` on `PATH`, nothing browser-like under `/opt`.
- [x] T006 Prove the Chromium runtime dependency stack is absent with `dpkg -l` (package set) and `ldconfig -p` (shared objects), and record the few graphics libraries that are present.
- [x] T007 Record that resources and egress are **not** the constraint: `/dev/shm` 2.0 GiB, 8 vCPU, 15 GiB RAM, `registry.npmjs.org` 200, `cdn.playwright.dev` reachable, `https://luckypickcanada.ca/` 200, and that no display server exists.

## Phase 3 — User Story 1 (what is missing)

- [x] T008 [US1] Verify the repository's browser configuration is already complete (`playwright.config.ts` projects, viewports, `testDir`, `webServer`) and that `@playwright/test`/`playwright`/`playwright-chromium` are already pinned.
- [x] T009 [US1] Verify the CI browser path in `.github/workflows/visual-qa.yml` (`playwright install --with-deps chromium`, test run, artifact upload) and its Node 22 / pnpm 10.30.3 pins.
- [x] T010 [US1] Corroborate the blocker against the repository's recorded history (specs 041 research, 061, 064, 066, and the 074–076 memory-bank entries) without treating memory as primary evidence.

## Phase 4 — User Story 2 (minimum permissions)

- [x] T011 [US2] Map each blocked step to the minimum authorization that unblocks it, with reason, required/optional status, and explicit excluded scope.
- [x] T012 [US2] State what is explicitly not needed so the owner does not grant more than necessary (display server, GPU, new dependency, deployment or secret access).
- [x] T013 [US2] Record the alternative browser paths (CI artifacts, owner-visible preview, hand-extracted libraries, hosted rendering) and what each can and cannot prove.

## Phase 5 — User Story 3 (nothing changed without approval)

- [x] T014 [US3] Make no installation, permission, configuration, website or application change. The only additions are Spec Kit artifacts, the memory-bank context note and the PR summary.
- [x] T015 [US3] Leave the PR open and unmerged for owner review, and present the permission request for approval rather than acting on it.

## Phase 6 — Verification

- [x] T016 Run `./freebuff-verify.sh` with `pnpm` and record the exact result; measure the production build size against the 495 MB maximum. **PASS** — `VERIFY_EXIT=0`: Spec Kit governance gate tests passed, all three changed artifacts verified, TypeScript and the Next.js production build completed, refresh-docs tests `19 passed, 0 failed`; `.next` measured `298,744,105` bytes / `284.90 MiB` (limit 495 MB).
- [x] T017 Audit the complete final diff and confirm it matches the reported files.
- [x] T018 Record the task, task groups, documents reviewed, verification results, remaining limitations and `USEFUL RESULT` in the single PR summary.

## Dependencies

- T003–T007 block the root-cause statement in T011.
- T008 and T009 must be read before T011 so the permission request does not ask for a repository change
  that is unnecessary.
- T016 runs after the artifacts exist (the Spec Kit gate resolves the changed feature directory);
  T017 and T018 run last.

## Implementation Strategy

Read-only audit first, in the order sandbox → browser runtime → repository configuration → history.
Then convert the gap into a minimum permission request and record every alternative that was
considered and not adopted. Verify with the repository gate, audit the diff, and publish the single
PR summary without enabling anything.
