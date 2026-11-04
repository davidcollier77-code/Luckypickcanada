# Homepage performance audit (specs/088-live-performance-readiness)

Evidence for the duplicate hero-image download fix. Measured on the same local
production build harness before and after the change.

## Files

- `probe.cjs` — Playwright Chromium probe. Cold context, mobile (390x844 @3x,
  Pixel 7 UA) or desktop (1440x900), records FCP/LCP/CLS/long tasks, every
  response with its transfer size, and the LCP element. Writes JSON.
- `screenshots.cjs` — first-screen screenshots plus the document's image
  preload hints and the hero `<img>` state for both viewports.
- `baseline-mobile.json`, `baseline-desktop.json` — before the change.
- `after-mobile.json`, `after-desktop.json` — after the change.
- `after/` — post-change screenshots and `summary.json`.
- `live-before/` — screenshots and hints captured from `https://luckypickcanada.ca/`
  before the change (the deployed baseline).

## Reproduce

```bash
pnpm build && PORT=3011 pnpm start -H 0.0.0.0
node artifacts/perf-audit/probe.cjs http://127.0.0.1:3011/ artifacts/perf-audit/after-mobile.json
node artifacts/perf-audit/probe.cjs http://127.0.0.1:3011/ artifacts/perf-audit/after-desktop.json --desktop
node artifacts/perf-audit/screenshots.cjs http://127.0.0.1:3011/ artifacts/perf-audit/after
```

Chromium launch in this workspace needs `scripts/setup-chromium-libs.sh` once,
then `eval "$(scripts/setup-chromium-libs.sh --env)"`.

## Measured result

| Profile | Transfer before | Transfer after | Hero bytes before | Hero bytes after | LCP before | LCP after | CLS |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Mobile 390x844 @3x | 1,982.6 KiB | 1,688.7 KiB (-14.8%) | 491.7 KiB | 198.6 KiB | 492 ms | 416 ms | 0 → 0 |
| Desktop 1440x900 | 2,142.3 KiB | 1,848.4 KiB (-13.7%) | 491.7 KiB | 198.6 KiB | 308 ms | 304 ms | 0 → 0 |

Both profiles still paint `/homepage-hero-lucky-pick-canada.avif`
(`currentSrc` identical to the live site, natural size 1024x1536, zero
horizontal overflow, zero console errors locally).
