# Feature Specification: Lucky Meter Deployment CSS Integrity

**Feature Branch**: `freebuff/c866d14850b69cd27cc012d3`

**Created**: 2026-11-22

**Status**: Implemented — verification recorded in `evidence.md`

**Input**: Owner instruction: "Fix the production CSS mismatch so the live vessel matches the approved build, and add a deploy check that the served stylesheets contain the vessel and dock rules. Also change the Spark writer to absolute deadlines so it stays inside its 3.8–5.2 s window."

## Context

The 22 November 2026 live audit of https://luckypickcanada.ca/lucky-meter found that the page
delivered the current components and markup (`data-vessel-motion`, `lucky-results-dock`) with a
stylesheet set from an earlier build. None of the three linked stylesheets contained
`.lucky-vessel*` or `.lucky-results-dock`; they still contained pre-Build classes such as
`.lucky-colour-vessel`. Computed styles collapsed the scene to 1 px, the canvas rendered at 1×1 and
the glass vessel never appeared. The live page exposed a timestamp build ID
(`build-1795317896858`), while a clean local `pnpm run build` followed by
`opennextjs-cloudflare build` produced six stylesheets, including
`367d4ff150c8194a.css` with every vessel and dock rule.

The deploy workflow built the app twice: `pnpm run build` (with `GITHUB_SHA`) and then
`opennextjs-cloudflare build`, whose configured `buildCommand` runs `npx next build --webpack`
again without `GITHUB_SHA`. The uploaded artifact came from the second build. A green deploy run
therefore did not prove that the served HTML and stylesheets were a coherent, current set.

The live audit also measured the Little Spark writing at 4,851 ms, 5,396 ms and 6,217 ms against
the approved 3,800–5,200 ms window. `components/LuckyMeterSkyWriting.tsx` scheduled each character
relative to the previous timer's completion, so every late frame added its lateness to the next
character and the total drifted under main-thread contention.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - The live vessel matches the approved build (Priority: P1)

A visitor loads `/lucky-meter` and sees the approved cylindrical glass vessel during the colour
selection, fill, hold, drain and empty-highlight beats, and the results dock in its approved
position. The stylesheet that styles the page comes from the same build as its HTML and JavaScript.

**Independent Test**: Fetch the deployed page, resolve each linked stylesheet and assert that the
served CSS contains `.lucky-vessel-scene`, `.lucky-vessel-canvas-host` and
`.lucky-results-dock`. The same selectors must be present in the compiled artifact before upload.

### User Story 2 - A stale deployment fails the deploy (Priority: P1)

When Cloudflare or Next serves a prerendered page whose stylesheets predate the approved Build,
the deploy job fails with the missing selector names instead of reporting success.

**Independent Test**: Run `node scripts/verify-deployed-lucky-meter-css.mjs` against a page whose
CSS omits the rules; it exits non-zero and names the missing selectors. A page whose bare
visitor-facing response still carries an older stylesheet set must fail even when the
cache-bypassed response is correct. Unit tests cover the success, retry, timeout, visitor-cache
and failure paths without network access.

### User Story 3 - The Spark stays inside its window (Priority: P1)

The Little Spark writes every character on its cumulative storyboard deadline. A frame that
arrives late delays only its own glyph; the remaining glyphs use their original deadlines and
catch up, so the total writing time stays inside 3,800–5,200 ms.

**Independent Test**: Render the writer with a simulated 1,200 ms late first frame and assert that
the next scheduled delay is reduced by exactly that lateness; advance the fake clock to the final
storyboard deadline and assert completion.

## Requirements *(mandatory)*

- **FR-001**: The deploy job MUST run exactly one Next.js build for the uploaded artifact.
- **FR-002**: The compiled CSS MUST be checked for the three approved Lucky Meter selectors
  before upload.
- **FR-003**: After `wrangler deploy`, both a cache-bypassed page and the bare visitor-facing
  `/lucky-meter` URL MUST be fetched; every stylesheet each response links MUST be checked for the
  same selectors, and both responses MUST identify the deployed commit as their build ID, with
  bounded retries for cache propagation.
- **FR-004**: The deploy MUST fail with the failing page and missing selector names when the
  served CSS is stale, and MUST fail when the served HTML belongs to a different build.
- **FR-005**: `LuckyMeterSkyWriting` MUST schedule each glyph against one absolute start time and
  MUST NOT add a late frame's lateness to subsequent glyphs.
- **FR-006**: The visible writing MUST still complete at `getSparkWritingMs(message)` and remain
  within 3,800–5,200 ms.
- **FR-007**: Selection, storage schema, tiers, palettes, artwork, audio, stage timings, reduced
  motion and fallbacks MUST remain unchanged.
- **FR-008**: The uploaded OpenNext artifact's `BUILD_ID` MUST equal the deployed commit SHA, and
  every request made by the served check MUST have a bounded timeout.

### Key Entities

- **Compiled stylesheet**: a CSS chunk under `.open-next/assets/_next/static/css`.
- **Served stylesheet**: a CSS URL linked by the deployed `/lucky-meter` HTML.
- **Absolute Spark deadline**: `startedAt + schedule[index]` in `performance.now()` time.

## Success Criteria *(mandatory)*

- A deploy of the corrected `main` either serves, from the deployed commit, a stylesheet set
  containing the vessel and dock rules on both the origin and visitor-facing page, or fails before
  the owner is told it succeeded.
- The unit suite proves the absolute-deadline behaviour and the CSS-check parsing, retry and
  failure paths.
- The measured production build remains strictly below 495 MiB.
- No visual, timing, audio, storage or tier behaviour changes beyond the Spark scheduling fix.

## Out of Scope

Redesigning the vessel, changing the approved CSS values, changing stage durations, changing the
celebration or dock behaviour, and changing Cloudflare infrastructure beyond the deploy workflow
needed for the verification step.
