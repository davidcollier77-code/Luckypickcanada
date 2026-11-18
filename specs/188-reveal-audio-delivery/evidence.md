# Evidence: Single-Download Reveal Audio Delivery

**Date**: 2026-11-18
**Branch**: `perf/reveal-audio`
**Base**: `main` at `782ac553ffdd0fbb3476e2cc403c3500f981ad4f`
**Task groups**: audio, testing
**Library sources consulted**:
- `.docs/audio/_goldfire_howler.js.md` — useful: confirmed Howler caches decoded buffers per URL and preloads each
  `src` through its own XHR, which located the duplicate at the separate `fetch()` layer.
- `.docs/testing/_google_eng-practices.md` — useful: focused regression guard for the changed behaviour.

## Duplicate cause

`app/lucky-card-reveal.js` prepared the standard tier twice:

1. a mount effect ran `fetch(url)` for each of the eight `/sounds/standard_*.mp3` files and kept the
   `ArrayBuffer` in `rawAudioDataRef` for the Web Audio scheduler;
2. a second mount effect created eight Howl instances with the same URLs and `preload: true`, so Howler fetched
   every file again.

The eight overlapping requests are the audit's 8 duplicates. Howler already deduplicates identical URLs among
Howls (`var cache = {}` in `node_modules/howler/dist/howler.js`), so removing one of the two layers is safe.

## Change

- The eight Howl declarations moved into one stable `createStandardHowls(sources)` factory with the unchanged
  authoring (volumes 0.46/0.62/0.7/0.74/0.78/0.28/0.18/0.15, `preload: true`).
- The fetch effect now also creates one object URL per fetched file and passes those to the factory, so Howler
  decodes exactly the bytes that were already downloaded. Object URLs are revoked on unmount.
- The Web Audio path still decodes `rawAudioDataRef`; the reveal still awaits the same
  `standardAudioPreloadRef` readiness promise.
- If the fetch fails, the factory falls back to the authored URLs, preserving the old behaviour.
- A `disposed` flag prevents a late fetch from creating audio after unmount.
- The seven premium/flagship cues and their preload are untouched.

## Measured result

Production server (`next start` on port 3102), Chromium 1440x900, cold context, `/reveal`, one activation:

| Metric | Audit capable baseline | After |
| --- | --- | --- |
| Sound requests | 23 | 16 (15 cue files + the button click) |
| Duplicate requests | 8 | **0** |
| Standard-cue requests | 16 (8 + 8) | **8 (8 + 0)** |
| Standard-cue duplicates | 8 | **0** |
| Sound body bytes | 2,091,758 | 1,413,141 |
| Console errors through one reveal activation | — | 0 |

Per-path counts in `artifacts/reveal-audio-20261118/probe.json`: every one of the 15 cue URLs appears exactly
once, including all eight `standard_*` cues. The 8 standard files total 707,635 bytes; the measured page total
is 678,617 bytes below the audit's capable figure (−32.4%). The two figures come from different harnesses, so
the request/duplicate counts are the primary comparison and the byte delta is indicative.

## Checks

| Check | Result |
| --- | --- |
| `npx vitest run __tests__/reveal-audio-delivery.test.js` | PASS — 5 tests |
| `npx vitest run` | PASS — 96 files / 993 tests |
| `pnpm exec tsc --noEmit` | PASS |
| `pnpm run build` | PASS |
| Clean production build size (`rm -rf .next && pnpm build && du -sb .next`) | 312,595,674 bytes = 298.11 MiB (limit 495 MiB) |
| `./freebuff-verify.sh` | PASS — exit 0 (Spec Kit gate, type check, build, docs tests) |
| Reveal activation smoke test | PASS — one click, no console errors, no extra cue request |

## Limitations

- The audit's slow profile (415,347 bytes, 11 requests, 4 duplicates) was not reproduced under CDP throttling;
  the fix is network-independent (it removes one of two request layers), and the capable-profile measurement
  shows zero duplicates.
- The seven premium/flagship cues are still preloaded on every reveal, including standard-tier visits. That is
  the authored preload strategy, not a duplicate, and changing it would risk the premium choreography's timing;
  it is left as a separate follow-up.
- Browser playback was smoke-tested headlessly; audibility itself cannot be verified in this workspace.
