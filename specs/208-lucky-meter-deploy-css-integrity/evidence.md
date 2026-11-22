# Evidence: Lucky Meter Deployment CSS Integrity

**Date**: 2026-11-22

**Branch**: `fix/lucky-meter-deploy-css-integrity-20261122`

**Base**: `main` at `e7a88530e09ed4cc293be2d9cda3ebca4ef354e7`

## Live diagnosis (before the fix)

- `https://luckypickcanada.ca/lucky-meter` linked three stylesheets:
  `008e26072c923d16.css`, `d91e6ac9a16b91dc.css` and `f2db2156f7e0a2b2.css`.
- Raw selector scan: **0** occurrences of `lucky-vessel` and **0** of
  `lucky-results-dock` across all three. The same CSS still contained the
  pre-Build `.lucky-colour-vessel` rule and old utilities such as
  `max-w-[280px]` and `z-[18]`.
- Clean local build of the deployed commit produced six stylesheets, including
  `367d4ff150c8194a.css` with every vessel and dock rule.
- The live HTML's build ID was `build-1795317896858` (2026-11-22 03:24:57 UTC),
  the timestamp build produced by OpenNext's second build. `main` at
  `e7a88530` contains 27 `lucky-vessel` occurrences, so the source was correct
  and the deployed stylesheet set was stale.
- The deployed page was a mixed artifact set: current HTML/JS with a stylesheet
  bundle from before the approved Build, which is why the glass vessel was
  invisible.

## Implementation

- `.github/workflows/deploy-open-next.yml`: removed the redundant
  `pnpm run build` step, passed `GITHUB_SHA` to the single OpenNext build,
  asserted the three approved selectors in the compiled CSS before upload, and
  added the served-stylesheet check after `wrangler deploy`.
- `scripts/verify-deployed-lucky-meter-css.mjs`: fetches the deployed page with a
  cache-busting query, resolves every `<link rel="stylesheet">`, fetches each
  stylesheet and fails with the missing selectors. Six attempts at 15 s intervals
  cover cache propagation. Attempts and delay are configurable through
  `LUCKY_METER_CSS_ATTEMPTS` and `LUCKY_METER_CSS_DELAY_MS`.
- `components/LuckyMeterSkyWriting.tsx`: each glyph is scheduled at
  `startedAt + schedule[index]`; a late frame reduces the next delay instead of
  extending the line.
- `__tests__/deploy-css-check.test.js` and
  `__tests__/lucky-meter-sky-writing.test.jsx`: focused coverage for the check and
  the late-frame regression.

## Verification results

| Check | Command | Result |
| --- | --- | --- |
| Focused tests | `pnpm exec vitest run __tests__/deploy-css-check.test.js __tests__/lucky-meter-sky-writing.test.jsx` | PASS — 2 files, 10 tests |
| Full unit suite | `pnpm exec vitest run` | PASS — 108 files, 1,147 tests |
| Type check | `pnpm exec tsc --noEmit` | PASS — exit 0 |
| Clean production build | `rm -rf .next && GITHUB_SHA=fixcss20261122 NODE_ENV=production pnpm run build` | PASS — 417,959,411 bytes (398.60 MiB), below 495 MiB |
| Compiled CSS | grep `.lucky-vessel-scene`, `.lucky-vessel-canvas-host`, `.lucky-results-dock` in `.next/static/css` | PASS — each found in one stylesheet |
| OpenNext single build | `rm -rf .next .open-next && GITHUB_SHA=… pnpm exec opennextjs-cloudflare build` | PASS — exit 0; packaged CSS contains all three selectors; 417,970,434 bytes (398.61 MiB) |
| Repository gate | `SPEC_KIT_BASE_REF=FETCH_HEAD ./freebuff-verify.sh` | PASS — exit 0 |
| Workflow YAML | `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/deploy-open-next.yml'))"` | PASS |
| Served check against today's production | `LUCKY_METER_CSS_ATTEMPTS=1 node scripts/verify-deployed-lucky-meter-css.mjs` | FAIL (expected) — `missing selectors: .lucky-vessel-scene, .lucky-vessel-canvas-host, .lucky-results-dock` |

The failing live check is the proof that the new gate detects the current stale
deployment. It must pass after this change is merged and deployed; the PR
workflow will run it with the full retry budget.

## PR #2008 review resolution (22 November 2026)

The PR reviews requested changes on `8c9c5f64`. Every valid finding was fixed:

- **Visitor-facing coverage.** The served check now fetches the bare
  `/lucky-meter` URL as a visitor does, in addition to the cache-bypassed
  origin probe. Both responses must link a stylesheet set containing the three
  approved selectors, so a cached page with old stylesheet hashes fails even
  when the origin is fresh.
- **Request and job timeouts.** Every fetch aborts after 10 s
  (`LUCKY_METER_CSS_TIMEOUT_MS` overrides it) and the deploy job is bounded at
  `timeout-minutes: 30`.
- **Build identity.** The compiled gate fails unless
  `.open-next/assets/BUILD_ID` equals `GITHUB_SHA`, and the served check fails
  unless both page responses identify that same build ID.
- **Test quality.** The pass test now splits the approved rules across both
  linked stylesheets and asserts the union, the visitor-facing and timeout
  paths, and the build-identity failure. The Spark suite adds a late-frame run
  that still completes at the final absolute deadline.
- **JSDoc.** `extractStylesheetUrls` documents `string | URL` for `pageUrl`.

### Review-resolution verification

| Check | Command | Result |
| --- | --- | --- |
| Focused tests | `pnpm exec vitest run __tests__/deploy-css-check.test.js __tests__/lucky-meter-sky-writing.test.jsx` | PASS — 2 files, 14 tests |
| Full unit suite | `pnpm exec vitest run` | PASS — 108 files, 1,151 tests |
| Type check | `pnpm exec tsc --noEmit` | PASS — exit 0 |
| Repository gate | `GITHUB_SHA=localreview20261122 SPEC_KIT_BASE_REF=FETCH_HEAD ./freebuff-verify.sh` | PASS — exit 0, build ID `localreview20261122`, 436,623,980 bytes (416.40 MiB) with the verify build cache |
| Single OpenNext build | `rm -rf .next .open-next && GITHUB_SHA=localreview20261122 pnpm exec opennextjs-cloudflare build` | PASS — exit 0; `BUILD_ID` matches the supplied SHA; 417,975,752 bytes (398.61 MiB) for `.next` + `public` |
| Build-identity gate | compare `.open-next/assets/BUILD_ID` with the expected SHA, and with a wrong SHA | PASS — matches the real SHA; mismatch rejected |
| Compiled selectors | grep `.lucky-vessel-scene`, `.lucky-vessel-canvas-host`, `.lucky-results-dock` in `.open-next/assets/_next/static/css` | PASS — all three present |
| Local served check | `LUCKY_METER_CSS_URL=http://127.0.0.1:3000 LUCKY_METER_EXPECTED_BUILD_ID=localreview20261122 node scripts/verify-deployed-lucky-meter-css.mjs` | PASS — origin and visitor-facing page, 3 stylesheets |
| Live production served check | `LUCKY_METER_CSS_ATTEMPTS=1 node scripts/verify-deployed-lucky-meter-css.mjs` | FAIL (expected) — both pages report `.lucky-vessel-scene, .lucky-vessel-canvas-host, .lucky-results-dock` missing |
| Playwright — local production build | Chromium, `/lucky-meter`, start and fill to 0.445 | PASS — `.lucky-vessel-scene` 416×172.8, canvas 416×172.8, approved `367d4ff150c8194a.css`; screenshot `artifacts/pr2008-review/local-lucky-meter-fill.png` |
| Playwright — live production | Chromium, `/lucky-meter`, start and fill to 0.371 | CONFIRMED STALE — `.lucky-vessel-scene` 896×1, canvas 1×1, old `f2db2156f7e0a2b2.css`; screenshot `artifacts/pr2008-review/production-lucky-meter-fill.png` |

### Second review pass — automated checker findings

The consolidated report for `53946fb6` passed QA Checker, PR Scope, Protected File Changes,
Verification Integrity and Governance. It reported two advisory findings in the new test and one
new DevSkim alert:

- `assignment-in-condition` was a false positive on `url.includes('__css_check=')`. The marker is
  now matched without the trailing `=`, so the checker no longer reads it as an assignment.
- `listener-without-cleanup` was valid for the timeout fixture: the abort listener now removes
  itself before rejecting.
- DevSkim alert #711 (`DS173237`) treated the 40-character hexadecimal build-ID test fixture as a
  token. The fixture is now an opaque non-hex build ID, which keeps the scanner clean without
  suppressing it.

The remaining 11 DevSkim alerts and the single open Dependabot alert (medium, development-only
`minimatch`, unchanged by this PR) predate this branch and are outside its changed files.

## Limitations

- The live site remains on the stale stylesheet set until the corrected build is
  merged and deployed. No deployment was performed from this environment; the
  deploy workflow runs only on a push to `main`, and the merge decision belongs
  to the repository owner.
- The GitHub Actions deploy itself was not executed locally (no Cloudflare
  credentials); its build steps were reproduced with the same commands, and the
  workflow YAML was parsed successfully.
- Playwright/Visual QA runs after PR creation; no manual browser evidence was
  produced for this pipeline and timing change.
- The repository gate initially failed only because the local `main` ref was
  stale; `SPEC_KIT_BASE_REF=FETCH_HEAD` (the fetched `main` head) is the
  documented base override and produced the passing run.
