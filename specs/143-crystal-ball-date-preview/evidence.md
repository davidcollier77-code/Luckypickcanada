# Evidence — Development-Only Crystal Ball Date Preview

**Date:** 2026-11-12
**Branch:** `freebuff/3625a98e3b6b0eab9e6a60b2-date-preview`
**Base:** `main`
**Base SHA:** `7563720514b05c5f1be18823f093af7de8070d31`

## What was built

- `app/crystal-ball/preview/page.js` — development-only route; calls `notFound()` when
  `NODE_ENV === 'production'`.
- `app/lib/crystal-ball-preview.js` — production gating, `YYYY-MM-DD` / `HH:MM` validation, one local
  preview `Date`, preview URL building, date shifting, page-state usage and occasion presets.
- `app/crystal-ball-client/CrystalBallPreviewClient.jsx` — reads the preview URL, defaults to today's
  local date/time, renders the existing `CrystalBall`, and keeps fortunes/follow-ups in page state.
- `app/crystal-ball-client/CrystalBallPreviewControls.jsx` — date/time inputs, 29 occasion presets,
  time-of-day shortcuts, "Use today" and "Reset reading".
- `app/components/CrystalBall/CrystalBall.tsx` — optional `previewActive`, `previewDateKey` and
  `previewNow` props. Defaults preserve the production page exactly.

## Conflict repair after the retarget

PR #1842 was squash-merged into `main` as `7563720514b05c5f1be18823f093af7de8070d31`, and its
feature branch was deleted, so GitHub retargeted #1843 to `main`. The branch still carried the
pre-squash parent commit, which made the histories conflict. `main` was merged into the branch:

- `app/components/CrystalBall/CrystalBall.tsx`: kept the preview-aware version, which already
  contains the merged #1842 greeting and local-time changes plus the optional preview props.
- `memory-bank/progress.md`: retained both the #1843 and #1842 milestone entries.
- `memory-bank/activeContext.md`: moved the active task record to the `main` base and removed the
  stale stacked-PR handoff.

The net diff against `main` is exactly the 13 date-preview files; no #1842, scheduler or Spec 144
changes remain in the pull request diff.

## Unit and component checks actually run

| Check | Command | Result |
| --- | --- | --- |
| Preview model | `pnpm exec vitest run __tests__/crystal-ball-preview.test.js` | PASS — 11 tests |
| Preview client render | `pnpm exec vitest run __tests__/crystal-ball-preview-client.test.jsx` | PASS — 1 test; selected date `2026-12-24`, time `20:30`, `Good evening.` greeting, oracle payload carried the preview date, daily-usage key stayed `null` after generating |
| Full unit suite | `pnpm run test` | PASS — 62 files, 591 tests |
| Type check | via `./freebuff-verify.sh` | PASS — exit 0 |
| Production build | via `./freebuff-verify.sh` | PASS — `Build completed successfully`; `/crystal-ball/preview` appears in the static route list |
| Post-merge focused suites | `pnpm exec vitest run __tests__/crystal-ball-preview.test.js __tests__/crystal-ball-preview-client.test.jsx __tests__/crystal-ball-calendar.test.js __tests__/crystal-ball-greetings.test.js __tests__/crystal-ball-local-time.test.js` | PASS — 70 tests, 5 files |
| Post-merge full suite | `pnpm run test` | PASS — 62 files, 591 tests |
| Post-merge type check | `pnpm exec tsc --noEmit` | PASS — exit 0 |
| Repository gate | `SPEC_KIT_BASE_REF=7563720514b05c5f1be18823f093af7de8070d31 ./freebuff-verify.sh` | PASS — exit 0; only `specs/143-crystal-ball-date-preview` differs from `main`; governance tests, type check, build and 36/36 docs tests |
| Cloudflare/OpenNext bundle | `pnpm exec opennextjs-cloudflare build` | PASS — `Worker saved in .open-next/worker.js`, `OpenNext build complete`, exit 0 |
| Diff hygiene | `git diff --check` | PASS — no whitespace errors |

## Production and development route checks

A production `next start` server on port 3100 and a development `next dev` server on port 3101
were used.

| Check | Result |
| --- | --- |
| `GET /crystal-ball` in production | **200**; `Daily reset in` present; no `Date preview` or `previewDate` markup |
| `GET /crystal-ball/preview?previewDate=2026-12-24&previewTime=20:30` in production | **404**; the rendered body is the standard Next.js 404 page, not the preview UI |
| `GET /crystal-ball/preview?previewDate=2026-12-24&previewTime=20:30` in development | **200**; server HTML contains the preview loading state |

The production 404 response's RSC payload includes the page's metadata title
("Crystal Ball date preview"), but the rendered document title is the site default and no preview
controls or Crystal Ball markup are rendered.

These route checks were repeated after the retarget merge with the same results: production
`/crystal-ball` 200 with the daily-reset UI and no preview markup, production preview 404, and
development preview 200 with the loading state.

## Build size

Measured after the final production build:

```text
total       454,117,035 bytes = 433.08 MiB
```

The repository hard cap is strictly below 495 MiB. **PASS.**

## Browser QA status

The preview client was exercised through the Vitest render test above, which mounts the real
`CrystalBall` and generated a preview fortune against a mocked oracle response. The preview route
was also checked over HTTP in both production (404) and development (200).

Local Playwright projects remain **BLOCKED** in this sandbox because Chromium exits before
navigation with `libnspr4.so: cannot open shared object file`. No preview visual baseline was added,
and the normal `/crystal-ball` page was not changed visually.

## Documentation actually consulted

No `.docs/` snapshot was opened for this task. `.docs/manifest.json` was inspected to confirm the
available libraries; the implementation relied on the repository's existing Next.js App Router,
React and Vitest conventions, and on the source files themselves. `.docs/` was not modified.
