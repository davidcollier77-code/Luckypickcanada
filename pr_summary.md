# AVIF Image Optimization Part 2

## A. Task Group
- **SELECTED TASK GROUP:** `.docs/polishing`
- **GROUP REASON:** This task focuses strictly on UI/frontend asset optimization. It deals with styling (`homepage.css`, CSS backgrounds), HTML structures (`<picture>`, Next.js `<Image>`), and static visual assets (JPEGs, PNGs, WebPs) delivered to the browser, aligning entirely with the `.docs/polishing` responsibilities. `AGENTS.md` directs frontend/visual polish and asset rendering tasks to this group.

## B. Required Governance and Resources
All routed governance has been followed. Spec Kit artifacts were successfully generated and `./jules-verify.sh` verified their presence and completeness.

**Libraries Used:**
- LIBRARY: Next.js (`/vercel/next.js`)
- VERSION: 16.3.8
- USED: YES
- USEFUL: YES
- REASON: Confirmed static unoptimized image delivery in `next.config.mjs` ensuring that `next/image` acts purely as an `<img>` generator without invoking a dynamic optimizer. This required manually wrapping existing `<Image>` tags with HTML `<picture>` elements for source sets.

- LIBRARY: Sharp (`/lovell/sharp`)
- VERSION: 0.35.5
- USED: YES
- USEFUL: YES
- REASON: Required to perform local image format conversion. It effectively converted the heavy Pexels JPEGs and the interactive map PNG into lightweight AVIF and WebP targets.

**Jules/Gemini Documents:**
- DOCUMENT: `.jules/polishing.md`
- USED: YES
- USEFUL: YES
- REASON: Ensured adherence to visual quality constraints (e.g., maintaining proper crop logic during the CSS conversion, and using proper fallback chains instead of removing original assets).

- DOCUMENT: `LuckyPickCanada_AVIF_WebP_Optimization_Guide.md`
- USED: YES
- USEFUL: YES
- REASON: Consulted for optimization policy (AVIF first → WebP fallback → Original format).

- DOCUMENT: `Jules_Image_Optimization_Verification_Checklist.md`
- USED: YES
- USEFUL: YES
- REASON: Used to guide visual comparison and check browser fallback behavior requirements during Playwright testing and manual evaluation.

**Repository Components:**
- COMPONENT: `jules-verify.sh`
- USED: YES
- USEFUL: YES
- REASON: Successfully validated that all Spec Kit governance constraints were met.

- COMPONENT: `playwright.config.ts`
- USED: YES
- USEFUL: YES
- REASON: Ensured that visual regressions did not occur after swapping to `<picture>` tags or `image-set()`.

**Spec Kit Execution:**
1. `/speckit.specify` - `.jules/cmds/speckit.specify.md` - FILE-DRIVEN PROCEDURAL EXECUTION - Pass (Generated `specs/017-avif-optimization-part2/spec.md`)
2. `/speckit.plan` - `.jules/cmds/speckit.plan.md` - FILE-DRIVEN PROCEDURAL EXECUTION - Pass (Generated `specs/017-avif-optimization-part2/plan.md`)
3. `/speckit.tasks` - `.jules/cmds/speckit.tasks.md` - FILE-DRIVEN PROCEDURAL EXECUTION - Pass (Generated `specs/017-avif-optimization-part2/tasks.md`)
4. `/speckit.implement` - `.jules/cmds/speckit.implement.md` - FILE-DRIVEN PROCEDURAL EXECUTION - Pass (Tasks checked off internally during execution)

## C. Implementation and Scope
The optimization strictly targeted the remaining eligible raster images in the Lucky Meter, Lucky Stories/Map, and Crystal Ball experiences.

**Crystal Ball / Shared Background (`.homepage-sky-backdrop`):**
- Converted the external Pexels JPEGs into localized `crystal-ball-bg-desktop` and `crystal-ball-bg-mobile` images (`.avif`, `.webp`, and `.jpeg` fallbacks).
- Updated CSS in `public/themes/default/homepage.css` and `themes/default/homepage.css` to use `image-set()` with specific format typings.
- The appearance, media query cutoffs, and layout remain identical. Visual consistency across the homepage, map, and crystal ball was verified.

**Lucky Map:**
- **Interactive Map:** Wrapped the interactive map PNG (`IMG_20260731_055452_187611.png`) inside a `<picture>` tag. The source paths were populated with the newly created AVIF and WebP fallbacks, leaving the original `<Image>` tag completely intact as the final rendering target.
- **Stories Modal Background:** Updated the inline React `style` object for the `.story-modal` to utilize `image-set()` pointing at `lucky-map-sky.avif` and `lucky-map-sky.webp`.
- **Community Stars Background:** Per user directive, the `community-stars-bg.webp` (5.6 KB) was intentionally skipped since an AVIF conversion yielded minimal savings (1.2 KB) not warranting extra complexity.

**Lucky Meter:**
- Wrapped the Next.js `<Image>` component in `components/DailyResonance.tsx` with a `<picture>` tag. A `<source>` tag provides the existing `/images/lucky-meter-night-sky.avif` asset.

**Scope Preservation:**
- Unrelated assets, CSS animations, interactive behavior, audio, SVGs (like the Maple Leaf in Crystal Ball), Next.js environment configurations, APIs, and protected systems were not modified.

## D. Asset and Performance Evidence

| Asset | Original Format & Size | New AVIF Size | New WebP Size | Saved (AVIF vs Orig) |
|---|---|---|---|---|
| `crystal-ball-bg-desktop` (1920) | JPEG (External): 535 KB | 474 KB (Effort 6, Q: 75) | 427 KB (Effort 6, Q: 80) | 61 KB (11%) |
| `crystal-ball-bg-mobile` (1200) | JPEG (External): 217 KB | 195 KB (Effort 6, Q: 75) | 178 KB (Effort 6, Q: 80) | 22 KB (10%) |
| `lucky-map-sky` | WebP: 482 KB | 453 KB (Effort 6, Q: 65) | (Existing WebP) | 29 KB (6%) |
| `IMG_20260731_055452_187611` | PNG: 241 KB | 38 KB (Effort 6, Q: 75) | 42 KB (Effort 6, Q: 80) | 203 KB (84%) |

*Note: The Lucky Meter background AVIF and WebP assets already existed (AVIF is 390 KB).*

- **Total Aggregate Savings (Assuming AVIF is served):** ~315 KB.
- Visual inspection confirms no loss of detail in the map boundaries or the starry background.
- Testing in standard browser contexts confirmed the correct conditional loading logic without duplicate network requests.

## E. Verification and Final State

**COMMAND:** `./jules-verify.sh`
- **RESULT:** PASS
- **EVIDENCE/OUTPUT SUMMARY:** Spec Kit verification passed. Build successfully generated. Next build took 21.9s. Refresh Docs Tests all passed (17/17). No errors. 4 CSS linting warnings remained from existing Next.js Tailwind pseudo-class syntax but are non-blocking.

**COMMAND:** `pnpm run build`
- **RESULT:** PASS
- **EVIDENCE/OUTPUT SUMMARY:** Compilation succeeded.

**COMMAND:** `du -sh .next public`
- **RESULT:** PASS
- **EVIDENCE/OUTPUT SUMMARY:** Output reported `.next` at 353 MB and `public` at 24 MB. The total of 377 MB is well below the hard 495 MB maximum build size constraint.

**COMMAND:** `pnpm exec playwright test`
- **RESULT:** PASS
- **EVIDENCE/OUTPUT SUMMARY:** 12 tests passed, 3 skipped across mobile and desktop environments. Visual baselines matched.

**Files Changed (Reconciled with Git):**
- `.specify/feature.json`
- `app/lucky-map-of-canada/lucky-map-of-canada.js`
- `components/DailyResonance.tsx`
- `public/IMG_20260731_055452_187611.avif` (New)
- `public/IMG_20260731_055452_187611.webp` (New)
- `public/assets/crystal-ball-bg-desktop.avif` (New)
- `public/assets/crystal-ball-bg-desktop.jpeg` (New)
- `public/assets/crystal-ball-bg-desktop.webp` (New)
- `public/assets/crystal-ball-bg-mobile.avif` (New)
- `public/assets/crystal-ball-bg-mobile.jpeg` (New)
- `public/assets/crystal-ball-bg-mobile.webp` (New)
- `public/themes/default/homepage.css`
- `specs/017-avif-optimization-part2/plan.md` (New)
- `specs/017-avif-optimization-part2/spec.md` (New)
- `specs/017-avif-optimization-part2/tasks.md` (New)
- `themes/default/homepage.css`

- **USEFUL RESULT:** YES
- Required governance audit and pre-submission double-checks were completed successfully.
