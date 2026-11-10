# Feature Specification: Freebuff Startup Command Runtime Verification

**Feature Branch**: `freebuff/33958ac019917e6d9cfec2d4`
**Created**: 2026-11-10
**Status**: Implemented
**Extends**: `specs/129-startup-command-verification` (corrected the command order and added the guards this task now exercises) and `specs/128-startup-readiness-verification` (added `scripts/verify-startup.sh`).

## Input

Owner request to verify the **newly installed** Freebuff startup command and demonstrate what it actually does, rather than assuming:

```bash
bash -lc 'bash scripts/verify-startup.sh && source scripts/bootstrap-pnpm.sh && CI=true pnpm install --frozen-lockfile && pnpm exec playwright cli --help'
```

The request fixes six expectations (governance checks, pnpm pin, frozen install, CI mode, Playwright CLI, execution order and failure short-circuiting) plus one distinction: the command is **expected** not to preload the four Memory Bank files; `AGENTS.md` is expected to carry the instruction that makes the agent read them.

## Verified baseline

- `HEAD` equals the fetched `main` tip `d09f945f` (PR #1802 merged), so the command, `README.md` and the guard test are the current tree, not a stale branch.
- `README.md` documents exactly the command quoted above as the Freebuff project-settings value; `__tests__/freebuff-startup-command.test.js` pins and executes that documented form.
- `scripts/verify-startup.sh` checks required files (existence, readability, non-emptiness), the `AGENTS.md` references, the four-file instruction, the `AGENTS.md` 65,536-byte budget and the `.docs/manifest.json` structure; it states it does not load context.
- `scripts/bootstrap-pnpm.sh` resolves `package.json#packageManager` (`pnpm@10.30.3`), accepts a matching `pnpm` from `PATH` or `$HOME/.local/bin`, otherwise installs that exact version with `npm install -g … --prefix "$HOME/.local"`, and exports the validated binary directory.
- Freebuff settings are stored outside the repository, so the string is verifiable as the provided/document value but the live setting itself is not readable by any repository or agent tool.

## User Scenarios & Testing

### User Story 1 — Every step is demonstrated, not assumed (Priority: P1)

The owner sees, for each expected behaviour, a real command result: exit status, output and, where relevant, an isolated fixture that forces the failure path.

**Acceptance Scenarios**:

1. Given the repository, when the installed command runs, then it exits 0 and its output shows the context check, the pnpm resolution, the frozen install and the Playwright help in that order.
2. Given `AGENTS.md` missing, empty or larger than 65,536 bytes, when the command runs, then it exits non-zero with a specific message and never reaches pnpm.
3. Given a bootstrap or install failure, when the command runs, then the later steps do not execute.

### User Story 2 — Playwright availability is stated precisely (Priority: P1)

`pnpm exec playwright cli --help` proves the local CLI resolves and prints help. It does not prove a browser launches, and the record must not claim otherwise.

### User Story 3 — Checked is not loaded (Priority: P2)

The startup command checks the four Memory Bank files; it does not put them in model context. `AGENTS.md` is the automatically injected channel and must keep the instruction to read them.

## Requirements

- **FR-001**: Verify each of the six expectations against executed evidence, and record each as VERIFIED, FAILED or NOT VERIFIED.
- **FR-002**: Prove failure short-circuiting for the context check, the bootstrap and the install with isolated fixtures, without modifying the working tree.
- **FR-003**: State that no browser was launched by the help command unless one actually was.
- **FR-004**: Confirm the Memory Bank files are checked, not preloaded, and that `AGENTS.md` §1 step 4 is the loading path.
- **FR-005**: Do not change `AGENTS.md`, application code, dependencies, workflows, integrations, deployment configuration or `.docs/`; change no script unless a verified defect is found.
- **FR-006**: Run `./freebuff-verify.sh`, the focused startup tests and a production build, and report the measured build size against the 495 MiB hard cap.
- **FR-007**: The Freebuff project setting remains an owner action; the report states what could and could not be verified about it.

## Success Criteria

- **SC-001**: Every expectation has a recorded command, exit status and relevant output.
- **SC-002**: The final diff is limited to this feature's artifacts and the task Memory Bank record, unless a real defect required a fix.
- **SC-003**: `./freebuff-verify.sh` passes and the measured build output stays strictly below 495 MiB.
- **SC-004**: The PR remains OPEN and UNMERGED with the full HEAD SHA reported.

## Assumptions

- The owner's quoted command is the value installed in Freebuff settings; the setting cannot be read from the repository.
- The 65,536-byte budget is a conservative ceiling for the Freebuff Cloud `AGENTS.md` injection, not a measured platform maximum.
