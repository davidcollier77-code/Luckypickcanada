# Luckypick Node.js 26 + pnpm Bootstrap — v2.1.0

Standalone, non-privileged Bash bootstrap for a Linux user environment. It installs
Node.js 26 side-by-side with an existing Node.js 22 NVM installation, installs
exactly pnpm 10.30.3, and activates Node 26 in the user's login and interactive
Bash shells.

This is the README for `startup.sh`; it does not replace the Luckypick Canada
website README.

## At a glance

| Item | Value |
| --- | --- |
| Script version | `2.1.0` |
| Default Node.js target | `26.13.1` |
| pnpm version | `10.30.3` |
| Script size | 1,815 lines, 58,794 bytes |
| SHA-256 | `811a048470944199131a910a7eb67491709bc267c8ec0a09dc46b35bd5a8377f` |
| Verification | 33/33 regression cases, 152/152 assertions, `bash -n` passes |

## Requirements

- Linux with Bash. The verified run used the sandbox's Bash 5.x.
- An existing NVM installation, owned and writable by the current user.
- A usable Node.js 22.x baseline, **or** an already-active Node.js 26.x matching
  the requested target.
- `libatomic.so.1` for Node.js 26.
- Standard command-line tools: `bash`, `awk`, `sed`, `grep`, `cmp`, `sort`,
  `tail`, `df`, `mktemp`, `stat`, `dirname`, `readlink`, `sha256sum`, `head`,
  `cat`, `cp`, `mv`, `rm`, `chmod`, `mkdir`, `tr`, `date`, `touch`, and `uname`.
- Network access if NVM or npm needs to download Node.js or pnpm. A cached
  install can proceed without a new download.

The script does **not** use `sudo`, install system packages, or write to `/etc`.

## Usage

```bash
# Diagnostics only: no changes, no network
bash startup.sh
bash startup.sh --check-only

# Full install: Node 26 + pnpm 10.30.3 + Bash activation
bash startup.sh --install
bash startup.sh --install-node

# Install or verify pnpm only, into an existing Node 26
bash startup.sh --install-pnpm

# Undo everything recorded by this script
bash startup.sh --rollback

# Print an eval-able activation line for the current shell
eval "$(bash startup.sh --print-env)"

# Help and version
bash startup.sh --help
bash startup.sh --version
```

Run `--check-only` first. It reports the detected NVM, Node.js, pnpm, shell,
storage, startup-file safety, and environment blockers without changing anything.

## Capabilities

- **Side-by-side Node.js install.** Uses the existing NVM installation and
  installs the requested Node.js 26.x version without removing or replacing the
  Node.js 22 baseline.
- **Exact pnpm pin.** Installs pnpm `10.30.3` into the Node 26 prefix with npm,
  verifies the reported version, and verifies that `pnpm` resolves inside that
  prefix.
- **Bash activation.** Adds a clearly marked managed block to the login file Bash
  will actually read (`.bash_profile`, `.bash_login`, or `.profile`) and to
  `.bashrc`. Existing content is preserved.
- **Preflight checks.** Detects NVM, Node.js, pnpm, `libatomic`, disk space,
  startup-file safety, shell type, ownership, write permissions, and legacy
  system-wide activation before making changes.
- **Journaled changes.** Records state before mutating startup files or installing
  packages. The journal supports recovery after a failure, interruption, or
  killed run.
- **Rollback.** Restores startup files from backups or removes the managed block,
  removes Node.js and pnpm only when this script created them, verifies the
  original Node.js, and retains the state directory with status `rolled-back`.
- **Idempotence.** A second `--install` recognizes a complete, verified install
  and makes no changes. A second `--rollback` is a no-op.
- **Safe startup-file handling.** Refuses symlinks, non-regular files, files not
  owned by the user, unwritable files, unsafe parent directories, and incomplete
  or foreign managed markers.
- **State protection.** Refuses a state path that is a symlink or not owned by the
  user, and uses a lock to prevent concurrent runs.
- **Portable fallbacks.** Uses a lock-directory fallback when `flock` is not
  available, runs without an enforced timeout when `timeout` is missing, and
  falls back to file-path detection when `ldconfig` is unavailable.
- **No NVM alias change.** The NVM default alias is recorded and checked; the
  script warns if it changed but does not change it itself.
- **No repository changes.** The script does not install project dependencies or
  modify repository files.

## Activation behavior

Login and interactive Bash shells read the managed startup block and use Node.js
26. A bare non-login, non-interactive `bash -c` shell does not read startup files,
so it may continue to use the baseline Node.js. This is measured and reported
honestly.

For scripts and non-login shells, use:

```bash
eval "$(bash startup.sh --print-env)"
node --version
pnpm --version
```

Only Bash startup files are modified. If the login shell is `zsh`, the script
warns and does not modify zsh files.

## Safety model

- The state directory defaults to
  `~/.local/state/luckypick-node` (or
  `${XDG_STATE_HOME:-$HOME/.local/state}/luckypick-node`).
- Startup files are backed up before modification, and the managed block is
  syntax-checked after writing.
- A failed write triggers compensation and restores the original startup files.
- Rollback refuses to remove Node.js 26 if the recorded original Node.js is
  missing or does not run. The state is kept for inspection in that case.
- Existing Node.js 26 is reused rather than reinstalled. Existing pnpm is used
  only when it is exactly `10.30.3`; a different pnpm is refused.
- A legacy system-wide activation file at
  `/etc/profile.d/zz-luckypick-node.sh` is never modified. If it contains
  Node 26 or Luckypick activation, the script stops and asks the owner to remove
  it manually.

## Limitations

- **Bash only.** It does not configure zsh, fish, or other shells.
- **Bare `bash -c` is not activated.** Use `--print-env` for non-login,
  non-interactive shells.
- **Node.js 22 baseline required.** A full install refuses to proceed without a
  usable existing Node.js to fall back to, unless the active runtime is already
  the requested Node.js 26.
- **Existing NVM required.** It does not install or bootstrap NVM itself.
- **No system package installation.** It cannot install `libatomic1` or any
  other system dependency. A missing `libatomic.so.1` is a hard blocker.
- **Fixed pnpm version.** It manages only pnpm `10.30.3` and refuses to replace a
  different existing pnpm automatically.
- **No arbitrary reconfiguration.** The script manages a specific startup block,
  Node.js 26, and pnpm; it does not manage other shell configuration, project
  dependencies, global npm packages, or the NVM default alias.
- **Linux assumptions.** It relies on Linux/POSIX tools and paths such as
  `/etc/os-release`, `ldconfig`, `df`, and `stat`. It is not a macOS or Windows
  installer.
- **Network and timeout caveats.** NVM/npm may need network access. If `timeout`
  is unavailable, installs run without an enforced timeout. If an install is
  killed, `--rollback` uses the journal to clean up what it can.
- **Local verification scope.** The script was regression-tested in a Linux
  sandbox; it was not run against a live ChatGPT environment or a real user's NVM
  installation. Run `--check-only` and then `--install` in the target environment.
- **State is retained after rollback.** A `rolled-back` state directory remains
  for inspection; it is not deleted automatically.

## Environment variables

| Variable | Meaning | Default |
| --- | --- | --- |
| `NVM_DIR` | NVM installation directory | Auto-detect `/opt/nvm`, `/usr/local/nvm`, or `~/.nvm` |
| `LUCKYPICK_NODE_VERSION` | Exact Node.js 26 version | `26.13.1` |
| `LUCKYPICK_STATE_DIR` | Recovery state directory | `~/.local/state/luckypick-node` |
| `LUCKYPICK_INSTALL_TIMEOUT` | NVM install timeout in seconds | `600` |
| `LUCKYPICK_PNPM_TIMEOUT` | pnpm install timeout in seconds | `300` |

## Verification

The supplied `startup.sh` is the exact tested file:

- 1,815 lines, 58,794 bytes
- SHA-256 `811a048470944199131a910a7eb67491709bc267c8ec0a09dc46b35bd5a8377f`
- `bash -n` passes
- All 33 regression cases passed
- 152 assertions passed, 0 failed
- `git status --porcelain` was empty; no repository files were changed

The live ChatGPT environment was not available and was not modified.
