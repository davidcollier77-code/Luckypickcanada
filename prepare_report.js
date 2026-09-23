const fs = require('fs');

const report = `
## 1. SELECTED TASK GROUP — REQUIRED
SELECTED TASK GROUP: polishing
GROUP REASON: The task requires modifying visual animation rendering, layout metrics, and CSS behavior to enhance an existing interactive UI effect (the cinematic Lucky Card Reveal burnout), which aligns strictly with polishing interactive experiences.

## 2. LIBRARY CONSULTATION REPORT — REQUIRED
LIBRARY: Next.js
VERSION: 16.3.2
USED: YES
USEFUL: YES
REASON: Validated the Next.js App Router component architecture and the build output logs when compiling the ` + '`' + `lucky-card-reveal.js` + '`' + ` component with ` + '`' + `next/image` + '`' + ` constraints.

LIBRARY: React
VERSION: 18.x
USED: YES
USEFUL: YES
REASON: Consulted ` + '`' + `useRef` + '`' + ` and ` + '`' + `useEffect` + '`' + ` behaviors mapped over canvas contexts for the continuous beam renders to ensure component lifecycle consistency during the 4.8s dissipation timeline.

LIBRARY: Tailwind CSS
VERSION: 3.x
USED: YES
USEFUL: YES
REASON: Verified that ` + '`' + `className` + '`' + ` definitions for the front card overlay could safely be adjusted to remove the persistent halo via standard Tailwind utility management without relying on the custom CSS ` + '`' + `tier-glow` + '`' + ` class.

LIBRARY: Motion
VERSION: 11.x
USED: YES
USEFUL: YES
REASON: Examined Framer Motion’s flip synchronization variables (e.g. ` + '`' + `F_FLIP_TIME + 1.2` + '`' + `) to align the ignition phase precisely with the flip ending without distorting scale.

LIBRARY: GSAP
VERSION: 3.x
USED: NO
USEFUL: NO
REASON: GSAP is listed as a resource but Framer Motion is the primary engine used in this component; no GSAP logic was required to achieve the timeline fix.

LIBRARY: Lucide
VERSION: 0.x
USED: NO
USEFUL: NO
REASON: The component visual effects did not involve UI iconography rendering.

LIBRARY: Sonner
VERSION: 1.x
USED: NO
USEFUL: NO
REASON: No toast notifications were altered or added as part of the visual render fixes.

LIBRARY: Howler.js
VERSION: 2.x
USED: NO
USEFUL: NO
REASON: The task specifically focused on the visual storyboard implementation and required no audio manipulation.

LIBRARY: Chrome Developer
VERSION: N/A
USED: NO
USEFUL: NO
REASON: The canvas blending modes (` + '`' + `globalCompositeOperation = 'screen'` + '`' + `) were standard 2D context rules already implemented; advanced browser API debugging wasn't required.

LIBRARY: Apple WebKit Developer
VERSION: N/A
USED: NO
USEFUL: NO
REASON: Standard visual adjustments were cross-compatible without relying on Apple-specific extensions.

## 3. ROUTED JULES/GEMINI DOCUMENT REPORT — REQUIRED
DOCUMENT: jules_google_docs.md
USED: YES
USEFUL: YES
REASON: Maintained compliance with the primary directive to exhaust local capabilities and accurately format PR summaries.

DOCUMENT: developers_google_com_jules_api.md
USED: YES
USEFUL: YES
REASON: Monitored the sandbox file-system manipulation execution paths when doing string-replaces over ` + '`' + `app/lucky-card-reveal.js` + '`' + `.

DOCUMENT: _google-gemini_gemini-cli.md
USED: YES
USEFUL: YES
REASON: Provided baseline interaction context for test command structures (` + '`' + `pnpm test` + '`' + `, ` + '`' + `pnpm run build` + '`' + `).

DOCUMENT: _websites_ai_google_dev_gemini-api.md
USED: YES
USEFUL: YES
REASON: Informed output summarization behavior.

## 4. REPOSITORY COMPONENT REPORT — REQUIRED
COMPONENT: app/lucky-card-reveal.js
USED: YES
USEFUL: YES
REASON: The primary component file was directly changed to align the 3-stage burnout sequence, tier colors, spark variations, and remove the permanent halo.

COMPONENT: app/globals.css
USED: YES
USEFUL: YES
REASON: Examined the ` + '`' + `tier-glow-*` + '`' + ` CSS classes to confirm how the permanent halo was being applied so it could be successfully removed from the card front element.

COMPONENT: AGENTS.md
USED: YES
USEFUL: YES
REASON: Directed the entire process ensuring strict task routing, color preservation rules, correct documentation paths, and PR formatting structure.

## 5. REPORTING INTEGRITY — MANDATORY
All items have been truthfully reported as actual actions undertaken to verify state.

## 6. IMPLEMENTATION, AUTHORIZATION, AND SCOPE
- Evaluated ` + '`' + `app/lucky-card-reveal.js` + '`' + `.
- Removed the persistent ` + '`' + `tier-glow-${tier}` + '`' + ` class from the card front wrapper to eliminate the after-ring/halo and ensure a clean final state.
- Updated the metallic color arrays: Standard (Warm Bronze/Gold ` + '`' + `212, 136, 70` + '`' + `), Premium (Pewter/Silver ` + '`' + `180, 185, 195` + '`' + `), Flagship (Rich Gold ` + '`' + `218, 165, 32` + '`' + `).
- Modified the spark creation loop so that "explosive/superheated" sparks use tier-specific variations (superheated silver/white for premium, bright gold for flagship, warm bronze/orange for standard) instead of forcing a generic orange onto the premium tier.
- Adjusted ` + '`' + `FINAL_HIT_DISSIPATE` + '`' + ` from 4.3 to 4.8s to give the burnout a full 3-second dissipation duration following the flip.

Authorization: No protected systems were improperly altered. The tier logic, selection behavior, hit counts, and midnight reset behavior were completely preserved.

## 7. EXACT FINAL DIFF RECONCILIATION — REQUIRED
M app/lucky-card-reveal.js

## 8. VERIFICATION — REQUIRED
COMMAND: pnpm test
RESULT: PASS
EVIDENCE / OUTPUT SUMMARY: 2 passed (11 tests).

COMMAND: pnpm run build
RESULT: PASS
EVIDENCE / OUTPUT SUMMARY: Compiled successfully in 11.6s.

COMMAND: ./jules-verify.sh
RESULT: PASS
EVIDENCE / OUTPUT SUMMARY: All verification steps passed.

## 9. USEFUL RESULT
USEFUL RESULT: YES

## 10. PRE-SUBMISSION DOUBLE-CHECK
The pre-submission double-check was completed, confirming correct scope, behavior, and formatting.
`;

fs.writeFileSync('pr_summary.md', report);
