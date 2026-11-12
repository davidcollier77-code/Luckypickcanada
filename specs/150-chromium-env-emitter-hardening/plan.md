# Implementation Plan: Chromium Environment Emitter Hardening

**Feature**: `specs/150-chromium-env-emitter-hardening` · **Branch**: `freebuff/419f8aeeb3f6faf5ad52daa2` · **Date**: 2026-11-12

## Technical Context

| Item | Value |
| --- | --- |
| Language / runtime | Bash 5 generator, POSIX `sh` consumers (`~/.profile`), Node.js 26.x tests |
| Affected files | `scripts/setup-chromium-libs.sh`, `scripts/playwright-cli.sh`, `scripts/setup-playwright-agent.sh`, `__tests__/setup-chromium-env-shell-safety.test.js`, `__tests__/setup-chromium-runtime-detect.test.js`, `README.md`, Memory Bank |
| Unaffected | Dependencies, lockfile, workflows, application code, hosting, the startup command string |
| Verification | `bash -n`, focused vitest files, `sh -n` on generated output, `./freebuff-verify.sh` |

No dependency or platform change is involved. The generator already owns every value it prints, so the fix stays inside
it and the two consumers only gain a comment recording the invariant.

## Constitution Check

- **Smallest correct change**: one helper, one rewritten function, one profile line, three comments, tests, docs.
- **Preserved behaviour**: export names, ordering, the `LD_LIBRARY_PATH` dedupe, system-runtime silence, `--persist`
  artifacts, the wrapper contract and the documented startup command are all unchanged.
- **Protected areas**: security configuration is not weakened; no payment, data, authentication, hosting, deployment,
  secret or `AGENTS.md` change.
- **Build size**: no application or asset change; the 495 MiB cap is unaffected.
- **One feature directory**: all artifacts live under `specs/150-chromium-env-emitter-hardening/`.

## Phase 0 — Research

Not required. The investigation established the data flow and reachability: only the process environment (`HOME`,
`CHROMIUM_LIBS_PREFIX`, `PLAYWRIGHT_BROWSERS_PATH`, `CHROMIUM_BROWSER_DIRS`) reaches the emitter, and an inherited
`LD_LIBRARY_PATH`/`FONTCONFIG_*` is never copied into its output, so only generated literals need quoting.

## Phase 1 — Design

### FR-001 / FR-002 — quoting

1. Add `sh_squote`, which prints a value as one single-quoted word and writes a literal `'` as `'\''`.
2. `print_env`: assign `_lpc_library_path='<LIB_PATH>'`, run the dedupe `case` against `":$_lpc_library_path:"` — the
   expansion is quoted, so it is compared literally instead of becoming a glob — then `unset` it and export
   `LD_LIBRARY_PATH` from that variable.
3. Print `export FONTCONFIG_FILE=<quoted>`, `export FONTCONFIG_PATH=<quoted>` and
   `export PLAYWRIGHT_BROWSERS_PATH=<quoted>`.

Rejected: an allowlist that refuses unusual characters (would reject legitimate workspace paths and still needs the
quoting); `printf %q` (emits `$'…'`, which POSIX `sh` cannot read); emitting `KEY=VALUE` for a non-`eval` consumer
(changes the startup command, `env.sh` sourcing and the documented format for no additional safety).

### FR-003 — persistence

`--persist` prints `if [ -f <quoted> ]; then . <quoted>; fi`, so the block cannot execute a hostile path either.

### FR-006 — tests

`__tests__/setup-chromium-env-shell-safety.test.js` runs the generated text through real `bash`/`sh`, using a canary
file as the oracle, over four payloads (`$(…)`, backticks, `"`, `;`) in each of the four inputs, plus spaces,
apostrophes, POSIX parsing, idempotency, literal glob handling, and both `--persist` paths.

## Phase 2 — Verification

| Check | Command |
| --- | --- |
| Shell syntax | `bash -n scripts/*.sh` |
| Shell-safety suite | `pnpm exec vitest run __tests__/setup-chromium-env-shell-safety.test.js` |
| Detection suite | `pnpm exec vitest run __tests__/setup-chromium-runtime-detect.test.js` |
| Wrapper contract | `pnpm exec vitest run __tests__/playwright-cli-wrapper.test.js` |
| Real workspace | `bash scripts/setup-chromium-libs.sh --env` parsed by `sh -n` |
| Repository gate | `./freebuff-verify.sh` |

## Risks and Mitigations

- **Format drift for downstream readers**: the only readers are `eval` and `sh`; both read a quoted word identically.
  The one test that asserted the double-quoted form is updated, and nothing parses the text as data.
- **A path ending in `\` or containing a newline**: single quotes keep both literal, which the previous double-quoted
  form did not guarantee.
- **`set -u` in the wrapper**: the temporary variable is assigned before use and unset immediately.
