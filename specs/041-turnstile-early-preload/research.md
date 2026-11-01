# Research: Turnstile Early Script Preload

## Question

Why does the homepage Suggestion Box security check take 40–60 seconds to become usable, and which
part of that chain can this repository actually fix?

## Method

Static reading of the pinned loader, inspection of the production build output, and network
measurement of the Turnstile API endpoint. No browser could be launched in this workspace
(`chromium-1243` fails with `libnspr4.so: cannot open shared object file`; `sudo` is blocked by the
`no new privileges` flag and the package manager cannot install as an unprivileged user), so timings
that require a renderer are reported as *not measured* rather than estimated.

## Findings

### 1. The script fetch is gated on widget mount, which is gated on hydration

`@marsidev/react-turnstile@1.6.1` (`node_modules/@marsidev/react-turnstile/dist/index.js`) defines
`SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js'` and, in
`useEffect(() => { if (injectScript && !ready) { x(onLoadName); inject({ …, id: 'cf-turnstile-script' }) } }, …)`,
sets `script.src = `${SCRIPT_URL}?onload=${onLoadCallbackName}&render=${render}`` and appends it to
`<head>`. Defaults give the exact URL
`https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onloadTurnstileCallback&render=explicit`.

`app/homepage/HomePage.js` is a `'use client'` module that statically imports `TurnstileField`
(line 20) and renders it inside the Suggestion Box form (line 522). The loader chunk
`74-23649ab21cd1b574.js` (10,313 bytes) is one of the eight scripts in the initial document, so the
loader is present at first paint; only *execution* waits for hydration.

Consequence: without a document-level hint, the sequence is serial —
`download+parse route JS → hydrate → mount → fetch api.js (2 hops) → challenge`.

### 2. The preload was removed for render-path competition, not for being wrong

Commit `7ab4b305` ("Optimize Mobile PageSpeed (CSS split, cache, unused Turnstile preload removal)")
deleted `preload(TURNSTILE_SCRIPT_URL, { as: 'script' })` from `app/page.js`. Its own artifact
(`.specify/features/mobile-pagespeed-optimization/plan.md`) states the intent: "Let
`@marsidev/react-turnstile` load it asynchronously to free up the critical render path."
`tests/visual/turnstile-loading.spec.ts` was inverted in `1e2fe117` to assert *absence* of the hint.
The reported latency was never addressed by that commit; only the PageSpeed side was optimised.

The URL in PR #1568 is confirmed correct: it matches the pinned loader byte-for-byte, so the removal
was a priority/competition decision, not a URL-mismatch bug.

### 3. The fetch is two hops but durably cacheable

Measured against `challenges.cloudflare.com`:

| Hop | Status | Bytes | `cache-control` |
| --- | --- | --- | --- |
| `…/v0/api.js?onload=…&render=explicit` | `302` | 0 | `max-age=300, stale-if-error=10800, stale-while-revalidate=300, public` |
| `…/v0/g/<build>/api.js` | `200` | `86,732` | `max-age=31536000, stale-if-error=10800, stale-while-revalidate=31536000, public` |

Total wall time from this host: 55 ms; 1 redirect. The long-lived `max-age` on the final asset is
what makes an early hint worth keeping even when hydration is slow: the later `<script>` insert is
answered from the HTTP cache rather than re-downloading.

### 4. Baseline asset measurements for `/` (production build)

| Measurement | Before |
| --- | --- |
| Turnstile API preload hints in the homepage document | **0** |
| `preconnect` to `challenges.cloudflare.com` | 1 (already present in `app/layout.js`) |
| Initial JS for `/` | 8 chunks, 616,889 bytes raw / 190,963 bytes gzip |
| Initial CSS for `/` | 5 files, 216,944 bytes raw |
| Loader chunk in initial document | yes (`74-*.js`, 10,313 bytes) |
| Earliest possible script request | after hydration (mount effect) |

## Decision

Restore the hint, homepage-scoped, at `fetchPriority: 'low'`:

```js
preload(TURNSTILE_SCRIPT_URL, { as: 'script', fetchPriority: 'low' });
```

This addresses exactly the stage that is delayed by this repository's own markup — the fetch now
starts at document parse and overlaps hydration — while answering the PageSpeed objection that
removed it: a low-priority hint is scheduled behind the LCP image and the route's own CSS/JS, so it
does not take the critical render path back. `preload()` fetches without executing, so
`onloadTurnstileCallback` still exists before the script runs.

## Explicitly not claimed

- **Cloudflare challenge-processing time.** Managed-challenge execution happens inside Cloudflare's
  iframe and depends on the device, network and Cloudflare's own decision. Nothing in this change
  affects it and it is not measured here.
- **The 40–60 second figure itself.** It cannot be reproduced without a real browser and real
  device/network conditions. The change removes a verified serial stage; it does not prove the total
  wait is gone.

## Alternatives considered

- **A literal `<link rel="preload">` in JSX body markup**: rejected — head placement must not be
  assumed; React's resource API guarantees it, as PR #1568 concluded after review.
- **Executing the script early (raw `<script>` in `<head>`)**: rejected — Cloudflare calls
  `onloadTurnstileCallback` on load, which only exists after the wrapper's module runs; the widget
  would never render.
- **`fetch()` warm-up from an idle callback**: rejected — idle fires after hydration, so it is never
  earlier than the widget's own request and adds code for no gain.
- **Lazy-loading the widget behind an intersection observer**: rejected — it delays the check
  further and changes when the security control mounts.
- **Changing or bypassing challenge/verification**: rejected — it would weaken a protected control.

## References

- Pinned wrapper source: `node_modules/@marsidev/react-turnstile/dist/index.js` (version 1.6.1).
- React DOM `preload()` options, including `fetchPriority`, verified present in the installed
  `react-dom@19.3.1` server and client builds.
- Cloudflare Turnstile client-side rendering guidance — early script loading and `preconnect`.
- Repository evidence: PR #1568, commit `7ab4b305`, commit `1e2fe117`,
  `.specify/features/mobile-pagespeed-optimization/{spec,plan,tasks}.md`.
