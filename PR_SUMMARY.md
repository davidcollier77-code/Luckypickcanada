# Lucky Reveal Phase 3 audit: reliability, mobile and the missing sound mute control

## Task and task groups

**Task groups: `testing` + `audio` + `polishing`.**

- `testing` — Phase 3 is primarily a verification task: each of its eight requirements had to be
  exercised and recorded with real execution rather than code inspection.
- `audio` — the one confirmed deficiency is a sound-control gap, and browser playback restrictions,
  cleanup and device behaviour are all audio concerns.
- `polishing` — the remaining requirements are the shipped feel: reduced motion, visual glitches,
  clipping, overlaps and asset weight.

**Assigned task:** audit Phase 3 (Reliability and Performance) of the reveal roadmap, repair only
confirmed Phase 3 deficiencies, and report evidence per requirement. Phase 4 was not started and the
temporary FREE Preview access is untouched.

## Audit result

| # | Requirement | Status | Evidence |
|---|---|---|---|
| 1 | 6 Pick and 7 Pick on mobile, especially Android | PASS (emulated) | Chromium Pixel 7 UA at 412x915 and 390x844, both games, Personal and Gift: 6 or 7 unique in-range numbers, 0 px horizontal overflow, panel 15..397 / 15..375 |
| 2 | Sound mute/unmute controls | **FAIL → repaired** | No control existed anywhere in the product (`mute`, `soundEnabled`, `audioEnabled`, `aria-pressed` matched only an unrelated map filter). Added and verified end-to-end |
| 3 | Browser audio restrictions and device mute | PASS (browser) / device unverified | Every `play()` rejected like an autoplay policy: 4 rejections, 0 uncaught errors, 2 expected playback logs, visual finish complete, close and map usable. Device-level mute untestable here |
| 4 | `prefers-reduced-motion` respected | PASS | 55 samples, no particle canvas, 0 reveal cue plays, static settled-leaf finish |
| 5 | Animations and sounds clean up | PASS | After close: no dialog, no canvas, no celebration layer, 0 media elements playing, no late applause |
| 6 | Dependencies, asset sizes, overhead | PASS | Howler still the only (lazy-loaded) audio dependency; applause 493,964 B, pop 43,244 B, sparkle 20,435 B; no new dependency, no re-encode |
| 7 | Existing functionality intact | PASS | Full Vitest 37 files / 385 tests, `tsc --noEmit` exit 0, `./freebuff-verify.sh` passed, numbers/share/close/map verified in-browser |
| 8 | Visual glitches, clipping, overlaps, loading | PASS | No page or panel horizontal overflow, controls hit-test to themselves, close and sound controls never overlap, sharing actions 55–75 px and unclipped, no failed requests |

The reveal's audio was already well behaved: browser-blocked playback is logged and never thrown,
reduced motion silences every cue, and the session-owned lifecycle stops sound and releases the canvas
on close. The single Phase 3 gap was requirement 2.

## What was implemented

The applause, the sparkle and the celebration pop all start without a separate sound prompt, and the
applause alone runs 5.6 s, so Phase 3 requirement 2 and WCAG 2.2 SC 1.4.2 (Audio Control) both need a
control the visitor can reach. The repair is confined to the reveal's own sound.

- `app/lib/audio.js` — one module-level reveal mute flag with `setRevealAudioMuted(muted)` /
  `isRevealAudioMuted()`. Muting stops the reveal sparkle, applause and celebration pop immediately;
  the sparkle and the applause then refuse to start, and the applause cue is consumed while muted so a
  decode that finishes after the mute cannot start late. The preference belongs to the page session,
  survives closing and reopening, and never touches Crystal Ball or the homepage.
- `app/lucky-reveal-popup.js` — a 44x44 toggle in the first content row, clear of the pinned close
  button, with `aria-pressed`, an action-naming `aria-label`, a speaker / speaker-off icon, matching
  hover treatment and no motion under reduced motion.
- `app/lucky-reveal-celebration.jsx` — consults the same flag before playing the confetti pop. The
  burst, leaves and golden pulses are never conditional on sound.
- `__tests__/reveal-audio-mute.test.js` (new) — drives the real module with a controllable Howl: state
  reporting, silence while muted, immediate stop on mute, a decode completing after the mute, and the
  preference surviving a new session.
- `__tests__/lucky-reveal-phase3.test.js` — four source guards for the control, its wiring, the mute
  path and the celebration gate.
- `__tests__/components/LuckyRevealCelebration.test.jsx` — supplies the new module export in its audio
  mock.
- `artifacts/reveal-phase3-audit-probe.cjs` (new) — the eight-scenario audit probe. Its generated JSON
  stays local (like the Phase 3 probe) and is not committed.
- `specs/081-lucky-reveal-finish-and-media-capability/{spec,plan,tasks}.md`,
  `.specify/feature.json` — the Spec Kit artifacts for this cycle (reused feature directory, no new
  one), plus this summary and the Memory Bank note.

Not changed: assets, CSS keyframes, number generation, artwork, copy, prices, payments, gift email,
API routes, database, Crystal Ball, Little Luck Map and deployment configuration.

## Spec Kit stages

| Stage | Result | Artifact |
|---|---|---|
| Specify | Done | `specs/081-lucky-reveal-finish-and-media-capability/spec.md` — Phase 5, FR-030…FR-035, SC-012…SC-016 |
| Plan | Done | `specs/081-lucky-reveal-finish-and-media-capability/plan.md` — Phase 5 approach |
| Tasks | Done | `specs/081-lucky-reveal-finish-and-media-capability/tasks.md` — Phase 12, T053…T061 |
| Implement | Done | T053…T061 completed and marked `[x]` |

## Documents consulted (manifest routing)

No `.docs/` reference document was materially needed: the change uses the existing Howler patterns in
`app/lib/audio.js`, existing React/CSS conventions and the repository's own Playwright setup.

| Document | USED | USEFUL | Note |
|---|---|---|---|
| `/websites/mdn_web_audio` | NO | NO | Howler's HTML5 mode and the existing helpers already define the audio path; no Web Audio API change |
| `/goldfire/howler.js` | NO | NO | The mute repair reuses the project's existing Howl `stop()`/`play()`/state pattern |
| `/websites/developer_chrome` | NO | NO | Autoplay behaviour was reproduced by rejecting `play()` in the probe, not from docs |
| `/websites/developer_apple_webkit` | NO | NO | No iOS-specific behaviour was changed |
| `/websites/mdn_image_types` | NO | NO | No raster asset or format decision in this task (applause kept as the approved recording) |
| `/microsoft/playwright` | NO | NO | The probe follows the repository's existing probe scripts |
| `/vitest-dev/vitest` | NO | NO | New tests copy the existing hoisted Howl harness |
| `/testing-library/react-testing-library` | NO | NO | Component test change is a one-line mock export |
| `/dequelabs/axe-core` | NO | NO | Accessibility was checked with ARIA state and hit-testing, not an axe run |
| `/google/eng-practices` | NO | NO | Governance rules in `AGENTS.md` already cover scope and verification |
| Other routed sources (Next.js, React, Tailwind, Motion, GSAP, Lucide, Sonner, Magic UI, Sharp, WebP, web.dev images, Pillow, NumPy, GitHub docs, Zod, Sentry) | NO | NO | Unrelated to a reveal audio/layout audit |

## Verification

| Check | Result |
|---|---|
| Focused Vitest (`lucky-reveal-phase3`, `reveal-audio-mute`, `components/LuckyRevealCelebration`, `lucky-reveal-celebration`) | **PASS** 4 files / 55 tests |
| Full `pnpm exec vitest run` | **PASS** 37 files / 385 tests |
| `pnpm exec tsc --noEmit` | **PASS** exit 0 |
| `./freebuff-verify.sh` | **PASS** — "All verification steps passed" (Spec Kit gate, typecheck, production build, refresh-docs 19/19) |
| Production build size | **PASS** `.next` 317,499,221 B / 302.8 MiB + `public` 32,840,043 B; combined 350,339,264 B / 334.1 MiB, below the 495 MB maximum |
| Chromium audit probe (`artifacts/reveal-phase3-audit-probe.cjs`, production build) | **PASS** 156/156 checks over 8 scenarios |
| `pnpm install --frozen-lockfile` | PASS (lockfile unchanged) |

The verification gate was run with `SPEC_KIT_BASE_REF=9b43b1da`: this workspace's `origin/main` ref was
stale at `a2c1222a` (PR #1676) while the branch starts at `9b43b1da` (PR #1699 merge), so the gate saw
133 unrelated files and many feature directories. With the correct task base it verifies
`specs/081-.../{spec,plan,tasks}.md` and passes. In CI the base ref resolves normally.

## Remaining issues / not verified

- **Physical Android device (Samsung) — NOT VERIFIED.** Mobile evidence is Chromium Android emulation
  (Pixel 7 UA, 412x915 and 390x844), not a real handset.
- **Device-level mute and volume — NOT VERIFIED.** HTML5 media honours the OS mute/volume by design;
  no hardware was available to demonstrate it.
- **Audible playback and loudness — NOT VERIFIED.** The workspace has no audio output device; playback
  was verified at the media-element/AudioBufferSource level, not by listening.
- The applause asset stays the approved 493,964 B 16-bit WAV. Re-encoding it would shrink it, but it
  would change an approved recording, so it is reported as measured overhead rather than altered.

## Behaviour preserved

Sound assets, artwork, layout, copy, keyframes, number generation (6 → 1–49, 7 → 1–50), row layout,
sharing ladder, close/Escape/autofocus, the gold map CTA, prices, Stripe checkout, gift email, Resend,
database, API routes, authentication, `.docs/`, and the temporary FREE Preview switch are unchanged.
The new control adds no sound, no request and no dependency.

## Final diff audit

Eight files modified and four added, all listed above; the complete diff was read before submission.
No unrelated change, no formatting-only churn, no generated probe report, no secret.

**USEFUL RESULT: YES** — Phase 3 is implemented and verified to the extent this workspace allows, with
the three device-level checks listed explicitly as unverified.
