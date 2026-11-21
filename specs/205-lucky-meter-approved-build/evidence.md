# Verification Evidence: Lucky Meter Approved Build

**Feature**: `specs/205-lucky-meter-approved-build`

**Base**: `main` at `8741c655d731e2a474a516dd3ed7cbe2836c8982`

**Branch**: `freebuff/lucky-meter-build`

All results below were produced by the stated command on this branch. Nothing is inferred from
an earlier run.

## Summary

| Check | Result | Command / measurement |
| --- | --- | --- |
| Unit and component suite | **PASS** | `pnpm exec vitest run` — 107 files, 1,142 tests passed |
| TypeScript | **PASS** | `pnpm exec tsc --noEmit` — exit 0 |
| Playwright, desktop | **PASS** | `lucky-meter-daily-resonance.spec.ts` — 16 passed, 1 opt-in evidence test skipped |
| Playwright, mobile-390 | **PASS** | 16 passed, 1 opt-in capture skipped |
| Playwright, mobile-412 | **PASS** | 16 passed, 1 opt-in capture skipped |
| Repository gate | **PASS** | `SPEC_KIT_BASE_REF=8741c655 ./freebuff-verify.sh` — exit 0, 51 updater tests passed |
| Clean production build | **PASS** | `rm -rf .next && pnpm run build` — exit 0 |
| Build size | **PASS** | `du -sb .next public` = **417,921,229 bytes (398.56 MiB)**, strictly below 495 MiB |
| Visual evidence | **CAPTURED** | 8 screenshots at `artifacts/lucky-meter-approved-build-20261121/` |

A first build measured 580.6 MiB because `.next/dev` (183 MiB) and `.next/cache` (281 MiB) from
the browser runs were still present. The clean build above is the production artifact measurement;
the final post-gate rebuild measured 461,576,333 bytes (440.19 MiB), also below the cap.

## Browser Coverage

`pnpm exec playwright test tests/visual/lucky-meter-daily-resonance.spec.ts --project=<name>`
was run once per project through `./scripts/playwright-cli.sh test`:

- **desktop** (1440×900): 16 passed, 1 skipped (4.5 min).
- **mobile-390** (390×844): 16 passed, 1 skipped (4.2 min).
- **mobile-412** (412×915): 16 passed, 1 skipped (4.1 min).

The skipped test is the pre-existing seasonal evidence capture, opt-in via
`LUCKY_METER_CAPTURE=1`.

Covered assertions include:

- the reading starts at `0` and the plaque is hidden before the generation;
- the sampled vessel phases include `filling`, `draining` and `empty`;
- a mid-drain frame has `0 < reveal < 1`, `0 < fill < 1` and a top-anchored number clip;
- at `revealed` the vessel fill is `0.000`, the number is whole and the wheel angle matches the
  stored colour;
- the tier message, 12,000 ms celebration and last-row Home + countdown order;
- D12: a stored `stageDurationMs` of 9,000 is ignored and the restored celebration runs 12,000 ms
  with the stored reading unchanged;
- WebGL unavailable: the CSS vessel performs the same fill and drain with the stored HEX;
- reduced motion: the completed reading, Spark and paired dock are presented together.

After correcting the number-reveal clip direction, the storyboard test was re-run on desktop,
mobile-390 and mobile-412; all three passed with the new top-anchored assertion.

## Visual Evidence

Captured with `LUCKY_METER_CAPTURE=1` on desktop and mobile-390:

| Stage | Desktop | Mobile 390 |
| --- | --- | --- |
| Arrival | `desktop-arrival.png` | `mobile-390-arrival.png` |
| Filling | `desktop-fill.png` | `mobile-390-fill.png` |
| Mid-drain, partial number | `desktop-drain.png` | `mobile-390-drain.png` |
| Empty vessel and dock | `desktop-dock.png` | `mobile-390-dock.png` |

The mid-drain frame shows the vessel partly emptied, the number partly exposed from its top edge
and the colour caption in place. The dock frame shows the empty vessel, the whole number, the
written Spark, and Home beside the countdown in the results panel's last row.

## Environment

- Node v26.13.0, pnpm 10.30.3.
- Linux Cloud VM without a hardware GPU; Chromium 1248 runs WebGL through SwiftShader.
- The Playwright runs used the repository's standard configuration, not a competing automation
  setup.

## Not Run

- No deployment was performed.
- The GitHub-triggered PR verification report is **PENDING** until the pull request exists.
- No lucky-meter screenshot baseline exists under `tests/visual/__screenshots__`, so no baseline
  was regenerated or compared.
