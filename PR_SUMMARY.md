# PR Report — Documentation Library and Specialist Routing Cleanup

**Branch**: `freebuff/cf8f9386a7381a2d31381dd8`
**Base**: `main` at `743a1ce84e6b8ef52eec7b40620cd9fa98bc75e8`
**Status**: OPEN and UNMERGED for owner review
**Spec Kit feature**: `specs/099-docs-library-routing-cleanup/`

## 1. Assigned task and selected task groups

**Task**: Clean up and reorganize the `.docs` reference library and its Freebuff documentation routing. Remove the four approved references (Pillow, the Chrome Extensions Offscreen API reference, Android Developers, Gemini CLI), retain and where appropriate re-route the remaining references (NumPy to Audio; Gemini API, Debian Reference, PostHog JS and Magic UI retained), audit every remaining group assignment, and keep the manifest, snapshots and specialist routing consistent. The documentation updater must keep working exactly as it does now.

| Group | Why selected |
| --- | --- |
| `deep-dive` | The work is an evidence-driven audit of a reference library: verify each document's subject and actual project use before moving or removing it, and report findings rather than assuming. |
| `testing` | One existing regression suite asserted the removed Gemini CLI snapshot; the change required updating that assertion and executing the affected tests, typecheck and repository gate. |

Coordination with **PR #1738** (scheduled documentation refresh): it is **already merged** (`merged_at` 2026-11-06T18:33:21Z, merge commit `743a1ce8`, head `476e4f43`, 39 files). The task branch starts from that merge, so the refreshed snapshots are the baseline and nothing in #1738 is lost. The refresh workflow force-pushes `auto/docs-refresh` from `main` on every run, so once this cleanup lands on `main` the retired identifiers are no longer routed and cannot be recreated. No updater file, workflow, schedule or trigger was touched.

## 2. Library documents reviewed

`USED` = the document's content materially informed this task. `USEFUL` = the reference can materially help work on this repository (declared stack, tooling, workflow or environment). Most references were audited by subject and routing rather than read end-to-end, which is why `USED` is honestly `NO` for them.

### Removed (4)

| Reference | Group before | USED | USEFUL | Explanation |
| --- | --- | --- | --- | --- |
| `/python-pillow/Pillow` | polishing | NO | NO | No Pillow/PIL usage anywhere in application code, scripts, or tooling setup (`setup-media-tools.sh` installs vosk/soundfile/numpy only). Removed from routing, sources, inventory, SHA pins and snapshots. |
| `/websites/developer_chrome` (Offscreen API page) | troubleshooting, polishing, testing, security, audio, deep-dive, seo | YES | NO (as sourced) | Confirmed the snapshot was the Chrome Extensions **Offscreen API** page (`<title>` and content) and that the project has no extension/offscreen integration. The **identifier and all seven group routes are retained** with a general Chrome web-platform source; the Offscreen snapshot is gone. |
| `/android/developers` | deep-dive | NO | NO | No Android app, SDK or platform integration exists (only incidental `android` strings in lockfile/esbuild targets and a share-sheet comment). Removed from routing, sources, inventory and snapshots. |
| `/google-gemini/gemini-cli` | creation, troubleshooting, deep-dive | NO | NO | Gemini **CLI** is not part of this project's tooling. Removed from routing, sources, inventory, SHA pins, all three snapshots/symlinks and the three specialist sections. Gemini **API** documentation and every Gemini application/reviewer code path are untouched. |

### Retained (68)

| Reference | Group(s) after cleanup | USED | USEFUL | Explanation |
| --- | --- | --- | --- | --- |
| `/numpy/numpy` | **audio** (moved from polishing) | YES | YES | Imported by `scripts/inspect-media.py` and installed by `scripts/setup-media-tools.sh` for the audio stack. Runtime routing, routing file listing and snapshot all moved to Audio. |
| `/github/docs` | creation, troubleshooting, testing, security, deep-dive, seo | NO | YES | Repository runs many GitHub Actions workflows and PR tooling. |
| `/vercel/next.js` | creation, troubleshooting, polishing, testing, security, deep-dive, seo | NO | YES | Next.js 16.4.3 application. |
| `/reactjs/react.dev` | creation, troubleshooting, polishing, testing, security, deep-dive, seo | NO | YES | React 19.3.1 application. |
| `/microsoft/typescript` | creation, troubleshooting, polishing, testing, security, deep-dive, seo | NO | YES | TypeScript codebase with a mandatory `tsc --noEmit` gate. |
| `/websites/tailwindcss` | creation, polishing, seo | NO | YES | Tailwind CSS 4.3.4 styling. |
| `/websites/motion_dev` | creation, polishing | NO | YES | `framer-motion` imported by the reveal experience. |
| `/lucide-icons/lucide` | creation, polishing | NO | YES | Declared dependency `lucide-react` (no direct import found in current code). |
| `/react-hook-form/documentation` | creation | NO | YES | Declared dependency `react-hook-form` (no direct import found in current code). |
| `/react-hook-form/resolvers` | creation | NO | YES | Declared dependency `@hookform/resolvers`. |
| `/emilkowalski/sonner` | creation, polishing | NO | YES | Declared dependency `sonner` (no direct import found in current code). |
| `/bvaughn/react-error-boundary` | creation, troubleshooting, deep-dive | NO | YES | Imported by `app/components/map-error-boundary.js`; dependency declared. |
| `/google-gemini/gemini-skills/gemini-api-dev` | creation, troubleshooting, deep-dive | NO | YES | The Oracle uses `env.GEMINI_API_KEY`; Gemini API docs are explicitly retained. |
| `/websites/ai_google_dev_gemini-api` | creation | NO | YES | Same Gemini API integration; explicitly retained. |
| `/dropbox/zxcvbn` | creation, security | NO | YES | Declared dependency `zxcvbn`. |
| `/pmndrs/react-three-fiber` | creation | NO | **NO** | Not a declared dependency and no code reference found. Retained because removal was not authorized. |
| `/websites/google_webp` | creation, polishing | NO | YES | AVIF/WebP image delivery work in the project. |
| `/lovell/sharp` | creation, polishing | NO | YES | `sharp` declared; imported by `scripts/optimize-fb.js` and `scripts/optimize-images.js`. |
| `/websites/web_dev_images` | creation, polishing | NO | YES | Image strategy reference for the artwork pipeline. |
| `/websites/mdn_image_types` | creation, polishing | NO | YES | Explicitly required by the Polishing image-format instruction. |
| `/google/eng-practices` | all eight groups | NO | YES | Shared code-review/reference practice for every group. Unchanged. |
| `/coreyhaines31/marketingskills` (+ `copy-frameworks`, `ai-tells`, `natural-transitions`) | creation | NO | YES | Visitor-facing copy creation for the site. Unchanged. |
| `/coreyhaines31/marketingskills/copy-editing` (+ `copy-editing-checklist`, `plain-english-alternatives`, `content-refresh`) | polishing | NO | YES | Visitor-facing copy editing. Unchanged. |
| `/vercel-labs/agent-skills/react-best-practices` | creation, polishing | NO | YES | React/Next.js performance guidance for the application stack. |
| `/opennextjs/opennextjs-cloudflare` | troubleshooting, deep-dive | NO | YES | Cloudflare deployment via OpenNext 1.20.15. |
| `/opennextjs/docs` | troubleshooting, deep-dive | NO | YES | Same deployment path. |
| `/cloudflare/workers-sdk` | troubleshooting, deep-dive | NO | YES | `wrangler` 4.148.0 and Workers deployment. |
| `/neondatabase/neon` | troubleshooting, security, deep-dive | NO | YES | `@neondatabase/serverless` imported by `app/lib/db-init.js`. |
| `/upstash/docs` | troubleshooting, security, deep-dive | NO | YES | `@upstash/redis` imported by spam protection, visits and gift-email paths. |
| `/getsentry/sentry-docs` | troubleshooting, testing, security, deep-dive | NO | YES | Declared `@sentry/nextjs` (no direct import found in current code). |
| `/websites/developer_chrome` | troubleshooting, polishing, testing, security, audio, deep-dive, seo | YES | YES | General Chrome/browser documentation retained as instructed; source repointed off the Offscreen API page. |
| `/websites/developer_apple_webkit` | troubleshooting, polishing, testing, security, audio, deep-dive, seo | NO | YES | Safari/WebKit audio and rendering behavior relevant to the site. |
| `/cloudflare/cloudflare-docs/turnstile` | troubleshooting, security | NO | YES | Turnstile verification is live on public forms. |
| `/cloudflare/cloudflare-docs/pages` | troubleshooting, deep-dive | NO | YES | Cloudflare Pages/Workers hosting. |
| `/websites/neon` | troubleshooting | NO | YES | Neon documentation index; database is live. |
| `/websites/mdn_web_audio` | troubleshooting, audio, deep-dive | NO | YES | Web Audio used across the audio/reveal system. |
| `/debian/debian-reference` | troubleshooting, deep-dive | NO | YES | Linux/shell environment reference; explicitly retained. |
| `/llmstxt/gsap_llms_txt` | polishing | NO | YES | `gsap` declared and referenced in `components/DailyResonance.tsx`. |
| `/dequelabs/axe-core` | polishing, testing, deep-dive | NO | YES | `axe-core` and `@axe-core/react` declared accessibility tooling. |
| `/magicuidesign/magicui` | polishing | NO | **NO** | Not a declared dependency and no code reference found. Retained because removal was not authorized. |
| `/goldfire/howler.js` | polishing, audio | NO | YES | `howler` imported by the reveal and `app/lib/audio.js`. |
| `/testing-library/react-testing-library` | testing | NO | YES | `@testing-library/react` used by the component suites. |
| `/microsoft/playwright` | testing, deep-dive | NO | YES | Playwright 1.64.1 visual and browser tests. |
| `/vitest-dev/vitest` | testing, deep-dive | NO | YES | Vitest 5.0.0 unit suite. |
| `/colinhacks/zod` | testing, security | NO | YES | Declared dependency `zod`. |
| `/cure53/dompurify` | security | NO | YES | Declared dependency `dompurify` (no direct import found in current code). |
| `/stripe/stripe-js` | security, deep-dive | NO | YES | `@stripe/stripe-js` and `stripe` declared; server Stripe APIs are live. |
| `/resend/resend-node` | security, deep-dive | NO | YES | `resend` imported by gift-email and suggestions paths. |
| `/marsidev/react-turnstile` | security | NO | YES | `@marsidev/react-turnstile` imported by the Turnstile field and homepage. |
| `/upstash/ratelimit` | security | NO | **NO** | Not a declared dependency (`@upstash/redis` is) and no import found. Retained; removal not authorized. |
| `/trailofbits/skills/fp-check` + 6 supporting fp-check references | security, deep-dive | NO | YES | Security finding verification and DevSkim/SARIF workflow used in this repository. |
| `/trailofbits/skills/sarif-parsing` (+ `sarif-parsing-jq-queries`) | security, deep-dive | NO | YES | SARIF processing is part of the DevSkim workflow. |
| `/trailofbits/skills/post-patch-validation` (+ `post-patch-validation-evidence-model`) | testing, security | NO | YES | Post-patch evidence standard used by security repairs. |
| `/posthog/posthog-js` | deep-dive | NO | **NO** | Not a declared dependency and no code reference found. Retained as instructed; removal not authorized. |

**Audit outcome for group assignment**: only NumPy's assignment was clearly wrong (documented NumPy usage lives entirely in the audio/media tooling while it was routed from Polishing). Every other identifier's subject and project use matched at least one of its assigned groups; no further moves were made because the evidence did not clearly support a better group and additional removals were not authorized.

## 3. What was implemented

- **Manifest** (`.docs/manifest.json`): removed `/python-pillow/Pillow`, `/android/developers` and `/google-gemini/gemini-cli` from every `groups` list, `sources`, `inventory` and `githubShas`; moved `/numpy/numpy` from `polishing` to `audio`; repointed `/websites/developer_chrome` from the Offscreen API page to `https://developer.chrome.com/docs/web-platform` while keeping the identifier and its seven routes. Structure (`lastUpdated`, `groups`, `sources`, `inventory`, `githubShas`) and every unrelated entry preserved. `lastUpdated` is left to the updater's own bookkeeping.
- **Snapshots**: deleted the canonical Gemini CLI snapshot plus its two symlinks, the Android Developers snapshot, and the Pillow snapshot; moved the NumPy snapshot to `.docs/audio/`; replaced the Offscreen HTML snapshot with the general Chrome web-platform page fetched with the updater's own user agent and recreated the six relative symlinks so the layout still matches the updater's canonical-file-plus-symlinks model.
- **Specialist routing**: removed the three "Conditional Gemini CLI Reference" sections (`creation`, `troubleshooting`, `deep-dive`), the Android Developers and Pillow entries, and moved NumPy from `.freebuff/polishing.md` to `.freebuff/audio.md`.
- **Test**: `__tests__/reviewer-retirement.test.ts` now asserts the retained Gemini API skill snapshot instead of the deleted Gemini CLI snapshot; the historical reviewer specs and manifest assertions are unchanged, so the retirement guard keeps its meaning.
- **Spec Kit**: `specs/099-docs-library-routing-cleanup/{spec,plan,tasks}.md` and `.specify/feature.json`.

### Files changed

```text
.docs/manifest.json                                        (routing, sources, inventory, SHA pins)
.docs/polishing/_numpy_numpy.md -> .docs/audio/_numpy_numpy.md
.docs/polishing/_python-pillow_Pillow.md                    (deleted)
.docs/deep-dive/_android_developers.md                     (deleted)
.docs/creation/_google-gemini_gemini-cli.md                 (deleted, canonical)
.docs/deep-dive/_google-gemini_gemini-cli.md                (deleted, symlink)
.docs/troubleshooting/_google-gemini_gemini-cli.md          (deleted, symlink)
.docs/troubleshooting/_websites_developer_chrome.md         (Offscreen page replaced; 6 symlinks unchanged in target)
.freebuff/audio.md, .freebuff/polishing.md                  (NumPy move)
.freebuff/creation.md, .freebuff/troubleshooting.md, .freebuff/deep-dive.md
.specify/feature.json
__tests__/reviewer-retirement.test.ts
specs/099-docs-library-routing-cleanup/{spec,plan,tasks}.md
memory-bank/activeContext.md
PR_SUMMARY.md
```

**Not changed**: `scripts/refresh-docs.js`, `scripts/test-refresh-docs.js`, `.github/workflows/refresh-docs.yml` and every other workflow, all application source, themes, assets, dependencies, lockfile, payment/email/database/security configuration, and deployment settings. The staged diff contains no path under `app/`, `components/`, `themes/`, `public/`, `.github/workflows/`, `package.json` or `pnpm-lock.yaml`.

## 4. Spec Kit stages

| Stage | Artifact |
| --- | --- |
| specify | `specs/099-docs-library-routing-cleanup/spec.md` |
| plan | `specs/099-docs-library-routing-cleanup/plan.md` |
| tasks | `specs/099-docs-library-routing-cleanup/tasks.md` |
| implement | This diff |

## 5. Verification results

| Check | Result | Evidence |
| --- | --- | --- |
| Baseline library audit | **PASS** | Before: 71 sources / 71 inventory / 71 routed, no orphans, no missing snapshots, no broken symlinks. After: 68 / 68 / 68, 55 SHA pins, orphans `[]`, missing `[]`, broken symlinks `[]`, no routed identifier without a source/inventory entry. |
| Retired identifiers fully absent | **PASS** | Script check: no occurrence of the three retired IDs in any group, `sources`, `inventory` or `githubShas`; snapshots and symlinks deleted. |
| Retained references present | **PASS** | Script check: Gemini API (3 groups + web overview), Debian Reference (2), PostHog JS (1), Magic UI (1) unchanged; `developer_chrome` still routed from 7 groups. |
| Focused regression test | **PASS** | `pnpm exec vitest run __tests__/reviewer-retirement.test.ts` → 1 file / 4 tests. |
| Full unit suite | **PASS** | `pnpm exec vitest run` → 43 files / 343 tests. |
| TypeScript | **PASS** | `pnpm exec tsc --noEmit` exit 0. |
| Repository gate | **PASS** | `SPEC_KIT_BASE_REF=743a1ce84e6b8ef52eec7b40620cd9fa98bc75e8 ./freebuff-verify.sh` exit 0 (bootstrap, frozen install, Spec Kit verifier tests, Spec Kit artifact gate, typecheck, production build, refresh-docs tests). |
| Updater contract | **PASS** | `node scripts/test-refresh-docs.js` → 19 passed / 0 failed, with the updater and its tests unmodified. |
| Production build size | **PASS** | `.next` 299,056,298 B + `public` 32,840,043 B = **331,896,341 B (316.52 MiB)** — below the 495 MB hard maximum. |
| Protected-path audit | **PASS** | `git diff --cached --name-only` shows no updater, workflow, application, asset, dependency or lockfile path. |
| PR-head CI | **PENDING** | Not run yet; this report claims no CI result. |
| Browser / visual checks | **NOT RUN** | No UI, visual or behavioral code changed; the task explicitly excludes them. |

**Note on the comparison base**: the cloud worktree's `freebuff-base` ref is an unrelated initial commit with no merge base, so the gate was run with `SPEC_KIT_BASE_REF=743a1ce8` (the real task base). The gate itself is unmodified.

## 6. Remaining issues and limitations

- The general Chrome snapshot was fetched once with the updater's user agent rather than by the updater itself. If upstream output differs, the next scheduled refresh treats it as a normal content update; the manifest URL is the authoritative routing change.
- Pillow non-use is a static result: no `PIL`/`Image.open`/`import PIL` in application code, scripts or `setup-media-tools.sh`. No Python virtualenv exists in this workspace to inspect installed packages.
- Four retained references (`posthog-js`, `magicui`, `@react-hooks/resolvers`-adjacent `react-three-fiber`, `@upstash/ratelimit`) have no declared dependency or code reference found. They were retained because removal was not authorized; they are recorded as `USEFUL: NO` work for a future approved cleanup.
- `lastUpdated` in the manifest was intentionally left to the updater so manual bookkeeping cannot conflict with scheduled refreshes.
- PR-head CI is unverified. No deployment was performed and none is part of this task.

## 7. Final statements

- Implementation: **COMPLETE** — every in-scope change is in place and the final diff was reviewed.
- Final diff/error check: **PASS** — 18 changed paths, all intentional; no error output in the verification logs.
- **USEFUL RESULT: YES** — the requested cleanup is implemented and verified by the repository gate, the affected tests, the updater contract and a programmatic manifest/snapshot audit. PR-head CI remains pending and is not claimed.
