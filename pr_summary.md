## Crystal Ball Fortune Reveal & Animations

**Task Group:**
- SELECTED TASK GROUP: polishing
- GROUP REASON: This task focuses on visual enhancements, layout polishing, and animations for the Crystal Ball component.

**Required Libraries:**
- LIBRARY: React
- VERSION: 19.x (latest)
- USED: YES
- USEFUL: YES
- REASON: Used `useState` and `useCallback` to manage the new `revealing` state and trigger the timeout sequence for the animation.

- LIBRARY: Next.js
- VERSION: 16.3.8
- USED: YES
- USEFUL: YES
- REASON: Checked how the component integrates with the overall page layout and ensured no Next.js specific optimizations were broken.

**Required Routed Jules/Gemini Document:**
- DOCUMENT: .jules/polishing.md
- USED: YES
- USEFUL: YES
- REASON: Followed the directive to maintain high-quality interactive visuals using CSS and avoided structural deformation.

- DOCUMENT: .docs/polishing/_websites_mdn_image_types.md
- USED: NO
- USEFUL: NO
- REASON: No changes were made to image formats or raster assets in this task, only CSS and React state logic.

**Required Repository Component:**
- COMPONENT: `CrystalBall.tsx` & `CrystalBall.module.css`
- USED: YES
- USEFUL: YES
- REASON: These were the core components modified to add the new gathering energy shimmer, warm pulse, and fortune panel directly beneath the orb.

**Verification Commands & Results:**
- COMMAND: `pnpm exec playwright test tests/visual/crystal-ball-interactions.spec.ts`
- RESULT: PASS
- EVIDENCE/OUTPUT SUMMARY: Created a new test file to verify the full interaction from entering text, triggering the "revealing" animation, and showing the result below the ball. Tests passed on mobile and desktop viewports.

- COMMAND: `./jules-verify.sh`
- RESULT: PASS
- EVIDENCE/OUTPUT SUMMARY: Spec Kit governance checks passed after creating the necessary artifacts in `specs/021-crystal-ball-fortune-reveal/`. Build checks passed and build sizes remained below the 495 MB limit (`.next` size 369MB, `public` size 29MB).

**Implementation Details & Diff Reconciliation:**
- Added a `revealing` state to `CrystalBall.tsx` to handle the warm pulse transition.
- Extracted the fortune result from the input card and created a new `.fortunePanel` placed directly below the crystal ball.
- Added CSS animations `.ballInnerGlowLoading` and `.ballInnerGlowRevealing` to `CrystalBall.module.css`.
- Dismissed the keyboard automatically upon fortune submission.
- Preserved existing artwork, Milky Way background, and fallback formats.

**Changed Files:**
- `.specify/feature.json`
- `app/components/CrystalBall/CrystalBall.module.css`
- `app/components/CrystalBall/CrystalBall.tsx`
- `specs/021-crystal-ball-fortune-reveal/plan.md`
- `specs/021-crystal-ball-fortune-reveal/spec.md`
- `specs/021-crystal-ball-fortune-reveal/tasks.md`
- `tests/visual/crystal-ball-interactions.spec.ts`

**Pre-submission check completed:** YES
**Build Size within limit (495MB):** YES (.next 369MB, public 29MB)
**USEFUL RESULT:** YES
