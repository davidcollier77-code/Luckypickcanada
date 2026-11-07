# Implementation Plan: Freebuff Startup Command and pnpm Dependency Management

**Branch**: `freebuff/e1fafb4e1fc110d0b8a4c277` | **Date**: 2026-11-04 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/091-freebuff-startup-command/spec.md`

## Summary

Make the repository verification gate bootstrap its own pinned toolchain (pnpm 10.30.3 into `$HOME/.local`,
then `pnpm install --frozen-lockfile`), invoke the local TypeScript compiler explicitly, add a weekly `npm`
Dependabot entry for the pnpm-managed JavaScript dependencies while keeping the weekly `github-actions` entry,
pin React and React DOM to the 19.3.1 the lockfile already resolves, and collapse the duplicate override lists
into the single `pnpm.overrides` field pnpm actually reads — with a committed guard that fails when any of those
four properties drifts.

## Technical Context

**Language/Version**: Node.js 22.x per `engines` (workspace runs Node 26.13.0), JavaScript + TypeScript 5.9.3

**Primary Dependencies**: pnpm 10.30.3 (`packageManager`), Next.js 16.4.3, React/React DOM 19.3.1, Vitest 5

**Storage**: N/A — no data model, API or storage surface is touched

**Testing**: `pnpm exec vitest run __tests__/dependency-management.test.js`; full `pnpm exec vitest run`;
`pnpm exec tsc --noEmit`; `./freebuff-verify.sh`; `pnpm install --frozen-lockfile`; `pnpm list react react-dom`

**Target Platform**: Web application unchanged; this work touches build/verification metadata only

**Project Type**: Next.js App Router application on Cloudflare via OpenNext

**Performance Goals**: No runtime change. The gate's new bootstrap adds ~5 s when the tree already matches the
lockfile (measured 4.8–4.9 s) and one pnpm download only on a fresh workspace.

**Constraints**: 495 MB build ceiling; pnpm 10.30.3 and `pnpm-lock.yaml` are the only package manager and
lockfile; no dependency upgrades; no second committed lockfile; `.docs/` read-only; `package.json` and
`pnpm-lock.yaml` are protected files requiring the owner's authorization gate at merge.

**Scale/Scope**: Four metadata surfaces (`package.json`, `pnpm-lock.yaml`, `.github/dependabot.yml`,
`freebuff-verify.sh`), one new bootstrap script, one new guard test, one feature artifact set.

## Constitution Check

*GATE: Must pass before implementation.*

- **Single source of truth** — overrides move into the field pnpm reads and the repository keeps exactly one
  package manager pin and one lockfile; `AGENTS.md` is unchanged — PASS.
- **Verify before acting** — the baseline was measured (pnpm version, frozen install, resolved React versions,
  the lockfile's `overrides:` block proving the top-level list was ignored, the gate's first failing command
  on a fresh workspace) before any edit — PASS.
- **Smallest correct change** — one manifest edit, a five-line lockfile diff, one Dependabot entry, two lines of
  gate hardening, one small bootstrap script and one guard test; no application code — PASS.
- **Protect core systems** — no Stripe, Resend, Neon, Turnstile, Cloudflare deployment, secret or API route is
  touched; the curated lockfile peer metadata is preserved rather than regenerated — PASS.
- **Resource conservation** — `.docs/` untouched, no new dependency, no Context7 invocation, no second lockfile —
  PASS.
- **Testing** — each requirement is checked by an executed command (guard test, frozen install, vitest, tsc,
  gate, build-size measurement, deliberate-failure checks) rather than inspection alone — PASS.

## Project Structure

### Documentation (this feature)

```text
specs/091-freebuff-startup-command/
├── spec.md
├── plan.md
├── tasks.md
└── checklists/requirements.md
```

### Source Code (repository root)

```text
package.json                              # react/react-dom 19.3.1; single pnpm.overrides list (adds postcss)
pnpm-lock.yaml                            # overrides + importer specifiers for the pins; curated peers preserved
.github/dependabot.yml                    # adds weekly npm ecosystem, keeps weekly github-actions
freebuff-verify.sh                        # bootstraps the pinned pnpm, frozen install, explicit pnpm exec tsc
scripts/bootstrap-pnpm.sh                 # NEW: provision/export the pinned pnpm for the gate and startup path
__tests__/dependency-management.test.js   # NEW: guard for pins, single overrides list, lockfile and Dependabot
.specify/feature.json                     # points at this feature (git-ignored local pointer)
```

**Structure Decision**: Single Next.js application; no `app/` source file, route, asset or configuration file
outside the dependency/verification metadata listed above is modified.

## Phase 0: Research

No external research was required. The decisions were settled from repository evidence: the lockfile's
`overrides:` block (proof pnpm ignores the top-level list), `memory-bank/activeContext.md`; the recurring
`--prefix "$HOME/.local"` requirement for pnpm in this image; `.github/workflows/protected-files.yml` and
`.github/CODEOWNERS` for the merge gate; and a measured `pnpm install` regeneration showing that a full sync would
rewrite ~30 hand-curated peer ranges, which is why the lockfile diff was minimised to the intended entries and
re-verified with `--frozen-lockfile`.

## Phase 1: Design artifacts

`data-model.md`, `contracts/` and `quickstart.md` are intentionally omitted: there is no entity, external
interface or manual scenario in this change beyond the executed commands recorded in `tasks.md`.

## Complexity Tracking

No constitution violations; no complexity justification required.

## Follow-up plan — PR-head QA repair

The first live PR-head CI run supplied concrete evidence of two failures: Visual QA stopped on an unterminated string in the dependency guard, and updater-scheduler verification stopped with exit 126 because `freebuff-verify.sh` was committed as mode `100644` despite being invoked directly. The bootstrap failure helper also used `exit 1` while sourced, which does not meet the requested caller-safe behaviour.

Implementation stays within this existing feature:

1. Replace the malformed lockfile and Dependabot helpers with exact-key and bounded-block parsers.
2. Refactor bootstrap work into a function, capture its status, then return when sourced or exit when directly executed. Every failure path stops before npm can be called.
3. Add isolated shell regression tests with temporary manifests and a fake npm installer; these tests need no network or real package installation.
4. Commit `freebuff-verify.sh` and `scripts/bootstrap-pnpm.sh` with executable mode so QA and updater workflows can invoke them from a clean checkout.
5. Re-run focused tests, the full suite, typecheck, repository verification, and current-head Visual QA/updater-scheduler workflows. Keep the Dependabot weekly npm and GitHub Actions configuration unchanged.

No Bun lockfile, second package manager, dependency upgrade, app change, credential change, scheduler activation, production deployment, or live platform startup-command change is part of this repair.
## Visual QA follow-up — baseline correctness

The failing desktop capture is not evidence of a new production visual defect. The expected desktop baseline was last updated on 2026-10-23, before PR #1709 consolidated the hero navigation on 2026-11-04. The test report records a stable current capture with the four-link approved navigation; both mobile viewport snapshots already pass. Refresh only `tests/visual/__screenshots__/desktop/homepage-viewport.png` from the current branch's deterministic capture (the test hides only the animated shimmer overlay). Keep `maxDiffPixelRatio: 0.007`; do not raise the threshold, mask the navigation, or mask the hero artwork.

Separately, remove the unsupported bare `priority` prop from the Lucky Map's native `<img>`. Preserve its `loading="eager"`, `fetchPriority="high"`, AVIF and WebP sources, and PNG fallback. Add a focused source guard to prevent the invalid prop from returning.

## Final review-driven verification gate repair

The latest reviewer pass exposed defects in the previous correction commit itself. Keep this follow-up confined to the verification entry point, pnpm bootstrap, their regression tests, and this feature's existing records.

1. In `freebuff-verify.sh`, use one guarded invocation for each required command. Remove the duplicate TypeScript/build invocations and make the refresh-docs branch emit an error and exit non-zero on failure. The script is invoked directly by repository workflows, so its failure paths use `exit 1`.
2. In `scripts/bootstrap-pnpm.sh`, keep all temporary values local to one short-lived function. Remove the function before returning or exiting so sourcing the file does not pollute the caller. Avoid a global status variable. Validate that the resolved pnpm executable comes from an absolute directory before prepending that directory to PATH; do not add the current working directory or an empty PATH segment.
3. Extend the isolated fake-installer tests so the expected version is derived from each fixture's `packageManager` value. Verify the exact installed version and that `command -v pnpm` plus `pnpm --version` work in the same shell after sourcing. Cover invalid pins, installer failure, caller survival, and helper cleanup.
4. Add focused regression checks for exactly-once verification commands and refresh-docs fail-closed control flow. Make lockfile override parsing explicit about malformed/missing blocks and test quoted scalars and prefix-colliding dependency keys.
5. Run focused and full unit tests, TypeScript, the full repository verification gate, measured build size, full Visual QA, and updater-scheduler CI on the resulting PR head. Do not claim those checks pass until their results are observed.

No dependency, lockfile, application, payment, email, database, image, artwork, deployment, or scheduler behavior change is required. No new package is required.

6. Make the PATH update idempotent: if the canonical pnpm binary directory already appears as a complete PATH element, leave PATH unchanged. Add an isolated same-shell test that sources the bootstrap twice and compares PATH byte-for-byte.

## Startup-command execution audit (2026-11-07)

**Scope**: the platform-side Freebuff startup command. It is stored in Freebuff project settings, outside this
repository, so this stage produces evidence plus one recommendation and changes no platform setting.

### Research

1. Read `package.json` (`packageManager: pnpm@10.30.3`, `engines.node: 22.x`), `pnpm-lock.yaml`
   (`lockfileVersion 9.0`) and `scripts/bootstrap-pnpm.sh` (bashisms, `export PATH`, sourced-vs-executed exit
   handling).
2. Establish the runtime shell empirically: `SHELL=/bin/bash`, login shell `/bin/bash`, GNU Bash 5.2.21,
   `/bin/sh` → `dash`, `sh -c 'source …'` → 127, `bash -c 'source …'` → 0. The Freebuff runtime also documents
   Bash as its command shell on every OS.
3. Build `artifacts/freebuff-startup-audit/probe.sh` to run each candidate in a controlled `env` (own `HOME`,
   own `PATH`, shared pnpm store) so the outcomes are executed facts, not reasoning.

### Design decision

Recommend `bash -c 'source scripts/bootstrap-pnpm.sh && CI=true pnpm install --frozen-lockfile'`:

| Property | current (`bash script`) | proposed (`source`) | recommended (`bash -c 'source …'`) |
| --- | --- | --- | --- |
| Keeps bootstrap PATH for the install | no | yes | yes |
| Works when `$HOME/.local/bin` is absent from PATH | no (exit 127) | yes | yes |
| Works when the platform shell is `dash`/POSIX `sh` | yes | no (exit 127) | yes |
| Uses the validated pinned pnpm over a competing one | no | yes | yes |
| Steady-state cost (measured) | 4.38 s | 4.40 s | 4.38 s |
| Repository change needed | — | — | none |

`source` alone is therefore better than the current command but not the most robust option; the explicit `bash -c`
wrapper keeps the PATH export inside the shell that performs the install and removes the dependency on the
platform shell. `scripts/bootstrap-pnpm.sh` already supports sourced use, repeated sourcing, cleanup and
fail-closed behaviour, so no script change is justified. `freebuff-verify.sh` already sources it, so repository
verification and the recommended startup path exercise the same code path.

### Known limitation (documented, not changed)

When `$HOME/.local/bin` is already on PATH *behind* another `pnpm`, the bootstrap validates its candidate and
installs the pin, but its idempotent PATH guard does not move the existing directory to the front (FR-024). In
that sequence both `source` and `bash` forms run the competing binary. No competing `pnpm` exists in this image's
PATH (only `.bun/bin` and `.local/bin`), so changing that guard is outside the minimal change this audit
justifies; it is recorded as a residual risk.

### Verification plan

Run the probe on the final tree, confirm `git diff -- package.json pnpm-lock.yaml` is empty, then run
`./freebuff-verify.sh`, measure `.next + public` against the 495 MB maximum, audit the final diff and publish the
canonical summary in the pull request body.

## Startup-command documentation guard (2026-11-07)

**Scope**: keep the recommendation from silently regressing. The platform setting is not readable from the
repository, so the command is documented once in `README.md` under *Freebuff Workspace Startup* and pinned by
`__tests__/freebuff-startup-command.test.js`.

### Design

1. Parse every ```` ```bash ```` fence in `README.md` and collect lines mentioning `bootstrap-pnpm.sh`.
   Require exactly one line and require byte equality with the tested form. Any edit to the two rejected forms
   fails here, so the documentation cannot drift without a red test.
2. Execute the *documented* command (not a copy) in a temporary fixture: a stand-in
   `scripts/bootstrap-pnpm.sh` that exports `$FREE_BUFF_TEST_BIN` on PATH, and a stand-in `pnpm` in that
   directory that appends its arguments to a log and exits 0. The fixture `PATH` is `/usr/bin:/bin`, so no real
   pnpm, `$HOME/.local/bin` or network is reachable. This proves the wrapper carries the PATH export into the
   install under both Bash and a POSIX `sh`.
3. Run the rejected `bash scripts/…` form in the same fixture and require exit 127 with no `pnpm` invocation,
   and the rejected `source …` form under `sh` — the latter skipped only where `sh` genuinely supports
   `source`, so the suite stays portable without weakening the success assertions.

### Why a fixture instead of the real command

Running the real startup command would install dependencies and need the registry on every test run. The
fixture isolates exactly the property that broke: whether the bootstrap's PATH export reaches the shell that
invokes `pnpm`. Provider-specific steps (registry download, pinned-version resolution) were already measured by
`artifacts/freebuff-startup-audit/probe.sh` and are not re-run per test.

No dependency, lockfile, application, workflow, payment, database, authentication, deployment or Cloudflare
file changes; `README.md` gains developer documentation only.
