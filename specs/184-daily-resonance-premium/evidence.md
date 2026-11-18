# Evidence: Premium Daily Resonance — Medallion, Independent Reveals and the Little Spark Finale

**Feature**: `specs/184-daily-resonance-premium` | **Date**: 2026-11-18

Every result below was produced by the command named beside it in this workspace. Nothing here is inferred from a plan or from a previous run of the file.

## 1. Unit and DOM suites

Command:

```bash
pnpm exec vitest run
```

Result: **90 test files passed, 932 tests passed** (log: `artifacts/lucky-meter-premium-resonance-20261118/vitest.log`).

New coverage added or rewritten for this task:

| File | What it proves |
| --- | --- |
| `__tests__/lucky-meter-selection.test.js` | Uniform percentage/number/colour/Spark draws, only-newest exclusion, older-value eligibility, tier-owned events, number independence from the percentage, migration that never rerolls |
| `__tests__/lucky-meter-storage.test.js` | Per-choice normalisation, four history lists, one-time number write-back, `sparkCompleted` lifecycle and legacy payload defaults |
| `__tests__/lucky-meter-share.test.js` | One singular Lucky Number line plus the colour's exact name and HEX |
| `__tests__/lucky-meter-reveal.test.js` | Settle order, spin samplers returning the exact final value, number/colour angle math |
| `__tests__/daily-resonance-daily-experience.test.jsx` | Panel order, Spark prominence, countdown gating, migrated number rendered and persisted |
| `__tests__/lucky-meter-cinematic-lifecycle.test.jsx` | Cinematic start after the last settle, Spark writing, resume without replay |
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
./scripts/playwright-cli.sh test tests/visual/lucky-meter-daily-resonance.spec.ts --project=desktop
./scripts/playwright-cli.sh test tests/visual/lucky-meter-daily-resonance.spec.ts --project=mobile-390 --project=mobile-412 --workers=2
```

Results:

- desktop: **20 passed** after the migration test was corrected; the single initial failure was the test's own `addInitScript` re-seeding the legacy payload on reload, not a product defect.
- mobile-390 + mobile-412: **40 passed, 2 skipped** (the two opt-in capture tests, which only run with `LUCKY_METER_CAPTURE=1`).

Covered by the spec: tier boundaries 5/30/31/65/66/100, percentage mapping, one-time number migration surviving reload, number dial landing on its own value, settle order and cinematic start, Spark/countdown sequencing, resume without replay, reduced motion, WebGL fallback, and full unmount cleanup.

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
- The Tailwind dev bundle can go stale in `.next`, which hides newly added utility classes until `.next` is removed; that was observed and worked around during this task and does not affect the production build.
