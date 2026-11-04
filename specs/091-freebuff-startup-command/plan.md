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
