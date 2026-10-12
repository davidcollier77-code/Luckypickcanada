## Visual Polish for Lucky Stories Form

This PR improves the appearance of the existing Lucky Stories submission form to match the premium, cinematic Milky Way identity of the Lucky Map page. It also addresses a CI failure in the Inori Code Review workflow.

### Changes Included:
- **Story Modal CSS:** Upgraded to a translucent midnight-blue gradient with thin gold borders and blurred glassmorphic backdrop to integrate cleanly into the map's starry visual space.
- **Submit Button:** Styled with a prominent gold gradient (`linear-gradient(135deg, #fef3c7 0%, #facc15 48%, #b7791f 100%)`) consistent with the Lucky Map page.
- **Form Inputs:** Implemented dark translucent backgrounds and refined gold borders.
- **Typography:** Updated form headings, labels, and text colors to use elegant cream-colored typography (`#fef3c7`) that stays legible without being stark white.
- **CI Fix:** Changed the OpenRouter fallback model in `.github/workflows/inori-review.yml` to `meta-llama/llama-3.3-70b-instruct:free` to resolve the JSON response format error occurring with the previous model.
- **Spec Kit Tracking:** Created and verified Feature artifacts `.specify/features/015-lucky-stories-form-visuals`.

### Non-Disruptions:
- **No functional changes:** Form APIs, validations, logic, and state mechanisms are entirely untouched.
- **Turnstile untouched:** Cloudflare Turnstile presentation and runtime logic is completely preserved.
- **Build Cap Respected:** Evaluated at 285M, passing the 495MB maximum cap requirement comfortably.

---

# PR Summary

## Task Group
- **SELECTED TASK GROUP:** polishing
- **GROUP REASON:** The primary task is strictly visual, focusing on CSS changes to improve the appearance of the Lucky Stories submission form to match a design reference, without altering functionality or logic.

## Libraries
- **LIBRARY:** Next.js
- **VERSION:** 16.3.8
- **USED:** YES
- **USEFUL:** YES
- **REASON:** Verified build process runs cleanly with Next.js app structure (`pnpm run build`).
- **LIBRARY:** React
- **VERSION:** 18
- **USED:** YES
- **USEFUL:** YES
- **REASON:** Understanding React component rendering rules to successfully update inline form styles without disrupting event hooks.
- **LIBRARY:** Tailwind CSS
- **VERSION:** 3.4
- **USED:** YES
- **USEFUL:** YES
- **REASON:** Understanding the utility class ecosystem so as to not conflict when injecting inline standard CSS.

## Routed Documents
- **DOCUMENT:** .jules/polishing.md
- **USED:** YES
- **USEFUL:** YES
- **REASON:** Confirmed standing instructions for polishing UI components.
- **DOCUMENT:** AGENTS.md
- **USED:** YES
- **USEFUL:** YES
- **REASON:** Mandatory initialization rules and strictly adhering to the 495 MB cap and no functionality breakdown.
- **DOCUMENT:** memory-bank/projectBrief.md
- **USED:** YES
- **USEFUL:** YES
- **REASON:** Confirmed the project's Canadian, premium, and entertainment-only visual constraints.
- **DOCUMENT:** memory-bank/activeContext.md
- **USED:** YES
- **USEFUL:** YES
- **REASON:** Used to document the status and result of this specific polishing task.

## Repository Components
- **COMPONENT:** `app/lucky-map-of-canada/lucky-map-of-canada.js`
- **USED:** YES
- **USEFUL:** YES
- **REASON:** Modifying inline styles for the form's headers, labels, textual elements and submit button to reflect the premium visual spec.
- **COMPONENT:** `themes/default/map.css` (and `public/themes/default/map.css`)
- **USED:** YES
- **USEFUL:** YES
- **REASON:** Updating the CSS classes (`.story-modal` and `.story-modal-backdrop`).
- **COMPONENT:** `.github/workflows/inori-review.yml`
- **USED:** YES
- **USEFUL:** YES
- **REASON:** Updated the fallback model to resolve CI failures.
- **COMPONENT:** `jules-verify.sh`
- **USED:** YES
- **USEFUL:** YES
- **REASON:** Used to ensure the Spec Kit process and builds were verified correctly against repository governance rules.

## Verification
- **COMMAND:** `pnpm run build`
- **RESULT:** PASS
- **EVIDENCE/OUTPUT SUMMARY:** Build completed successfully, generating static pages in ~600ms.
- **COMMAND:** `du -sh .next`
- **RESULT:** PASS
- **EVIDENCE/OUTPUT SUMMARY:** Output was 285M, which is well below the 495MB hard ceiling limit.
- **COMMAND:** `pnpm test`
- **RESULT:** PASS
- **EVIDENCE/OUTPUT SUMMARY:** 67 tests across 9 test files passed. No functionality was interrupted by the CSS changes.
- **COMMAND:** `./jules-verify.sh`
- **RESULT:** PASS
- **EVIDENCE/OUTPUT SUMMARY:** Validated Spec Kit (015-lucky-stories-form-visuals feature state), Type Check, and Build Check successfully.

## Changed Files
- `app/lucky-map-of-canada/lucky-map-of-canada.js`
- `themes/default/map.css`
- `public/themes/default/map.css`
- `.github/workflows/inori-review.yml`
- `.specify/feature.json`
- `.specify/features/015-lucky-stories-form-visuals/spec.md`
- `.specify/features/015-lucky-stories-form-visuals/plan.md`
- `.specify/features/015-lucky-stories-form-visuals/tasks.md`
- `PR_SUMMARY.md`

## Additional Information
- **Protected Changes:** No protected changes. No modifications to functional API, backend routing, or Cloudflare Turnstile token verification occurred. Changes were purely visual and presentational.
- **Issues Remaining:** None.
- **USEFUL RESULT:** YES
- **Pre-submission Double Check:** Completed.

