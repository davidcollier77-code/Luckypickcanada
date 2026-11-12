# Evidence: Crystal Ball Visual Greeting Alignment

## Confirmed Failure

Visual QA run: https://github.com/davidcollier77-code/Luckypickcanada/actions/runs/43140090699

The two visual shards reported failures in:
- `tests/visual/crystal-ball-greeting.spec.ts`
- `tests/visual/crystal-ball-interactions.spec.ts`
- `tests/visual/crystal-ball.spec.ts`

Observed values included valid application greetings such as:
- `Still up, eh? The glass has been polishing its best Canadian wisdom. Spoiler: it involves layers.`
- `Still up, eh? Sit down, eh? The universe has notes, and most of them are actually good.`

The assertions still listed only the first four of ten personalities. The source also deliberately replaces ordinary personalities with quiet messages on specified commemorative dates.

## Implementation

- Added one shared helper using the app's exported `GREETINGS` and `getQuietGreeting`.
- The helper determines the current date in the browser, matching visitor-local greeting behavior.
- Updated the three affected specs to use the helper.
- The daily non-repetition test now checks the stored index directly, including on quiet days.

## Verification Status

- **PASS — source review:** All three former hard-coded four-greeting expectations have been replaced.
- **PASS — source review:** The helper accepts each entry from the live greeting pool and the quiet greeting for the browser-local date.
- **PASS — scope review:** No production code, artwork, visual baselines, dependencies, or workflow files changed.
- **PENDING — Visual QA:** The six browser-project combinations are verified by the new PR-triggered run.
- **NOT RUN — local Playwright:** This session had no shell-capable repository checkout to execute Playwright locally.
- **NOT RUN — full repository gate:** No shell-capable repository checkout was available.
