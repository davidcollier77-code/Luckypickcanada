# Feature Specification: Freebuff Startup Command and Memory Bank Availability

**Feature Branch**: `freebuff/2c75b8a266dccd2efd39936d`
**Created**: 2026-11-10
**Status**: Implemented
**Replaces/extends**: `specs/128-startup-readiness-verification` (adds the startup verifier) and the startup-command
audit in `specs/091-freebuff-startup-command` (established the tested shell form).

## Input

Owner-authorised request to verify the current Freebuff startup command and its related startup scripts, establish
whether the four Memory Bank files are genuinely made available to Freebuff early in startup or merely checked,
correct the ordering or missing steps that prevent the intended behaviour, and report the exact replacement
command for Freebuff project settings. No `AGENTS.md`/`Agent.md` command segment may be added and `AGENTS.md`
governance must be preserved.

## Verified baseline (before any change)

- Live startup command under review:
  `bash -lc 'source scripts/bootstrap-pnpm.sh && pnpm install --frozen-lockfile && pnpm exec playwright cli --help && bash scripts/verify-startup.sh'`
- It exits 0 in this workspace in 7 s and leaves `package.json` and `pnpm-lock.yaml` unchanged.
- `README.md` documented a **different, shorter** command
  (`bash -c 'source scripts/bootstrap-pnpm.sh && CI=true pnpm install --frozen-lockfile'`) and
  `__tests__/freebuff-startup-command.test.js` pinned only that stale form, so the live command had drifted out of
  the guarded documentation.
- `scripts/verify-startup.sh` checks existence, readability, non-emptiness, the `AGENTS.md` references, and the
  manifest structure. It does not read content into any model context; it says so itself.
- Freebuff injects only the project-root `AGENTS.md` (or `CLAUDE.md`) into the agent context (observed directly in
  this session: `AGENTS.md` arrived as project instructions, and the four Memory Bank files still required explicit
  reads). Startup-command terminal output is not injected. Freebuff Cloud reads `AGENTS.md` up to about 64 KiB.
- `bash -lc` is load-bearing for tool discovery: with a minimal `PATH` and no login profile, `node`/`npm` are not
  resolvable (`bash -c` → not found); with the login profile they resolve from the image's nvm directory.
- `pnpm exec playwright cli --help` is a real repository-local command (exit 0, prints the Playwright agent CLI
  help); it launches no browser.
- Because every segment is chained with `&&`, the context check ran **last** and was skipped entirely whenever the
  install or the Playwright check failed.

## User Scenarios & Testing

### User Story 1 — The startup log reports context availability first (Priority: P1)

An agent or owner opening a fresh workspace sees whether `AGENTS.md`, the four Memory Bank files and
`.docs/manifest.json` are usable **before** any dependency work runs, and a broken install can no longer hide that
answer.

**Independent Test**: Run the corrected command with a deliberately failing install step; the context check result
must already be visible.

**Acceptance Scenarios**:

1. Given a complete checkout, when the startup command runs, then the startup check output appears before the
   bootstrap output.
2. Given a failing later step, when the startup command runs, then the startup check has already reported its
   result.
3. Given a missing or empty Memory Bank file, when the startup command runs, then it stops before the install with a
   non-zero exit and names the file.

### User Story 2 — The documented command is the command that is guarded (Priority: P1)

The single command documented in `README.md` is the exact value for Freebuff project settings, and a committed test
executes that documented command's real shape so documentation cannot drift from the live setting again.

**Independent Test**: Run `pnpm exec vitest run __tests__/freebuff-startup-command.test.js`; it must execute the
documented command in an isolated fixture and fail on any edit to a foreign form.

**Acceptance Scenarios**:

1. Given the repository, when the guard test runs, then exactly one startup command is documented and it equals the
   tested form including the startup check, the pinned bootstrap, `CI=true`, the frozen install and the Playwright
   CLI check.
2. Given the documented command executed in the fixture, then the startup check runs first, the installed `pnpm`
   receives `install --frozen-lockfile` with `CI=true` and then `exec playwright cli --help`, under both Bash and a
   POSIX `sh` outer shell.
3. Given the rejected `bash scripts/bootstrap-pnpm.sh && …` form, then it still fails with 127 and no install.

### User Story 3 — The loading limit is guarded, not assumed (Priority: P2)

The only automatic context channel is `AGENTS.md`; its size budget is checked so the instruction that makes the
agent read the Memory Bank cannot be silently truncated.

**Independent Test**: Append bytes past the documented budget in a disposable copy and run the startup check; it
fails with an explicit message.

**Acceptance Scenarios**:

1. Given `AGENTS.md` at its current size (~31.7 KB), the startup check passes and reports the measured size.
2. Given an `AGENTS.md` larger than 64 KiB, the startup check fails and explains the truncation risk.

## Edge Cases

- Startup output is not model context: neither the check nor the documentation may claim the files are loaded.
- A login profile could change the working directory; the command's relative paths assume the project root, which
  is where Freebuff runs the startup command.
- `pnpm` missing, lockfile drift, or a failing Playwright CLI must still stop the command, but only after the
  context result is reported.
- The four Memory Bank files must remain readable individually; concatenating them into `AGENTS.md` is not an
  approved change and is not part of this feature.

## Requirements

- **FR-001**: The startup check MUST run before the pnpm bootstrap, the install and the Playwright check.
- **FR-002**: The command MUST keep the tested shell form that carries the bootstrap `PATH` export into the install
  (`source` inside one explicit login Bash process) and MUST keep `CI=true` on the install.
- **FR-003**: The Playwright repository-local CLI check MUST be preserved and documented.
- **FR-004**: `README.md` MUST document exactly one startup command equal to the tested form, stated as the value to
  paste into Freebuff project settings, and MUST state that the four Memory Bank files are checked, not preloaded,
  and that `AGENTS.md` is the auto-loaded channel.
- **FR-005**: The guard test MUST execute the documented command and fail on any other form or ordering.
- **FR-006**: `scripts/verify-startup.sh` MUST keep every existing check and MUST fail when `AGENTS.md` exceeds the
  documented ~64 KiB project-instructions budget.
- **FR-007**: No `AGENTS.md`, `Agent.md` or governance change, no application code, UI, asset, dependency,
  workflow, integration, deployment or `.docs/` content change.
- **FR-008**: The Freebuff project setting itself remains an owner action; this feature documents the exact value.

## Success Criteria

- **SC-001**: The corrected command exits 0 in this workspace and prints the startup check before the bootstrap.
- **SC-002**: The guard test passes on the delivered tree and fails when the documented command is edited to a
  foreign form.
- **SC-003**: Missing, empty or oversized context inputs fail the startup check with a specific message.
- **SC-004**: `./freebuff-verify.sh` passes and the measured production build stays below 495 MiB.
- **SC-005**: The final diff is limited to the startup check, `README.md`, the guard test, this feature's artifacts
  and the Memory Bank task record.

## Assumptions

- Freebuff runs the startup command in the project root, which the existing command already relies on.
- The 64 KiB `AGENTS.md` budget applies to Freebuff Cloud project instructions; the guard is a conservative
  ceiling, not a promise that no other limit exists.
- Genuine automatic preloading of arbitrary Memory Bank files is not a supported startup-command capability, so the
  supported approach remains `AGENTS.md` §1 step 4 plus the agent's own reads.
