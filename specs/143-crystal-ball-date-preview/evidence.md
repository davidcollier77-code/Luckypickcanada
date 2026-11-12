# Evidence — Development-Only Crystal Ball Date Preview

**Date:** 2026-11-12
**Branch:** `freebuff/3625a98e3b6b0eab9e6a60b2-date-preview`
**Base:** `freebuff/3625a98e3b6b0eab9e6a60b2` (stacked on PR #1842)
**Base SHA:** `f48c0e5a575ef95e3b65820a808ed4aed6b19357`

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

## Unit and component checks actually run

| Check | Command | Result |
| --- | --- | --- |
| Preview model | `pnpm exec vitest run __tests__/crystal-ball-preview.test.js` | PASS — 11 tests |
| Preview client render | `pnpm exec vitest run __tests__/crystal-ball-preview-client.test.jsx` | PASS — 1 test; selected date `2026-12-24`, time `20:30`, `Good evening.` greeting, oracle payload carried the preview date, daily-usage key stayed `null` after generating |
| Full unit suite | `pnpm run test` | PASS — 62 files, 591 tests |
| Type check | via `./freebuff-verify.sh` | PASS — exit 0 |
| Production build | via `./freebuff-verify.sh` | PASS — `Build completed successfully`; `/crystal-ball/preview` appears in the static route list |
| Repository gate | `SPEC_KIT_BASE_REF=freebuff/3625a98e3b6b0eab9e6a60b2 ./freebuff-verify.sh` | PASS — exit 0; Spec Kit artifacts verified for `specs/143-crystal-ball-date-preview`, governance tests, type check, build and 36/36 docs tests |
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

## Build size

Measured after the final production build:

```text
.next       420,101,676 bytes
public       34,003,938 bytes
total       454,105,614 bytes = 433.07 MiB
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
