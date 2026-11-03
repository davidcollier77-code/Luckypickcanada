# Lucky Reveal Phase 3 audit: reliability, mobile and automatic sound without an in-app mute control

## Task and task groups

**Task groups: `testing` + `audio` + `polishing`.**

- `testing` — Phase 3 is a verification task: each of its eight requirements has to be exercised and
  recorded with real execution rather than code inspection.
- `audio` — the sound assets, the automatic cue sequence, the autoplay-failure path, reduced-motion
  silence and close cleanup are all audio behaviour this task had to keep exactly as shipped.
- `polishing` — the remaining requirements are the shipped feel: reduced motion, clipping, overlaps and
  asset weight.

**Assigned task:** audit Phase 3 (Reliability and Performance) of the reveal roadmap, repair only
confirmed Phase 3 deficiencies, then — per the owner's decision — remove the interim mute control so the
reveal keeps its automatic sound with no in-app mute button. Phase 4 was not started and the temporary
FREE Preview access is untouched.

## Audit result

| # | Requirement | Status | Evidence |
|---|---|---|---|
| 1 | 6 Pick and 7 Pick on mobile, especially Android | PASS (emulated) | Chromium Pixel 7 UA at 412x915 and 390x844, both games, Personal and Gift: 6 or 7 unique in-range numbers, 0 px horizontal overflow, panel 15..397 / 15..375 |
| 2 | Reveal sound control | PASS — none shipped, by owner decision | Repository search finds no sound control (`mute`, `soundEnabled`, `audioEnabled`, `aria-pressed` match only the unrelated map filter); all 8 probe runs found 0 pressed-state and 0 mute/sound-named controls in the panel; owner chose automatic sound over an in-app mute button |
| 3 | Browser audio restrictions and device mute | PASS (browser) / device unverified | Every `play()` rejected like an autoplay policy: 4 rejections, 0 uncaught errors, visual finish complete, close and map usable. Device-level mute untestable here |
| 4 | `prefers-reduced-motion` respected | PASS | 55 samples, no particle canvas, 0 reveal cue plays, static settled-leaf finish |
| 5 | Animations and sounds clean up | PASS | After close: no dialog, no canvas, no celebration layer, 0 media elements playing, no late applause |
| 6 | Dependencies, asset sizes, overhead | PASS | Howler still the only (lazy-loaded) audio dependency; applause 493,964 B, pop 43,244 B, sparkle 20,435 B; no new dependency, no re-encode |
| 7 | Existing functionality intact | PASS | Full Vitest 36 files / 380 tests, `tsc --noEmit` exit 0, `./freebuff-verify.sh` passed, numbers/share/close/map verified in-browser |
| 8 | Visual glitches, clipping, overlaps, loading | PASS | No page or panel horizontal overflow, close control hit-tests to itself, sharing actions 55–75 px and unclipped, no shares or balls overlap, no failed requests |

The reveal's audio was already well behaved: browser-blocked playback is logged and never thrown, reduced
motion silences every cue, and the session-owned lifecycle stops sound and releases the canvas on close.
Nothing in Phase 3 required a change to the reveal's shipped behaviour.

## Owner decision and the final change

The audit's one open question was whether the automatic 5.6 s applause needs an in-app mute control
(WCAG 2.2 SC 1.4.2). The first revision of this PR added a 44 px toggle. **The owner then decided the
reveal should keep its automatic sound and offer no in-app mute button**, so that control was removed in
this same PR: the device's own volume and mute remain the way to silence it.

- `app/lib/audio.js`, `app/lucky-reveal-popup.js`, `app/lucky-reveal-celebration.jsx` — **identical to the
  task base commit**: no mute flag, setter/getter, toggle, icon, pressed state, CSS rule or gate in the
  sparkle, applause or pop. Automatic playback is the only path.
- `__tests__/reveal-audio-mute.test.js` — deleted (the behaviour no longer exists).
- `__tests__/lucky-reveal-phase3.test.js` — the mute guards are replaced with four checks: the panel ships
  no toggle/state/icon, the audio module holds no mute state, every cue is called unconditionally, and
  reduced motion plus the close-session cleanup are intact.
- `__tests__/components/LuckyRevealCelebration.test.jsx` — the mute export is gone from its audio mock.
- `artifacts/reveal-phase3-audit-probe.cjs` (new) — eight-scenario audit that also asserts the panel shows
  no mute control and that the sparkle, pop and applause each play once automatically. Its generated JSON
  stays local and is not committed.
- `specs/081-lucky-reveal-finish-and-media-capability/{spec,plan,tasks}.md`, `.specify/feature.json`,
  `PR_SUMMARY.md`, `memory-bank/activeContext.md` — Spec Kit, summary and Memory Bank records, updated to
  the final implementation.

Not changed: sound assets and their bytes, volumes, mix, cue order or timing; artwork, keyframes, copy,
number generation, sharing, prices, payments, gift email, API routes, database, Crystal Ball, Little Luck
Map and deployment configuration.

## Spec Kit stages

| Stage | Result | Artifact |
|---|---|---|
| Specify | Done | `specs/081-lucky-reveal-finish-and-media-capability/spec.md` — Phase 5, FR-030…FR-035, SC-012…SC-016 |
| Plan | Done | `specs/081-lucky-reveal-finish-and-media-capability/plan.md` — Phase 5 approach and decision record |
| Tasks | Done | `specs/081-lucky-reveal-finish-and-media-capability/tasks.md` — Phase 12, T053…T061 |
| Implement | Done | T053…T061 completed and marked `[x]` |

## Reference documents

No `.docs/` document materially informed this task: it changes no audio API, asset format, framework or
Playwright usage, and the work reuses the repository's own audio module, its existing reveal tests and its
existing probe scripts. The manifest was consulted for routing only.

## Verification

| Check | Result |
|---|---|
| Focused Vitest (`lucky-reveal-phase3`, `components/LuckyRevealCelebration`, `lucky-reveal-celebration`, `reveal-applause-retry`, `lucky-reveal-finish-phase2`, `lucky-reveal-confetti-phase1`) | **PASS** 6 files / 76 tests |
| Full `pnpm exec vitest run` | **PASS** 36 files / 380 tests |
| `pnpm exec tsc --noEmit` | **PASS** exit 0 |
| `./freebuff-verify.sh` | **PASS** — "All verification steps passed" (Spec Kit gate, typecheck, production build, refresh-docs) |
| Production build (`pnpm build`, `next build --webpack`) | **PASS** `.next` 317,148,866 B / 302.5 MiB + `public` 32,840,043 B; combined 349,988,909 B / 333.8 MiB, below the 495 MB maximum (a clean `.next` build measured 299,738,399 B / 285.9 MiB) |
| Chromium audit probe (`artifacts/reveal-phase3-audit-probe.cjs`, production build) | **PASS** 144/144 checks over 8 scenarios |
| `pnpm install --frozen-lockfile` | PASS (lockfile unchanged) |

The verification gate was run with `SPEC_KIT_BASE_REF=9b43b1da`: this workspace's `origin/main` ref is stale
at `a2c1222a` (PR #1676) while the branch starts at `9b43b1da` (PR #1699 merge), so the gate saw 133
unrelated files and many feature directories. With the correct task base it verifies the Phase 5/Phase 12
artifacts and passes. In CI the base ref resolves normally.

## Remaining issues / not verified

- **Physical Android device (Samsung) — NOT VERIFIED.** Mobile evidence is Chromium Android emulation
  (Pixel 7 UA, 412x915 and 390x844), not a real handset.
- **Device-level mute and volume — NOT VERIFIED.** HTML5 media honours the OS mute/volume by design; no
  hardware was available to demonstrate it. With no in-app control this is the only way to silence the
  reveal, as the owner decided.
- **Audible playback and loudness — NOT VERIFIED.** The workspace has no audio output device; playback was
  verified at the media-element level, not by listening.
- The applause asset stays the approved 493,964 B 16-bit WAV. Re-encoding would shrink it, but it would
  change an approved recording, so it is reported as measured overhead rather than altered.

## Behaviour preserved

Sound assets and their bytes, volume (sparkle 0.28, pop 0.45, applause 0.55), mix, cue order (sparkle →
pop → applause) and timing; the session-owned applause lifecycle and its single-play guarantee; blocked
playback logged and never thrown; `prefers-reduced-motion` silence and static finish; close-session
cleanup; artwork, layout, copy, number generation, sharing, prices, payments, gift email, API routes,
database, Crystal Ball, Little Map and deployment configuration.

## Final diff audit

The final diff against task base `9b43b1da` holds the new audit probe, two test files, the three Spec Kit
records, `.specify/feature.json`, `PR_SUMMARY.md` and the Memory Bank note; the three reveal modules are
byte-identical to the base, and the interim mute test file never reaches the base so it leaves no trace. The
complete diff was read, and a second error check (`grep` for leftover mute references, full suite,
`tsc --noEmit`) found none. No unrelated change, no formatting-only churn, no generated probe report, no
secret.

**USEFUL RESULT: YES** — the requested outcome is implemented and verified to the extent this workspace
allows, with the three device-level checks listed explicitly as unverified.
