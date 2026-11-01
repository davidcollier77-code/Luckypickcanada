# Turnstile: start the Suggestion Box security-check fetch from the initial homepage document

## Task and task group

**Task group: `troubleshooting`.** The work starts from one reported defect — the homepage Suggestion
Box Cloudflare Turnstile check taking 40–60 seconds to become usable — and required establishing the
actual cause (including the history of PR #1568 and its removal in `7ab4b305`) before choosing a fix.
That is a diagnosis-first repair of existing behaviour, not new functionality, a visual change, a test
campaign, a security audit, an audio task or an SEO task, so `troubleshooting` is the correct and only
group.

**Assigned task:** fix the long loading delay affecting Turnstile in the homepage Suggestion Box;
investigate the previous preload (PR #1568) and its removal in the 2026-10-27 mobile PageSpeed commit;
implement the smallest effective correction that loads the check promptly without sacrificing the
mobile PageSpeed gains; preserve every Turnstile security protection; add regression tests; measure
before and after; distinguish script-loading time from Cloudflare challenge-processing time.

## Root cause (established, not assumed)

The delay chain is `hydration → widget mount → script fetch (2 hops) → Cloudflare challenge`.

1. **The API fetch is gated on widget mount, which is gated on hydration.** In the pinned
   `@marsidev/react-turnstile@1.6.1` loader
   (`node_modules/@marsidev/react-turnstile/dist/index.js`) the script tag is appended from a
   `useEffect` on mount:
   `script.src = `${SCRIPT_URL}?onload=${onLoadCallbackName}&render=${render}``.
   `TurnstileField` is statically imported by the `'use client'` homepage
   (`app/homepage/HomePage.js:20`, rendered at `:522`), so that mount cannot occur until the
   homepage's client bundle has run and React has hydrated. The loader chunk was already in the
   initial document, so a missing chunk is *not* the cause — execution order is.
2. **The homepage advertised no early hint.** The built `.next/server/app/index.html` contained the
   layout's `<link rel="preconnect" href="https://challenges.cloudflare.com">` and **zero** matching
   preload hints (measured).
3. **PR #1568 was removed for render-path competition, not because it was wrong.** Its URL matches the
   pinned loader byte-for-byte. `7ab4b305` deleted it, and its own artifact
   (`.specify/features/mobile-pagespeed-optimization/plan.md`) records the intent: "Let
   `@marsidev/react-turnstile` load it asynchronously to free up the critical render path."
   `1e2fe117` then inverted the Playwright spec to assert *absence*. The reported latency was never
   addressed by that commit — only the PageSpeed side was optimised.
4. **The fetch is two hops but durably cacheable** (measured): configured URL → `302`
   (`max-age=300, public`) → `/turnstile/v0/g/<build>/api.js` → `200`, `86,732` bytes,
   `cache-control: max-age=31536000, public`. That one-year lifetime is why an early hint is still
   worth having when hydration is slow, rather than a wasted download.

## Implementation

`app/page.js` (server component, `dynamic = 'force-static'`) now emits the hint during server
rendering:

```js
preload(TURNSTILE_SCRIPT_URL, { as: 'script', fetchPriority: 'low' });
```

Three properties make this the smallest correction that fixes the cause without giving PageSpeed back:

- **Earlier by construction.** The hint is in the initial document head, so the browser starts the
  two-hop fetch while the route's own CSS/JS is still downloading, instead of after hydration.
- **Low priority is the actual correction over PR #1568.** `fetchPriority: 'low'` schedules the
  third-party script behind the LCP image and the route's own CSS/JS — precisely the competition that
  got the eager version removed. React's `preload()` fetches without executing, so
  `onloadTurnstileCallback` still exists before the wrapper injects the executing tag (an executing
  early `<script>` would break the widget permanently).
- **Homepage-scoped.** No other route preloads it.

## Files changed

- `app/page.js` — add `preload` import, the exact wrapper URL constant, and the low-priority hint.
- `tests/visual/turnstile-loading.spec.ts` — rewritten: one matching hint on `/` with the exact `href`
  and `fetchpriority="low"`, none on `/about` or `/map`.
- `specs/041-turnstile-early-preload/spec.md`, `plan.md`, `research.md`, `tasks.md` — reused and
  rewritten in place.
- `.specify/feature.json` — points at the reused `specs/041-turnstile-early-preload` feature.
- `PR_SUMMARY.md`, `memory-bank/activeContext.md` — canonical report and context.

No new feature directory was created. `specs/041-turnstile-early-preload/checklists/requirements.md`
was inspected and left unchanged: its quality statements remain true.

## Spec Kit stages and artifacts

Specify → Plan → Tasks → Implement, in order, reusing `specs/041-turnstile-early-preload/`:
`spec.md` (updated requirements, verified root cause), `plan.md` (design and preserved behaviour),
`research.md` (method, measurements, alternatives rejected), `tasks.md` (real completion state).

## Library documents reviewed

| Document | USED | USEFUL | Explanation |
| --- | --- | --- | --- |
| `.docs/troubleshooting/_cloudflare_cloudflare-docs_turnstile.md` | YES | YES | Routed troubleshooting reference. Confirms Turnstile runs non-interactive JS challenges (proof-of-work, browser probing) and adapts difficulty per visitor. That is the authority for treating challenge-processing time as external and unmeasurable here, and for not conflating it with script-fetch time. |
| `.docs/security/_marsidev_react-turnstile.md` | YES | NO | Routed copy of the package README. It advertises "automatic script injection" but documents nothing about script loading, `preload`, priority or the injected URL, so it could not inform the fix. The authoritative behaviour was read from the installed `dist/index.js` instead. |
| `.docs/troubleshooting/_google-gemini_gemini-skills_gemini-api-dev.md` | NOT USED | NO | Conditional Gemini API specialist guidance; this task does not call, configure or integrate the Gemini API or SDK, so it was correctly not loaded. |
| `.docs/troubleshooting/_google-gemini_gemini-cli.md` | NOT USED | NO | Conditional Gemini CLI reference; no Gemini CLI command, config or integration is involved. |
| `.docs/troubleshooting/_google_eng-practices.md` | NOT USED | NO | Optional cross-cutting review guidance; the change is a one-line resource hint whose constraints were already fixed by the measured evidence. |
| Next.js, React, TypeScript, OpenNext, Cloudflare Pages, Workers SDK, Neon, Upstash, Sentry, React Error Boundary, Chrome, WebKit, Web Audio, GitHub Docs (manifest-routed) | NOT USED | NO | No route, build, database, rate-limit, error-reporting, audio or browser-API behaviour changed. React DOM's `preload` option support was verified directly in the installed `react-dom@19.3.1` instead of a documentation snapshot. |

No Context7 invocation was made (requires per-invocation owner approval and was unnecessary).
No external MCP was used beyond the connected GitHub integration needed to publish the PR.

## Verification (commands actually run)

Environment: cloud Linux worktree, `pnpm@10.30.3` installed to `$HOME` because it was absent;
`pnpm install --frozen-lockfile` used (lockfile preserved, never `npm ci`).

| Check | Command | Result |
| --- | --- | --- |
| Type check | `pnpm exec tsc --noEmit` | **PASS** — exit 0 |
| Unit suite | `pnpm exec vitest run` | **PASS** — 24 files / 224 tests |
| Production build (baseline, HEAD `app/page.js`) | `pnpm run build` | **PASS** — exit 0 |
| Production build (with this change) | `pnpm run build` | **PASS** — exit 0 |
| Repository gate | `./freebuff-verify.sh` | see the gate row below |
| Build size | `du -sb .next` | **PASS** — 349,945,970 bytes / 333.73 MiB (< 495 MB hard maximum) |
| Final diff audit | `git diff` / `git status --short` | **PASS** — exactly the files listed above |

### Before/after measurement (controlled: same machine, same lockfile, only `app/page.js` differs)

| Measurement on the built homepage document `/` | BEFORE | AFTER | Delta |
| --- | --- | --- | --- |
| Turnstile API hints in the document | **0** | **1** | +1 |
| Turnstile API preload links | **0** | **1** | +1 |
| Earliest possible API request | after hydration (mount effect) | at document parse | moved off the post-hydration chain |
| Initial JS for `/` | 617,006 bytes raw | 617,006 bytes raw | **0** |
| Initial CSS for `/` | 216,944 bytes raw | 216,944 bytes raw | **0** |
| Emitted document HTML | 65,854 bytes | 66,174 bytes | +320 bytes |

Emitted tag, verified in the built output:

```html
<link rel="preload" href="https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onloadTurnstileCallback&amp;render=explicit" as="script" fetchPriority="low"/>
```

React emits the attribute as `fetchPriority`; HTML attribute names are case-insensitive when parsed,
so the element property is `fetchpriority` and Chrome honours it for preloads. The `&amp;` is correct
HTML escaping — the parsed `href` equals the wrapper's URL byte-for-byte.

### Script-loading time vs challenge-processing time

- **Script-loading (in our control, and changed here):** proved by measurement — the fetch previously
  could not start before hydration and now starts at document parse, at low priority, from a URL that
  is cacheable for one year after a single 302.
- **Cloudflare challenge processing (not in our control, NOT measured):** delegated to Cloudflare's
  frame per the routed Turnstile reference; nothing in this change touches it and no timing is claimed
  for it.

## Outstanding and pending checks (not passed, not claimed)

- **BLOCKED — Playwright spec execution in this workspace.** `chromium-1243` cannot start:
  `libnspr4.so => not found` (also `libnss3`, `libatk*`, `libcups`, `libxkbcommon`, `libasound`,
  `libcairo`, `libpango`, `libX*`, `libatspi`). `sudo` is disabled by the `no new privileges` flag and
  the package manager cannot install as an unprivileged user, so `playwright install-deps` is not
  possible here. The spec is written for the configured desktop/mobile projects and CI Visual QA is
  the confirmation path.
- **PENDING — real-device timing.** The 40–60 second figure is not reproducible here. Confirming that
  the total wait is reduced needs a browser and device/network conditions this environment does not
  have, and must be reported separately from challenge-processing time.
- **PENDING — GitHub Actions on the PR head.**
- **PENDING — the configured Gemini PR review.** Recorded after the PR is opened; a review that does
  not run is reported as pending, not as passed.

## Behaviour preserved, risks, limitations

Preserved: `TurnstileField` callbacks and state machine, site-key lookup, the hidden
`cf-turnstile-response` field, server-side Siteverify with hostname and action validation, rate
limiting, duplicate protection, honeypot, form-submit gating and wording, all styling, audio, payments,
dependencies, environment variables, Cloudflare configuration and API routes. The hint cannot mint a
token or permit submission.

Risks and limits:

- A preload removes the *fetch* from the post-hydration chain; it cannot bound Cloudflare's challenge
  duration and cannot fix a slow hydration caused by the page's own JS. The homepage still ships
  617,006 bytes of initial JS.
- The change adds the 86,732-byte third-party download to every homepage visit, which is the
  bandwidth cost the PageSpeed commit objected to. It is mitigated rather than eliminated by
  `fetchpriority="low"`; if a future mobile measurement shows the LCP image regressing, /
  the correct follow-up is to gate the hint (for example by connection type) rather than to remove it
  and restore the post-hydration stall.
- No `fetchpriority` regression can be observed here because no browser runs in this workspace.

## Merge status

Left **OPEN and UNMERGED** for owner review and the Gemini PR reviewer. No merge, no deployment.

**USEFUL RESULT: NO** — the implementation is complete and the repository gates pass, but a mandatory
check (the Playwright regression spec) is BLOCKED in this environment and the real-device timing is
PENDING, so verified completion cannot be claimed.
