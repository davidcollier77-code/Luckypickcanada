# Cinematic Lucky Card reveal and premium card finish

## Task and task groups

**Assigned task:** Fully enhance the daily Lucky Card Reveal at `/reveal` across all three tiers —
Standard, Premium and Flagship — with a more cinematic and spectacular sequence (polished effects,
depth, lighting, transitions), and give every card a premium, consistent glossy finish that preserves
its existing design and artwork. Inspect the previous enhancement attempt and correct what it left
incomplete. Visual only: no functionality, number generation, tier behaviour or payment flow may
change.

**Selected task groups:**

- `polishing` — the task is a visual-quality upgrade of a protected, already-approved UI surface, so
  the polishing group's visual, accessibility and reduced-motion rules apply.
- `testing` — the change is user-facing animation and lighting, so the tier contract, structural
  guard, full suite and rendered browser evidence must be executed and reported.

## What the previous attempt left incomplete (verified in the shipped code)

| Finding | Evidence before this change |
| --- | --- |
| The reveal moment had no light event | `app/lucky-card-reveal.js` mounted only a static halo and rim once `isRevealed` was true |
| The card finish was one flat gradient | `cardPolishSheenStyle` was a single 118° linear gradient plus a 1 px frame and one inset edge line |
| One card was excluded from the finish | `preserveCoastToCoastPolish` skipped the sheen, edge and tier ring entirely for `coast-to-coast-tale` |
| The card back was never finished | The back face received the sheen/edge only; no specular, bloom or glint anywhere |
| No cinematic depth or transition | No spotlight, shaft, shockwave, embers, floor shadow; the chip, quote and share control appeared instantly |

## Implementation

**`app/lucky-card-presentation.js`** — each tier gains `spotlightOpacity`, `shockwaveOpacity`,
`shockwaveScale`, `glossOpacity`, `sweepDuration` and `emberOpacity`. The existing own-property lookup
and Standard fallback are unchanged; the original tier values are untouched.

| Tier | Spotlight | Shockwave (opacity / scale) | Gloss | Sweep | Embers |
| --- | --- | --- | --- | --- | --- |
| Standard | 0.24 | 0.42 / 1.45 | 0.16 | 1.15 s | 0.50 |
| Premium | 0.32 | 0.56 / 1.60 | 0.22 | 1.30 s | 0.66 |
| Flagship | 0.42 | 0.70 / 1.80 | 0.30 | 1.45 s | 0.82 |

**`app/lucky-card-reveal.js`**

- One module-scope `CardFinish` component paints the identical finish on the back and front of every
  card: diagonal gloss, top-left specular highlight, bevel edge. The revealed front additionally gets
  a tier-coloured bottom gloss bloom and exactly one diagonal glint pass. The back never shows the
  tier accent, so the pull is not given away before the flip.
- `coast-to-coast-tale` now receives that finish and the tier ring; its authored frame is still
  preserved through `style={preserveCoastToCoastPolish ? undefined : cardPolishFrameStyle}` and is
  marked `data-card-frame="authored"`.
- The stage gains a tier-tinted charging aura while the draw runs, and on reveal a light shaft,
  spotlight, the existing halo and rim, two expanding shockwave rings, six one-shot embers and a
  floor shadow. Every layer is `aria-hidden` and `pointer-events: none`; the shockwave, embers and
  glint are mounted only when motion is allowed.
- The tier block, quote panel and share control settle in with 0.12 / 0.24 / 0.34 s delays. Their
  copy, order, classes and layout are unchanged.

**Tests**

- `__tests__/lucky-card-tier-presentation.test.js` — every shipped card resolves a complete finish
  palette; all six new values escalate Standard < Premium < Flagship and stay bounded so the finish
  cannot hide the artwork.
- `__tests__/lucky-card-reveal-presentation.test.js` — pins the two-face finish, the five finish
  layers, the stage layers, the removed single-sheen/Coast exception, the reduced-motion gating, the
  staged delays, the preserved authored frame and every functional contract (storage key, weighting,
  quote selection, collection write, `TIER_HITS`, flip timings, audio cues, artwork URLs, share,
  binder, Return to Home, and the exact import list proving no dependency was added).

**Files changed**

```text
app/lucky-card-presentation.js
app/lucky-card-reveal.js
__tests__/lucky-card-tier-presentation.test.js
__tests__/lucky-card-reveal-presentation.test.js
artifacts/reveal-card-cinematics/probe.cjs
artifacts/reveal-card-cinematics/out/cloud-browser-report.json
artifacts/reveal-card-cinematics/out/revealed-flagship-cloud.png
specs/101-lucky-card-reveal-cinematics/{spec,plan,tasks}.md
.specify/feature.json
artifacts/reveal-card-cinematics/out/pr1743-review-findings.md
memory-bank/activeContext.md
memory-bank/progress.md
PR_SUMMARY.md
```

## Spec Kit stages

| Stage | Artifact |
| --- | --- |
| Specify | `specs/101-lucky-card-reveal-cinematics/spec.md` |
| Plan | `specs/101-lucky-card-reveal-cinematics/plan.md` |
| Tasks | `specs/101-lucky-card-reveal-cinematics/tasks.md` |
| Implement | the code and test changes above, recorded in `tasks.md` |

One feature directory, no duplicates; `.specify/feature.json` points at it. No `.docs/` file was
modified. The PR-review addendum is recorded in the same three artifacts (spec and plan addenda,
Phase 8 / T017–T023), so this task created no duplicate feature directory.

## Reference documents reviewed

The manifest routes the selected groups to the library snapshots below. In this checkout the
polishing symlinks do not resolve (`.docs/.snapshots` is not materialized), so the ones attempted
could not be read; they are recorded honestly rather than claimed.

| Document | USED | USEFUL | Note |
| --- | --- | --- | --- |
| `.docs/manifest.json` | YES | YES | Routing index; confirmed the `polishing` and `testing` document sets and that `.docs/` is read-only. |
| `.docs/polishing/_websites_motion_dev.md` | NO | NO | Symlink target unresolvable in this checkout (`Too many levels of symbolic links`); the Framer Motion usage was verified against the installed package and the shipped component instead. |
| `.docs/polishing/_websites_tailwindcss.md` | NO | NO | Same broken symlink; no new Tailwind configuration or class system was introduced. |
| `.docs/polishing/_websites_mdn_image_types.md` | NO | NO | Not consulted: no raster format, encoding or delivery decision was in scope; artwork paths and AVIF/WebP fallbacks are untouched. |
| `.docs/polishing/_dequelabs_axe-core.md` | NO | NO | Not consulted or run; accessibility was preserved by construction (decorative layers `aria-hidden`, no name/role change) and by the structural guard. |
| `.docs/polishing/_google_eng-practices.md` | NO | NO | Not consulted. |
| `.docs/polishing/_vercel-labs_agent-skills_react-best-practices.md` | NO | NO | Not consulted. |
| `.docs/testing/_google_eng-practices.md` | NO | NO | Not consulted. |

## Verification

| Check | Status | Evidence |
| --- | --- | --- |
| Focused suites | PASS | `pnpm exec vitest run __tests__/lucky-card-tier-presentation.test.js __tests__/lucky-card-reveal-presentation.test.js` → 2 files / 12 tests passed. |
| Full unit suite | PASS | `pnpm exec vitest run` → 44 files / 351 tests passed. |
| Type check | PASS | `pnpm exec tsc --noEmit` → exit 0. |
| Build + repository gate | PASS | `./freebuff-verify.sh` → exit 0 (Spec Kit artifact gate, type check, production build, refresh-docs 19/19). |
| Build size | PASS | `.next` 317,064,504 B + `public` 32,840,043 B = **349,904,547 B (333.7 MiB)**, below the 495 MB maximum. |
| Build + gate (this review run) | PASS | `./freebuff-verify.sh` → exit 0 (frozen install, Spec Kit governance gate, `tsc --noEmit`, production build, refresh-docs 19/19). |
| Build size (this review run) | PASS | `.next` 317,067,315 B + `public` 32,840,043 B = **349,907,358 B (333.7 MiB)**, below the 495 MB maximum. |
| Unit suites (this review run) | PASS | `pnpm exec vitest run` → 44 files / 351 tests passed, exit 0. |
| Rendered reveal, three tiers | PASS | Managed cloud browser against the production build: chip/name/caption/quote, tier-accent spotlight, shaft, halo, two shockwaves, six embers, floor shadow, 0 px overflow, artwork URLs unchanged; tier block and quote settled at opacity 1. |
| Both card faces / all cards | PASS | Each tier: back `[gloss, specular, bevel]`, front `[gloss, specular, bevel, tier-bloom, glint]`. Coast-to-Coast Tale: shared finish plus premium ring, authored frame preserved (`data-card-frame="authored"`, border width 0 px). |
| Charging aura during the draw | PASS | Aura rendered with the drawn tier's accent, `aria-hidden`, `pointer-events: none`; two beam canvases still running; entry control removed while drawing. |
| Entry accessible name | PASS | `Reveal Today's Luck` (exact), described by `lucky-card-reveal-hint`, 58 px target. |
| Local Playwright probe | **BLOCKED** | `node artifacts/reveal-card-cinematics/probe.cjs` exits 2: Chromium cannot launch (`libnspr4.so`, `libnss3.so`, `libatspi.so.0`, `libatk*`, `libX*`, `libasound`, `libxkbcommon` absent), the sandbox package lists are empty and there is no root to install them. The managed Playwright bridge also returned an internal `options.mode` error. |
| Reduced motion, rendered | **NOT RUN** | `prefers-reduced-motion` emulation was unavailable in the browser path used. Covered only by the structural guard, which pins the `!shouldReduceMotion` gates and zero-duration static layers. |
| Console/page errors | **NOT RUN** | The evaluation harness attached no console listener. The pages rendered without a visible error state. |
| Graphite AI Reviews (CI) | PASS | Check run `128147449633` success, "AI review ran and left 4 comments"; all four threads are assessed in the review section. |
| Visual QA (CI) | PASS, but not covering this surface | Check run `128145862084` success (3 annotations). `tests/visual/` has no `/reveal` spec, so this pass is not evidence for the reveal. |
| DevSkim (CI) | PASS | Check run `128146212628`: "No new alerts in code changed by this pull request". |
| Updater scheduler checks (CI) | PASS / SKIPPED | Verify `128146861496` success; Deploy `128146863502` and Append alerts `128146291195` skipped by path filter. |
| Pullfrog (CI) | **FAIL (external)** | Google AI Studio free-tier quota exhausted for `gemini-3.8-flash`; the bot produced no review. Not a code defect. |
| Remaining check runs | **NOT ENUMERATED** | 13 runs exist on the reviewed head; ~6 could not be retrieved individually (integration payload truncation and a rate-limited REST API). Their conclusions are not claimed. |

Two harness defects were found and corrected during the rendered checks, not product defects: the
first pass clicked the CollectionBinder "View Collection" button instead of the reveal control (6
failed checks re-run and passing), and one comparison used raw `textContent`, which includes the
decorative aria-hidden ♠ glyph (the accessible name was then verified separately as exact). Both are
recorded in `artifacts/reveal-card-cinematics/out/cloud-browser-report.json`.

## Independent review of PR #1743 feedback (2026-11-06)

Audit only — this review changed no application code, test, dependency, workflow or visual baseline,
and did not reply to, resolve, approve or merge anything. Reviewed head `18731264`. Sources: three
conversation comments, four inline threads on one `COMMENTED` review, and 13 check runs (seven
identified individually). Full evidence, method and limitations:
`artifacts/reveal-card-cinematics/out/pr1743-review-findings.md`.

| # | Feedback | Verdict | Evidence at the reviewed head | Recommended action |
| --- | --- | --- | --- | --- |
| 1 | Ember elements use the array index as a React key (`app/lucky-card-reveal.js:2061`) | **Partially valid** — no current defect | `REVEAL_EMBERS` is a fixed module-scope literal of six entries (`:76–83`), never reordered or filtered, and its length does not vary by tier; `ember-0…5` are therefore stable keys and a re-render does not remount the nodes, so the documented no-restart guarantee holds | Optional: derive a content key (for example from `x`/`y`) so the guarantee survives a future dynamic list. Not a blocker |
| 2 | The glint has no `key`/`AnimatePresence`, so the single-pass guarantee "only holds if there are zero re-renders" (`:127–140`) | **Invalid** — inverts the required behaviour | The glint is mounted only inside `{revealed && !shouldReduceMotion && (` (`:125`), i.e. once at the flip. Framer Motion runs the keyframe array on mount and does not replay a finished animation on re-render; "completed at opacity 0" **is** exactly one pass. A key change or remount is what would risk a second pass | None |
| 3 | The reduced-motion test slice depends on JSX source order (`__tests__/lucky-card-reveal-presentation.test.js:127–133`) | **Partially valid** — real fragility, stated mechanism wrong | The searched literal `{!shouldReduceMotion && (` matches only `:1998` (line 125 reads `{revealed && !shouldReduceMotion && (`), and the end anchor sits after the ember block, so the assertions are meaningful today. An inverted order yields an empty slice and fails loudly, not silently. The true weakness is that range containment does not prove gating: JSX moved outside the conditional but before the floor shadow would still pass | Optional test hardening (brace-matched block or rendered assertion). Not a blocker |
| 4 | Reduced motion is covered only by a source-text guard and should be a merge blocker (`PR_SUMMARY.md:130`) | **Valid — the only genuine merge blocker** | `playwright.config.ts` targets `tests/visual/`, whose 8 specs cover the crystal ball, gold CTAs, homepage, paid reveal selection and Turnstile — **none exercises `/reveal`**. The passing Visual QA run therefore cannot cover this surface, and the acceptance criterion remains unproven in a browser | Required follow-up: a Playwright test with `page.emulateMedia({ reducedMotion: 'reduce' })` asserting zero shockwave/ember/glint nodes after reveal while the static shaft, spotlight and halo stay visible. Test changes are outside this audit's scope |

Bot and CI feedback: **Pullfrog FAIL** is an external Google AI Studio free-tier quota error
(`gemini-3.8-flash`), not a code defect, and was not topped up; **PR-Tagger** posted two duplicate
informational analyses whose "ensure adequate test coverage" remark matches finding 4; **Visual QA**
and **DevSkim** pass, but the former has no `/reveal` coverage (see finding 4); the updater-scheduler
checks pass or skip by path filter.

**Merge blockers:** exactly one — finding 4 (unproven reduced-motion behaviour on `/reveal`). Findings
1 and 3 are optional hardening; finding 2 needs no change.

## Behavior preserved

- `LUCKY_CARDS`, `selectWeightedLuckyCard` (weights, tier probabilities, anti-repeat) and
  `selectRandomQuote` untouched; no number-generation or tier-difference change.
- Daily localStorage lock, `unlockedCards` write and the update event unchanged.
- Audio cues, `TIER_HITS` (3/4/5), `FINAL_FLIP_TIME`, `FINAL_FLIP_DURATION`, canvas beam
  choreography and flip timings unchanged.
- Card artwork, AVIF-first/WebP fallback, `alt` text and card titles unchanged.
- Share control, collection binder, countdown, Return to Home link unchanged.
- Payments, API routes, authentication, database, deployment configuration, environment variables and
  secrets untouched; the paid Lucky Reveal popup and Crystal Ball were not modified.
- No dependency, route, network request or asset added.

## Remaining issues and limitations

- Reduced-motion rendering is unverified in a real browser; only the executed structural guard covers
  it. This is the main outstanding check.
- The local Playwright probe is committed but cannot execute in this sandbox; it is ready for CI or
  any environment with Chromium system libraries.
- The rendered evidence came from an in-page harness in the managed cloud browser rather than the
  repository's Playwright runner; automation/console assertions are therefore not equivalent to the
  visual QA suite.
- The pull request is [#1743](https://github.com/davidcollier77-code/Luckypickcanada/pull/1743),
  open against `main` and unmerged; the review was performed at `18731264` and this report update adds
  a documentation-only commit on the same branch.
- The independent review confirms that reduced motion on `/reveal` is the only genuine merge blocker
  and that `/reveal` has no automated browser coverage at all; that is a coverage gap in the
  repository's visual suite, not a regression introduced here.

**Implementation status:** COMPLETE — unchanged by this review; no application code, test, dependency
or workflow file was touched, and the final diff for this task is documentation and evidence only.

**Review status:** COMPLETE — all four Graphite threads, the conversation comments and the identifiable
CI results are assessed with cited code and API evidence; the four verdicts are 1 partially valid,
1 invalid, 1 partially valid, 1 valid-and-blocking.

**Verification status:** PARTIAL — build, type check, unit suites and rendered tier/finish/stage
checks pass; the local Playwright probe is BLOCKED and rendered reduced-motion is NOT RUN. The review
found no new defect and did not change that status.

**USEFUL RESULT: NO** — a mandatory visual check (reduced motion in a browser) remains unverified, so
verified completion cannot be claimed. The review itself is complete and every other executed check is
reported above.
