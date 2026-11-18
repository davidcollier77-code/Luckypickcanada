# Evidence — Lucky Meter Cinematic Flow

**Feature**: `specs/185-lucky-meter-cinematic-flow`

**Branch**: `freebuff/48421c42b397224a7be733cc`

**Base**: `affe7857` (the branch start commit and current `main` tip fetched from GitHub)

## Implementation Evidence

| Area | Delivered | Where |
| --- | --- | --- |
| Arrival composition | Five edge-bound leaves, phone bands below the headline, 1,000 ms rest, staggered lift, 2,350 ms crossing, fade to zero | `app/lib/lucky-meter/arrival-leaves.js` |
| Arrival renderer | One DPR-capped Canvas 2D layer, procedural maple path, pigment gradient, veins, stem, grounded shadow, visibility pause, full cleanup | `components/LuckyMeterArrivalLeaves.jsx` |
| Coordinated reveal | 500 ms anticipation; 3,200 / 5,400 / 7,400 ms settles; 420 ms hand-off; `EVENT_START_MS` 8,320 ms | `app/lib/lucky-meter/reveal.js`, `components/DailyResonance.tsx` |
| Audio sync | Buildup starts with the held breath, is skipped if it arrives after the dial, and fades at the percentage settle; no charge-up under reduced motion; event cue map unchanged | `components/DailyResonance.tsx`, `app/lib/lucky-meter/event-audio.js` |
| Sky-written Spark | One-second hold, local character clock, glowing sky text, tiny golden cursor, completed message retained, no panel chrome | `components/LuckyMeterSkyWriting.tsx`, `app/globals.css` |
| Lifecycle | Stage flags unchanged; anticipation, arrival, Spark hold and writing all resume correctly; frames/timers/listeners/canvases released | `components/DailyResonance.tsx` |

## Local Commands

| Check | Command | Result |
| --- | --- | --- |
| Unit and DOM suite | `pnpm exec vitest run` | PASS — 92 files / 947 tests |
| Type check | `pnpm exec tsc --noEmit` | PASS — exit 0 |
| Production build | `pnpm run build` | PASS — exit 0 |
| Build size | `du -sb .next public` | PASS — 470,665,215 bytes = 448.86 MiB, below the 495 MiB cap |
| Repository gate | `SPEC_KIT_BASE_REF=FETCH_HEAD ./freebuff-verify.sh` | PASS — exit 0, 48 docs tests passed |

`SPEC_KIT_BASE_REF=FETCH_HEAD` was required locally because the checkout's `origin/main` ref was stale at `2c3b1313` while the fetched GitHub `main` and the branch base are `affe7857`. With the correct base the gate saw only `specs/185-lucky-meter-cinematic-flow`. The unqualified first run failed on that stale-ref comparison before running any build or test; it was not an application failure.

## Browser Checks

All browser runs used the repository wrapper (`./scripts/playwright-cli.sh`) and the Standard configuration. This workspace has no hardware GPU, so Standard rendering here is Chromium's software path.

| Run | Projects | Result |
| --- | --- | --- |
| Full Daily Resonance spec | `desktop` (1440×900) | PASS — 25 passed, 1 skipped (opt-in capture block) |
| Arrival, Spark and reduced-motion checks | `mobile-390` (390×844), `mobile-412` (412×915) | PASS — 12 passed |
| Reveal timeline trace | `desktop`, `mobile-390` | PASS — both projects after the trace was updated for the anticipation and 7.4 s sequence |
| Full mobile spec file | — | NOT RUN — the focused mobile suites above cover the changed flow; the remaining mobile cases assert stored results and unchanged surfaces |

The reveal trace proves the three motions begin inside the same 120 ms window, settle strictly percentage → number → colour, finish between 6.5 s and 8.8 s, and the stage follows the colour settle. The Spark test proves the section has a transparent background, `0px` border, `0px` padding, a visible cursor while writing and the full message after.

## Visual Evidence

Root: `artifacts/lucky-meter-cinematic-flow-20261118/`

### Before (pre-change code)

| Capture | What it shows |
| --- | --- |
| `before/desktop-entry.png` | The welcome scene before the change: no resting arrival leaves. |
| `before/desktop-completed.png` | Desktop completed reading with the raised, bordered Little Spark panel and GoldenLeaf writing. |
| `before/mobile-390-completed.png` | The same panel-heavy Spark on a 390 px phone. |

### After

| Capture | What it shows |
| --- | --- |
| `after/desktop-welcome-arrival.png` | Resting arrival leaves at the desktop edges, with the preserved Milky Way and ornament layers. |
| `after/desktop-arrival-lifting.png` | The breeze carrying the small arrival leaves across the sky. |
| `after/desktop-sky-writing.png` | Mid-writing: the message in glowing sky text with the tiny golden cursor at the writing edge; no panel. |
| `after/desktop-completed.png` | The completed Spark still visible in the sky with the reading and countdown. |
| `after/mobile-390-welcome-arrival.png` | Phone arrival: leaves in the side gutters below the headline, never over it. |
| `after/mobile-390-completed.png` | Phone completed reading: sky-written Spark, no panel, no clipping. |

The after captures were taken with the same wrapper, viewport and Chromium build as the before captures. The medallion is drawn by its CSS fallback in the resting capture because the WebGL first paint had not completed when the frame was taken; the completed captures show the WebGL medallion.

## Preserved Behaviour

- Percentage range, tier boundaries (5–30 Meteor, 31–65 Lightning, 66–100 Fireworks), event mapping, selection, exclusion and storage are unchanged.
- The Milky Way `<picture>` sources, position and overlay are unchanged.
- The existing ornament layers, artwork, wording, layout, sharing, disclaimer, Home dock and countdown behaviour are preserved.
- The cinematic engine, cue vocabulary, thunder delays, layered finale and WebGL fallback are unchanged.
- Reduced motion still presents the complete reading with no spins, no cinematic and no writing cursor.

## Limitations

- Audio was not listened to. The cue map is unchanged and the audio suites pass; the buildup's timing and late-arrival guard are covered by code review and DOM tests.
- No physical GPU was available; browser captures and frame behaviour are software-rendered in this workspace.
- The full mobile spec file was not run end-to-end; focused mobile suites cover the changed flow as noted above.
- The production build size is a local measurement, not a Cloudflare deployment measurement.
