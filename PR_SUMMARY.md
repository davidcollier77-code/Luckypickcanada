## TASK GROUP: POLISHING
This task belongs in the "polishing" group as it aims to improve visual delivery performance without altering functional business logic or protected systems.

## MANDATORY RESOURCES
- **Jules Documentation:** USED: YES, USEFUL: YES (Guided overall PR structure and Spec Kit process)
- **MDN Image Types Guide:** USED: YES, USEFUL: YES (Guided format decisions, ensuring AVIF was used first with WebP and traditional fallbacks)
- **Sharp Image Optimizer Library:** USED: YES, USEFUL: YES (Used to generate the AVIF, WebP, and JPG variants)

## SPEC KIT EXECUTION
1. `speckit.specify`: NATIVE DISPATCH. Generated `spec.md`.
2. `speckit.plan`: NATIVE DISPATCH. Generated `plan.md`.
3. `speckit.tasks`: NATIVE DISPATCH. Generated `tasks.md`.
4. `speckit.implement`: NATIVE DISPATCH.

## CHANGES & VERIFICATION
- **Files changed:** `app/homepage/Hero.js`, `app/homepage/HomePage.js`, new assets in `public/`.
- **Image savings:**
  - Hero image: `669w` AVIF is 127KB (down from 203KB), WebP is 184KB (down from 300KB).
  - Facebook cover: `551w` AVIF is 25KB, WebP is 24KB (down from 107KB).
- **Verification:**
  - `./jules-verify.sh` passed.
  - `pnpm exec playwright test` passed all tests (27 passed, 3 skipped).
  - Next.js production build (`pnpm run build`) completed successfully (size: 384 MB, well within 495 MB limit).
- **Safety checks:** Turnstile loading behavior, layout, and visual fidelity are fully preserved.

## USEFUL RESULT: YES
The requested responsive image optimization for the Homepage Hero and Facebook community cover has been implemented and tested successfully.
