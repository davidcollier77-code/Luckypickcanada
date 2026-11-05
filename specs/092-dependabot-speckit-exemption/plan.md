# Implementation Plan: Dependabot Maintenance Exemption for Spec Kit Governance

**Branch**: `fix/dependabot-speckit-governance-exemption` | **Date**: 2026-11-05 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/092-dependabot-speckit-exemption/spec.md`

## Summary

Teach the single shared governance verifier that an approved Dependabot maintenance change is a legitimate
change set with no feature-development artifacts, and prove it from independent evidence rather than from the
pull request title or branch name. The verifier gains one narrowly gated exemption
(`dependabot_maintenance_exemption`) that is consulted only where the existing gate would otherwise fail for
"no changed task feature artifacts". Two workflows forward the GitHub-reported pull request author to the gate
as `SPEC_KIT_PR_AUTHOR`. Every other check — unit tests, TypeScript, build, Playwright visual regression,
DevSkim, OpenNext validation, updater-scheduler verification and the 495 MiB size ceiling — is untouched and
runs after the gate on a pass.

## Technical Context

**Language/Version**: Bash 3.2-compatible shell (the verifier keeps macOS/system-Bash compatibility);
Node.js 22.x for the surrounding gate

**Primary Dependencies**: none added. The verifier uses only `git`, `printf`, `grep`; the regression suite uses
`git` and `env`

**Storage**: N/A

**Testing**: `bash scripts/test-verify-speckit-task.sh` (deterministic, temporary fixture repositories, no
network); `./freebuff-verify.sh`; `pnpm exec vitest run` (unchanged, for regression safety); `pnpm exec tsc
--noEmit`

**Target Platform**: GitHub Actions (`ubuntu-latest`) and local developer shells

**Project Type**: Next.js App Router application on Cloudflare; this change touches verification metadata only

**Performance Goals**: No runtime change. The exemption adds two `git` invocations only on the failing branch
of the gate.

**Constraints**: 495 MiB hard build maximum; `.docs/` read-only; `AGENTS.md` unchanged; no dependency,
lockfile, application, visual, payment, email, database, secret or deployment change; PRs #1712–#1717 keep
their dependency versions

**Scale/Scope**: One verifier, one regression suite, two workflow `env:` blocks, one feature record set

## Constitution Check

*GATE: Must pass before implementation.*

- **Single source of truth** — the exemption lives inside the existing central verifier that every workflow
  already calls; no second gate, no per-workflow copy — PASS.
- **Verify before acting** — the six failing PRs, their seven run IDs, their exact changed paths, their commit
  author/committer identities and the failing message were inspected before any edit — PASS.
- **Smallest correct change** — one new predicate plus two `env:` blocks; no test, check or step removed —
  PASS.
- **Protect core systems** — no Stripe, Resend, Neon, Turnstile, Cloudflare, secret, API route or application
  file is touched; the governance file `AGENTS.md` itself is unchanged — PASS.
- **Resource conservation** — `.docs/` untouched, no dependency added, no Context7/MCP invocation — PASS.
- **Testing** — every requirement is exercised by an executed fixture case, including the negative controls —
  PASS.

## Project Structure

### Documentation (this feature)

```text
specs/092-dependabot-speckit-exemption/
├── spec.md
├── plan.md
├── tasks.md
└── checklists/requirements.md
```

### Source Code (repository root)

```text
scripts/verify-speckit-task.sh            # committed-path set + dependabot_maintenance_exemption()
scripts/test-verify-speckit-task.sh       # 13 new fixture cases + workflow-wiring assertions
.github/workflows/visual-qa.yml           # forwards SPEC_KIT_PR_AUTHOR to ./freebuff-verify.sh
.github/workflows/deploy-updater-scheduler.yml  # same forwarding in the verify job
memory-bank/activeContext.md              # context record for this task
.specify/feature.json                     # local, git-ignored pointer (untracked)
```

**Structure Decision**: No new script, no new workflow, no new dependency. The exemption is a predicate inside
the existing verifier, so every caller (`freebuff-verify.sh`, both workflows, local runs) receives exactly the
same behaviour.

## Phase 0: Research — evidence gathered before implementation

1. **Failure point.** `scripts/verify-speckit-task.sh` exits non-zero when `CANDIDATE_DIRS` is empty, and
   `freebuff-verify.sh` stops the gate there, which is why Playwright and updater steps were skipped.
2. **Real change sets.** PR #1712 (`github_actions`) changes only
   `.github/workflows/deploy-updater-scheduler.yml` and `.github/workflows/update-spec-kit.yml`, one `uses:`
   line each. PRs #1713–#1717 (`npm`) change only `package.json` and `pnpm-lock.yaml`.
3. **Actor evidence.** GitHub reports `dependabot[bot]` as the pull request author for all six; the API shows
   each is one commit authored by `49699333+dependabot[bot]@users.noreply.github.com` and committed by
   `GitHub <noreply@github.com>` (web-flow, signed).
4. **Trust boundary.** Workflows run from the pull request branch, so a branch-name or title check is
   worthless, and an author string alone is not enough. The exemption therefore requires the
   workflow-supplied author signal **and** a scope allowlist that cannot admit application/test/script/docs
   files **and** Dependabot/GitHub commit provenance.
5. **Dirty-checkout hazard.** `deploy-updater-scheduler.yml` runs `scripts/update-spec-kit-safely.sh` before the
   gate, which can leave tracked local modifications, so exemption scope uses the committed `BASE...HEAD` diff
   rather than local worktree state.

## Phase 1: Design

`data-model.md`, `contracts/` and `quickstart.md` are omitted: there is no entity, external interface or manual
scenario beyond the fixture cases recorded in `tasks.md`.

**Exemption decision table** (evaluated only when no artifact directory changed):

| Signal | Requirement | If unmet |
| --- | --- | --- |
| `SPEC_KIT_PR_AUTHOR` | exactly `dependabot[bot]` | fail closed, original message |
| Comparison base | resolvable (`SPEC_KIT_BASE_REF`, `origin/<base>`, `<base>`, or `main`) | fail closed |
| Committed change set | non-empty | fail closed |
| Every changed path | `package.json`, `pnpm-lock.yaml`, or one-level `.github/workflows/*.yml\|yaml` | fail closed naming the path |
| Every commit author email | `49699333+dependabot[bot]@users.noreply.github.com` or `support@dependabot.com` | fail closed naming the author |
| Every commit committer email | `noreply@github.com` (GitHub web-flow) | fail closed naming the committer |

## Phase 2: Implementation shape

1. Record the committed diff in a second array (`COMMITTED_PATHS`) alongside the existing combined
   `CHANGED_PATHS`, so artifact detection keeps its current semantics while exemption scope stays commit-only.
2. Add `is_dependency_maintenance_path`, `is_dependabot_author_email` and `dependabot_maintenance_exemption`
   as Bash 3.2-compatible helpers with no associative arrays and no `errexit`-unsafe `&&` chains.
3. Consult the exemption only inside the existing `CANDIDATE_DIRS -eq 0` branch; on success print the applied
   exemption and the scope, then exit 0. On failure print the precise blocker when the author signal was
   present, then fall through to the unchanged failure messages.
4. Add `env: SPEC_KIT_PR_AUTHOR: ${{ github.event.pull_request.user.login }}` to the gate step in
   `visual-qa.yml` and the `verify` job in `deploy-updater-scheduler.yml`.
5. Extend the regression suite with `run_verify` env support, Dependabot-shaped and human-shaped commit
   helpers, thirteen new cases, and assertions that both workflows forward the author.

## Complexity Tracking

No constitution violations; no complexity justification required.

## Verification plan

- `bash -n` on both modified scripts.
- `bash scripts/test-verify-speckit-task.sh` — every existing and new case passes.
- Deliberate break check: remove the author forwarding from a workflow fixture and confirm the wiring
  assertion fails (the assertion is the guard for that regression).
- `./freebuff-verify.sh` — governance gate, TypeScript, production build, refresh-docs tests.
- Measured `.next + public` size recorded against the 495 MiB hard maximum.
- Full `pnpm exec vitest run` for regression safety.
- PR-head CI observed on GitHub for the six Dependabot PRs; never claimed before it is observed.
