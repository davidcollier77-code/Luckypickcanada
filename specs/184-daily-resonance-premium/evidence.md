# Evidence: Premium Daily Resonance — Medallion, Independent Reveals and the Little Spark Finale

**Feature**: `specs/184-daily-resonance-premium` | **Date**: 2026-11-18

Every result below was produced by the command named beside it in this workspace. Nothing here is inferred from a plan or from a previous run of the file.

Committed alongside this record: the captures in `after/` and `build-size.txt`. The `.log` files named
below are this workspace's own runs; the repository's `*.log` ignore rule keeps them local.

## 0. Invariant audit (follow-up pass)

Each mission invariant was treated as a claim to falsify against the delivered code, not as a fact.

| Invariant | How it is now demonstrated |
| --- | --- |
| Percentage stays 5–100 with its original uniform weighting and excludes only the immediately preceding saved value; older percentages and same-tier events stay eligible | `__tests__/lucky-meter-selection.test.js`: 3 000-draw range check, `[12, 55, 97]` exclusion, `[8, 9, 10, 80]` older-value eligibility, a 190 000-draw distribution check over the 95 remaining values, a tier-band/event repeat check, and a legacy `events` history that must not block an event |
| Lucky Number is one uniform 1–50 value, excludes only the newest saved number, and its pointer lands on it without encoding the percentage | Selection suite (95 000 draws, equal probability; `[17, 23]` exclusion; independence from the percentage) plus the browser test `the number pointer and colour ring represent their own stored values` (seed 57 % / 27 → dial 205.2°, pointer 190.8°, badge 27) and `starts all three motions together…` (resting pointer angle equals `(n − 1) × 7.2 + 3.6` modulo a whole turn) |
| Lucky Colour is uniform over the twelve approved names/HEX values, excludes only the newest colour, and its ring settles on the already-chosen colour without reselecting or hiding the percentage | Palette assertion (exact 12 names and HEX, in order), 33 000-draw equal-probability check, `['navy-blue', 'cream']` exclusion/eligibility, and the browser tests: settled `data-colour-id` equals the stored colour, `data-colour-angle` equals `−index × 30°`, and the percentage text's furthest corner stays under 60 % of the coin radius while the ring sits at 77 % |
| All 30 Sparks unchanged, only the newest excluded | `LITTLE_SPARKS` count/unique-id/message assertions (the file is untouched in the diff), plus the 6 000-draw exclusion test and the 30-message fallback |
| Percentage, number and colour start together and settle staggered before the cinematic | DOM suite asserts the 620 / 940 / 1240 ms schedule and `EVENT_START_MS = 1540` with fake timers; the browser trace records a `MutationObserver` timeline: all three angles are already moving in the same sampled window, the settle order is strict, and the stage appears after the colour settle |
| GoldenLeaf writes the Spark only after the cinematic, the message stays, and the countdown appears only afterwards | `__tests__/lucky-meter-cinematic-lifecycle.test.jsx` and the Playwright Spark-finale tests: no Spark message and no countdown while the stage runs; `data-state="writing"` → `"written"`; countdown only after `written`, then still visible after a reload |
| A saved result keeps percentage/colour/Spark, gains exactly one persisted number, and refresh/resume neither rerolls nor replays finished stages nor skips unfinished ones | Storage tests (one-time write-back; idempotent re-validation with a random source that must not be consulted), Playwright migration test across a reload, and the new `revealCompleted` stage — see §0.1 |
| Reduced motion and WebGL context loss degrade correctly | Reduced-motion Playwright test (settled dial, complete Spark, immediate countdown, no quill, no stage) and the WebGL-unavailable test (CSS medallion, stage completes, Home returns, no page errors); `__tests__/lucky-meter-context-restore.test.js` covers context loss/restore |
| Milky Way, local midnight, audio and sharing are intact; no database/API/Lucky Stories change | `leaves the Milky Way picture, position and overlay unchanged` (sources, `100vw`, `object-position: center 40%`, `-z-20`, overlay, no filter/blend, no WebGPU), the midnight rollover DOM test and Playwright countdown test, the audio suites, `__tests__/lucky-meter-share.test.js`, and a diff with no `prisma`, SQL, table or Lucky Stories change |

### 0.1 Defect found and repaired

A refresh during the 1.5 s reveal skipped the three motions and jumped straight to the
cinematic: the stored payload recorded only `eventCompleted` and `sparkCompleted`, so an
unfinished reveal was indistinguishable from a finished one. That violates “refresh/resume
must not … skip unfinished animations”.

Repair:

- `app/lib/lucky-meter/storage.js` persists a `revealCompleted` stage in the same version 1
  payload. Legacy payloads infer it from the cinematic (a finished cinematic necessarily
  finished the reveal; an unfinished one resumes from the motions).
- `components/DailyResonance.tsx` extracts the motion block into `animateReveal` and calls it
  from both Start and a load that finds an unfinished reveal, persisting `revealCompleted`
  when the cinematic begins. No value is drawn on the resume path.

Proof: `lucky-meter-storage.test.js` (stage round-trip and legacy inference),
`lucky-meter-cinematic-lifecycle.test.jsx` (“resumes the reveal motions after a refresh
mid-reveal instead of skipping them”), and the browser test “resumes a stored mid-reveal
reading without redrawing or skipping it”, which measures the cinematic starting more than
1 200 ms after load and compares the stored result and history byte-for-byte before and after.

## 1. Unit and DOM suites

Command:

```bash
pnpm exec vitest run
```

Result: **90 test files passed, 935 tests passed** (log: `artifacts/lucky-meter-premium-resonance-20261118/vitest.log`).

New coverage added or rewritten for this task:

| File | What it proves |
| --- | --- |
| `__tests__/lucky-meter-selection.test.js` | Uniform percentage/number/colour/Spark draws, only-newest exclusion, older-value eligibility, tier-owned events, number independence from the percentage, migration that never rerolls |
| `__tests__/lucky-meter-storage.test.js` | Per-choice normalisation, four history lists, one-time number write-back, `sparkCompleted` and `revealCompleted` lifecycle, legacy payload defaults |
| `__tests__/lucky-meter-share.test.js` | One singular Lucky Number line plus the colour's exact name and HEX |
| `__tests__/lucky-meter-reveal.test.js` | Settle order, spin samplers returning the exact final value, number/colour angle math |
| `__tests__/daily-resonance-daily-experience.test.jsx` | Panel order, Spark prominence, countdown gating, migrated number rendered and persisted, mid-cinematic resume |
| `__tests__/lucky-meter-cinematic-lifecycle.test.jsx` | Cinematic start after the last settle, Spark writing, resume without replay, reveal-stage resume |
| `__tests__/lucky-meter-dimensional-renderers.test.js` | Medallion geometry is a well-formed lit mesh at every quality level |
| `__tests__/lucky-meter-context-restore.test.js` | WebGL context loss and restore |

## 2. Type check

```bash
pnpm exec tsc --noEmit
```

Result: **exit 0**, no diagnostics.

## 3. Browser verification (Playwright, Standard configuration)

Commands (through the project wrapper required by the Playwright skill):

```bash
./scripts/playwright-cli.sh test tests/visual/lucky-meter-daily-resonance.spec.ts --workers=3
./scripts/playwright-cli.sh test tests/visual/crystal-ball-daily-limit.spec.ts --project=desktop
```

Results:

- Daily Resonance on `desktop`, `mobile-390` and `mobile-412`: **69 passed, 3 skipped** (the opt-in capture tests, which only run with `LUCKY_METER_CAPTURE=1`).
- Crystal Ball daily limit: **4 passed**.

Covered by the spec: tier boundaries 5/30/31/65/66/100, percentage mapping, one-time number migration surviving reload, number dial landing on its own value, settle order and cinematic start, a measured reveal timeline across all three viewports, Spark/countdown sequencing, resume without replay, mid-reveal resume, reduced motion, WebGL fallback, and full unmount cleanup.

Measured reveal timing (MutationObserver timeline, desktop and both mobile widths): all three
motions are moving within the same sampled window, the settle order is strict, and every
motion is settled inside roughly 1.4 s of the first frame, with the cinematic after it. The
first frame absorbs the medallion's first paint, which is why the browser assertions bound the
stagger and the total rather than re-asserting the nominal 620/940/1240 ms schedule that the
fake-timer DOM suite already covers exactly.

## 4. Visual QA

Captures were produced by the spec's opt-in capture test with `LUCKY_METER_CAPTURE=1` and inspected at 1440×900, 390×844 and 412×915.

- `artifacts/lucky-meter-premium-resonance-20261118/after/desktop-welcome.png`
- `.../desktop-dial-spin.png`
- `.../desktop-landed.png`
- `.../desktop-result.png`
- `.../mobile-390-welcome.png`, `.../mobile-390-landed.png`, `.../mobile-390-result.png`
- `.../mobile-412-welcome.png`, `.../mobile-412-landed.png`, `.../mobile-412-result.png`

Findings and fixes during this inspection:

1. The outer number bezel's tick labels collided with the ticks and the pointer badge; the labels were removed and the badge alone now carries the value.
2. The rim's coarse scalloping read as a gear; milled amplitude was halved and its frequency raised, producing a fine engraved edge.
3. On 390 px the fixed Home countdown overlapped the ritual counter because the centred column ignored its top padding. The mobile column is now top-aligned with reserved dock space, and the medallion, Spark panel and midnight note were tightened so the completed reading fits without scrolling.
4. The colour ring was too faint at the previous 1.5 px/0.42 opacity; it is now 1.9 px (2.6 px selected) at 0.52 opacity and still well outside the percentage copy.

The Milky Way block in `components/DailyResonance.tsx` was not edited. Checked with
`git diff components/DailyResonance.tsx | grep -E '^[+-].*(milky|avif|webp|Milky)'`, which returns no
matches: no artwork reference, source path or overlay line was added or removed. Its position in the file
moved with the layout rewrite; its markup, sources and layering did not.

## 5. Production build and size

```bash
pnpm run build
du -sm .next public
```

Result: build **completed successfully**; `.next` 311 MiB + `public` 34 MiB = **345 MiB**, strictly below the 495 MiB limit (`artifacts/lucky-meter-premium-resonance-20261118/build.log`, `build-size.txt`).

## 6. Repository gate

```bash
./freebuff-verify.sh
```

Result: **passed end to end** (`artifacts/lucky-meter-premium-resonance-20261118/freebuff-verify.log`):

- pinned pnpm bootstrap and frozen-lockfile install;
- Spec Kit governance gate, including its verifier test suite, with this feature's `spec.md`, `plan.md` and
  `tasks.md` reported as verified changed artifacts and no second feature directory;
- verification-status integrity checker: 29 tests, OK;
- `AGENTS.md` protection classifier: 27 tests, OK;
- type check and production build;
- refresh-docs suite: 48 passed, 0 failed;
- final line: `All verification steps passed.`

## 7. Limitations

- Audio cues were not listened to in this environment. Their scheduling, files and volume path are unchanged, and the audio suites pass.
- The medallion captures come from this workspace's Chromium renderer, not a physical GPU; absolute specular intensity on other hardware is untested.
- The first reveal frame can absorb roughly 250–400 ms of medallion first-paint on this workspace's Chromium; the nominal 620/940/1240 ms schedule is proven with fake timers, while the browser timeline proves order, stagger and the ≤ ~1.5 s total under that jank.
- The Tailwind dev bundle can go stale in `.next`, which hides newly added utility classes until `.next` is removed; that was observed and worked around during this task and does not affect the production build.
