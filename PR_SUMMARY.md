# Fix Playwright version mismatch blocking Visual QA discovery

## Task and task groups

**Assigned task:** Fix the Playwright version mismatch that made the 2026-11-06 Visual QA run fail during
test discovery. The `playwright` CLI resolved to 1.63.0 while `@playwright/test` and `playwright-chromium`
resolved to 1.64.1, so every visual spec aborted with "Playwright Test did not expect test() to be called
here." Align the direct `playwright` dependency with 1.64.1 and update `pnpm-lock.yaml`, without touching
the failing pull request, the visual tests, the baselines, or the website.

**Selected task groups:**

- `troubleshooting` — the task is a reported CI failure with a version-disagreement root cause that must be
  diagnosed before editing.
- `testing` — the fix is proven by Playwright test discovery, the preserved Visual QA suite, and a new
  executed dependency-alignment guard.

## Root cause (verified before editing)

| Evidence | Result |
| --- | --- |
| `pnpm exec playwright --version` (base) | `Version 1.63.0` |
| installed `playwright` / `@playwright/test` / `playwright-chromium` | `1.63.0` / `1.64.1` / `1.64.1` |
| `pnpm exec playwright test --list` (base) | aborted with "Playwright Test did not expect test() to be called here." |
| declared range in `package.json` | `playwright: ^1.63.0` — the only stale entry |

The CLI that loads the specs was one release behind the runner the specs import, which is exactly the
condition Playwright's own error message describes.

## Implementation

- `package.json`: `playwright` range raised from `^1.63.0` to `^1.64.1`. `@playwright/test` and
  `playwright-chromium` were already `^1.64.1` and are unchanged.
- `pnpm-lock.yaml`: the root importer now records `specifier: ^1.64.1` / `version: 1.64.1` for `playwright`,
  and the orphaned `playwright@1.63.0` and `playwright-core@1.63.0` package and snapshot entries are
  removed. No other package, peer range or override changes (20-line diff: 3 insertions, 19 deletions).
- `__tests__/playwright-version-alignment.test.js` (new): fails if the three Playwright packages stop
  sharing one declared range, if the lockfile resolves them to different versions, or if a second Playwright
  version reappears in the lockfile snapshots.

### Files changed

```text
package.json
pnpm-lock.yaml
__tests__/playwright-version-alignment.test.js          (new)
specs/100-playwright-version-alignment/spec.md         (new)
specs/100-playwright-version-alignment/plan.md         (new)
specs/100-playwright-version-alignment/tasks.md        (new)
specs/100-playwright-version-alignment/checklists/requirements.md (new)
.specify/feature.json
memory-bank/activeContext.md
memory-bank/progress.md
PR_SUMMARY.md
```

## Spec Kit stages

`specify → plan → tasks → implement`, in order, using one new feature directory
`specs/100-playwright-version-alignment/` (feature 099 covers the documentation-routing cleanup, so no
existing feature directory applied):

- Specification: `specs/100-playwright-version-alignment/spec.md` with
  `checklists/requirements.md`.
- Plan: `specs/100-playwright-version-alignment/plan.md` (constitution check passed; no data model,
  contract, or quickstart artifact warranted).
- Tasks: `specs/100-playwright-version-alignment/tasks.md`.
- Implementation: the dependency correction, lockfile update, and guard above.
- `.specify/feature.json` points at the new feature.

## Library documents reviewed

| Document | Used | Useful |
| --- | --- | --- |
| `.docs/manifest.json` | USED | YES — routed the `testing` and `troubleshooting` groups to their references. |
| `.docs/testing/_microsoft_playwright.md` | USED | YES — confirms specs import `@playwright/test` and that the CLI entrypoint reports its own version, which is the split this fix closes. |
| `.docs/testing/_google_eng-practices.md` | NOT USED | NO — no code-review design question arose; the change is one dependency range. |
| `.docs/troubleshooting/_google_eng-practices.md` | NOT USED | NO — same reason. |
| `.docs/troubleshooting/_debian_debian-reference.md` | NOT USED | NO — the missing Chromium libraries were provisioned with the repository's own `scripts/setup-chromium-libs.sh`, which already documents the no-root approach. |
| `.docs/testing/_trailofbits_skills_post-patch-validation.md` and `…-evidence-model.md` | NOT USED | NO — these concern security remediation validation; this task has no security patch. |

Memory Bank inputs: `memory-bank/projectBrief.md` and `memory-bank/activeContext.md` (read; the earlier
entry recording Playwright 1.63.0 as the installed version matched the reproduced baseline).

## Verification

| Check | Command | Status |
| --- | --- | --- |
| CLI version | `pnpm exec playwright --version` | **PASS** — `Version 1.64.1` |
| Installed packages | `playwright`, `@playwright/test`, `playwright-chromium` | **PASS** — all `1.64.1`; `pnpm why playwright-core` reports one version, `1.64.1` |
| Lockfile agreement | `pnpm install --frozen-lockfile` (inside `freebuff-verify.sh`) | **PASS** — exit 0 |
| Discovery | `pnpm exec playwright test --list` | **PASS** — `Total: 93 tests in 8 files`, no `test()` registration error |
| Visual suite | `pnpm exec playwright test` (three Chromium projects, local dev server) | **PASS** — `90 passed`, `3 skipped`, `0 failed` (2.6 m), no baseline regenerated |
| Flakiness follow-up | first full run under 4 workers on a cold dev server | `85 passed / 5 failed / 3 skipped`; all 5 were timing assertions (Crystal Ball reveal waits, a gold CTA pressed-state read), none a screenshot diff. `gold-cta --grep "hover lifts…"` reran `3 passed`, `crystal-ball-daily-limit` reran `3 passed`, and the full rerun was clean — recorded as environment flakiness, not a regression |
| Alignment guard | `pnpm exec vitest run __tests__/playwright-version-alignment.test.js __tests__/dependency-management.test.js` | **PASS** — 2 files / 13 tests |
| Unit suite | `pnpm exec vitest run` | **PASS** — 44 files / 346 tests |
| TypeScript | `pnpm exec tsc --noEmit` | **PASS** — exit 0 |
| Repository gate | `SPEC_KIT_BASE_REF=4f7b5b8d ./freebuff-verify.sh` | **PASS** — exit 0 (frozen install, Spec Kit gate, typecheck, production build, refresh-docs 19/19) |
| Build size | `du -sb .next public` | **PASS** — `.next` 402,196,323 B + `public` 32,840,043 B = **435,036,366 B (414.88 MiB)**, below the 495 MB maximum |
| PR-head CI (Visual QA) | GitHub Actions run on the pushed head | **PENDING** — no run exists at the time of writing |

`SPEC_KIT_BASE_REF=4f7b5b8d` is the task base (the `main` merge this branch starts from); the workspace has
no `origin/main` ref, and the gate fails closed without a base.

## Behavior preserved

- `playwright.config.ts`, `tests/visual/**`, every committed baseline under
  `tests/visual/__screenshots__/`, `maxDiffPixelRatio`, the three Chromium projects, and
  `.github/workflows/visual-qa.yml` are unchanged; no `--update-snapshots` run occurred.
- Website pages, artwork, audio, copy, navigation, payments, email, database, environment and deployment
  configuration are unchanged.
- No other dependency version or override changed.
- The pull request that triggered the failure is untouched; this work is on its own branch and PR, left
  open and unmerged.

## Remaining issues and limitations

- **PR-head CI is PENDING.** The local evidence above cannot prove the GitHub Actions runtime; the first
  push-triggered Visual QA run is the authoritative confirmation that discovery and the visual suite pass
  in CI.
- The Visual QA cache key uses the installed Playwright version, so this change produces a cache miss and
  one fresh Chromium download on the first run after merge; that is the intended behaviour from feature 098.
- Local visual execution required `scripts/setup-chromium-libs.sh` because this VM image lacks Chromium's
  shared libraries; CI installs them through `playwright install --with-deps chromium`.
- The 494 MB ceiling check passed at 414.88 MiB for this build.

## Final diff audit

`git status` and `git diff` contain only the files listed above. No `tests/visual/**`, `app/**`, `themes/**`,
`public/**`, `.github/**`, `playwright.config.ts`, or unrelated dependency change is present. The lockfile
diff is limited to the `playwright` importer entry and the two removed 1.63.0 package/snapshot entries.

`USEFUL RESULT: NO (PENDING — all local gates pass, but PR-head CI has not run yet; this will be updated
when the GitHub Actions result exists).`
