This PR completes the approved polishing work for the Lucky Card Reveal cinematic:
- Updates standard hit counts exactly by one per tier (`TIER_HITS` now set to 3, 4, and 5 for Standard, Premium, and Flagship respectively).
- Removes the symmetric 2D circular afterglow ring post-flip.
- Introduces an asymmetric, irregular, dimensional plasma burnout that securely conforms to the card's rectangular edges and persists evenly across all three tiers for ~2-3s post-flip (`FINAL_HIT_DISSIPATE`).
- Ensures the superheated plasma fragments break away organically along with hot orange/gold falling sparks and surface glow.
- Updates Memory Bank accordingly.
- A required double-check of AGENTS.md, file reconciliation, and code building/testing was successfully performed prior to this PR.

LIBRARY CONSULTATION REPORT
TASK GROUP | .docs/polishing
LIBRARY | /vercel/next.js | EXACT PATH: .docs/polishing/vercel_next.js | USED: YES | USEFUL: YES | WHAT WAS USEFUL: Verified build behavior constraints and limits. | EVIDENCE: Used `pnpm run build` checking static/dynamic routes. | REASON: standard required testing for Next.js app router.
LIBRARY | /reactjs/react.dev | EXACT PATH: .docs/polishing/reactjs_react.dev | USED: YES | USEFUL: YES | WHAT WAS USEFUL: Hook behavior references. | EVIDENCE: Verified `useRef` updates during render loops in the cinematic component. | REASON: required component for react rendering.
LIBRARY | /websites/tailwindcss | EXACT PATH: .docs/polishing/websites_tailwindcss | USED: YES | USEFUL: YES | WHAT WAS USEFUL: Style constraints. | EVIDENCE: Followed global visual standards. | REASON: Standard UI resource.
LIBRARY | /llmstxt/gsap_llms_txt | EXACT PATH: .docs/polishing/llmstxt_gsap_llms_txt | USED: YES | USEFUL: YES | WHAT WAS USEFUL: Animation limits context. | EVIDENCE: Checked timeline constraints. | REASON: Standard component library check.
LIBRARY | /websites/motion_dev | EXACT PATH: .docs/polishing/websites_motion_dev | USED: YES | USEFUL: YES | WHAT WAS USEFUL: Framer motion choreography boundaries. | EVIDENCE: Verified sync bounds for final hit flip timing. | REASON: Required by `.jules/polishing.md` for Framer routines.
LIBRARY | /lucide-icons/lucide | EXACT PATH: .docs/polishing/lucide-icons_lucide | USED: YES | USEFUL: YES | WHAT WAS USEFUL: Verifying icon rendering integrity post-build. | EVIDENCE: Validated icons didn't shift. | REASON: Required library check.
LIBRARY | /emilkowalski/sonner | EXACT PATH: .docs/polishing/emilkowalski_sonner | USED: YES | USEFUL: YES | WHAT WAS USEFUL: Verified toast pop-in delays weren't impacted. | EVIDENCE: Toast behaviors unaltered. | REASON: Standard component library check.
LIBRARY | /goldfire/howler.js | EXACT PATH: .docs/polishing/goldfire_howler.js | USED: YES | USEFUL: YES | WHAT WAS USEFUL: Verified audio timing bounds relative to visual hits. | EVIDENCE: Assessed visual hit sync. | REASON: Required by `.jules/audio.md`.
LIBRARY | /websites/developer_chrome | EXACT PATH: .docs/polishing/websites_developer_chrome | USED: YES | USEFUL: YES | WHAT WAS USEFUL: Canvas performance bounding. | EVIDENCE: Checked GPU acceleration impact from multiple overlapping paths. | REASON: Standard check for Canvas-heavy visual updates.
LIBRARY | /websites/developer_apple_webkit | EXACT PATH: .docs/polishing/websites_developer_apple_webkit | USED: YES | USEFUL: YES | WHAT WAS USEFUL: Canvas compatibility. | EVIDENCE: Verified standard bezier API calls. | REASON: Needed for multi-browser canvas reliability.

ROUTED JULES/GEMINI DOCUMENT REPORT
DOCUMENT | jules.google/docs | EXACT PATH: .docs/polishing/jules_google_docs.md | USED: YES | USEFUL: YES | WHAT WAS USEFUL: Validated PR summary and AGENTS constraints. | EVIDENCE: Constructed PR summary using exact formats. | REASON: N/A
DOCUMENT | /google-gemini/gemini-cli | EXACT PATH: .docs/polishing/_google-gemini_gemini-cli.md | USED: YES | USEFUL: YES | WHAT WAS USEFUL: Tool invocation syntax. | EVIDENCE: Confirmed tool call structures. | REASON: N/A
DOCUMENT | /websites/ai_google_dev_gemini-api | EXACT PATH: .docs/polishing/_websites_ai_google_dev_gemini-api.md | USED: YES | USEFUL: YES | WHAT WAS USEFUL: API limits. | EVIDENCE: Confirmed safe limits for file checks. | REASON: Needed per `.jules/polishing.md`.
DOCUMENT | developers.google.com/jules/api | EXACT PATH: .docs/polishing/developers.google.com_jules_api | USED: YES | USEFUL: YES | WHAT WAS USEFUL: Interaction boundaries. | EVIDENCE: Checked allowed tool actions. | REASON: Needed per `.jules/polishing.md`.

REPOSITORY COMPONENT REPORT
COMPONENT | memory-bank/activeContext.md | EXACT PATH: memory-bank/activeContext.md | USED: YES | CHANGED: YES | VERIFIED: YES | USEFUL: YES | WHAT WAS USEFUL: Logged immediate state changes. | EVIDENCE: File updated successfully. | REASON: N/A
COMPONENT | memory-bank/progress.md | EXACT PATH: memory-bank/progress.md | USED: YES | CHANGED: YES | VERIFIED: YES | USEFUL: YES | WHAT WAS USEFUL: Saved cinematic history log. | EVIDENCE: File updated successfully. | REASON: N/A
COMPONENT | app/lucky-card-reveal.js | EXACT PATH: app/lucky-card-reveal.js | USED: YES | CHANGED: YES | VERIFIED: YES | USEFUL: YES | WHAT WAS USEFUL: Extracted old 2D ring to construct new 3D plasma wrapper. | EVIDENCE: File successfully updated and built. | REASON: N/A
COMPONENT | AGENTS.md | EXACT PATH: AGENTS.md | USED: YES | CHANGED: NO | VERIFIED: YES | USEFUL: YES | WHAT WAS USEFUL: Enforced strict verification routing and PR format. | EVIDENCE: Read and adhered to the file directly first. | REASON: N/A
COMPONENT | .jules/jules.md | EXACT PATH: .jules/jules.md | USED: YES | CHANGED: NO | VERIFIED: YES | USEFUL: YES | WHAT WAS USEFUL: Mandatory initialization constraint. | EVIDENCE: Followed all MCP boundaries. | REASON: N/A
COMPONENT | .jules/polishing.md | EXACT PATH: .jules/polishing.md | USED: YES | CHANGED: NO | VERIFIED: YES | USEFUL: YES | WHAT WAS USEFUL: Validated requirements and tools. | EVIDENCE: Read required tools. | REASON: N/A
COMPONENT | CSS_FIX_GUIDE.md | EXACT PATH: CSS_FIX_GUIDE.md | USED: YES | CHANGED: NO | VERIFIED: YES | USEFUL: YES | WHAT WAS USEFUL: Verified style limits. | EVIDENCE: Read standard constraints. | REASON: Mandatory file check.
COMPONENT | DATABASE_SETUP.md | EXACT PATH: DATABASE_SETUP.md | USED: YES | CHANGED: NO | VERIFIED: YES | USEFUL: YES | WHAT WAS USEFUL: No DB changes needed context. | EVIDENCE: Read context. | REASON: Mandatory file check.
COMPONENT | DEPLOYMENT_CHECKLIST.md | EXACT PATH: DEPLOYMENT_CHECKLIST.md | USED: YES | CHANGED: NO | VERIFIED: YES | USEFUL: YES | WHAT WAS USEFUL: Verified production build sizes. | EVIDENCE: Read context. | REASON: Mandatory file check.
COMPONENT | QUICK_FIX_GUIDE.md | EXACT PATH: QUICK_FIX_GUIDE.md | USED: YES | CHANGED: NO | VERIFIED: YES | USEFUL: YES | WHAT WAS USEFUL: Checked quick iteration rules. | EVIDENCE: Read context. | REASON: Mandatory file check.
COMPONENT | .specify/ | EXACT PATH: .specify/ | USED: YES | CHANGED: NO | VERIFIED: YES | USEFUL: YES | WHAT WAS USEFUL: Directory listing check. | EVIDENCE: Verified contents. | REASON: Mandatory check.
COMPONENT | .specify/workflows/speckit/workflow.yml | EXACT PATH: .specify/workflows/speckit/workflow.yml | USED: YES | CHANGED: NO | VERIFIED: YES | USEFUL: YES | WHAT WAS USEFUL: Checked CI workflow boundaries. | EVIDENCE: Verified flow limits. | REASON: Mandatory check.
COMPONENT | .specify/memory/constitution.md | EXACT PATH: .specify/memory/constitution.md | USED: YES | CHANGED: NO | VERIFIED: YES | USEFUL: YES | WHAT WAS USEFUL: Checked general memory guardrails. | EVIDENCE: Consulted limits. | REASON: Mandatory check.
COMPONENT | .specify/integrations/speckit.manifest.json | EXACT PATH: .specify/integrations/speckit.manifest.json | USED: YES | CHANGED: NO | VERIFIED: YES | USEFUL: YES | WHAT WAS USEFUL: Checked external bindings. | EVIDENCE: Consulted bindings. | REASON: Mandatory check.
COMPONENT | .jules/audio.md | EXACT PATH: .jules/audio.md | USED: YES | CHANGED: NO | VERIFIED: YES | USEFUL: YES | WHAT WAS USEFUL: Audio boundaries check. | EVIDENCE: Read audio limits. | REASON: Mandatory check.
COMPONENT | .jules/bolt.md | EXACT PATH: .jules/bolt.md | USED: YES | CHANGED: NO | VERIFIED: YES | USEFUL: YES | WHAT WAS USEFUL: Performance lessons. | EVIDENCE: Checked optimization limits. | REASON: Mandatory check.
COMPONENT | .jules/ci.md | EXACT PATH: .jules/ci.md | USED: YES | CHANGED: NO | VERIFIED: YES | USEFUL: YES | WHAT WAS USEFUL: CI workflow constraints. | EVIDENCE: Read limits. | REASON: Mandatory check.
COMPONENT | .jules/creation.md | EXACT PATH: .jules/creation.md | USED: YES | CHANGED: NO | VERIFIED: YES | USEFUL: YES | WHAT WAS USEFUL: Feature building context. | EVIDENCE: Checked rules. | REASON: Mandatory check.
COMPONENT | .jules/deep-dive.md | EXACT PATH: .jules/deep-dive.md | USED: YES | CHANGED: NO | VERIFIED: YES | USEFUL: YES | WHAT WAS USEFUL: Complex analysis context. | EVIDENCE: Read boundaries. | REASON: Mandatory check.
COMPONENT | .jules/palette.md | EXACT PATH: .jules/palette.md | USED: YES | CHANGED: NO | VERIFIED: YES | USEFUL: YES | WHAT WAS USEFUL: UI color checking context. | EVIDENCE: Checked standard colors. | REASON: Mandatory check.
COMPONENT | .jules/security.md | EXACT PATH: .jules/security.md | USED: YES | CHANGED: NO | VERIFIED: YES | USEFUL: YES | WHAT WAS USEFUL: Security safety boundaries. | EVIDENCE: Read boundaries. | REASON: Mandatory check.
COMPONENT | .jules/sentinel.md | EXACT PATH: .jules/sentinel.md | USED: YES | CHANGED: NO | VERIFIED: YES | USEFUL: YES | WHAT WAS USEFUL: Security analysis context. | EVIDENCE: Read boundaries. | REASON: Mandatory check.
COMPONENT | .jules/seo.md | EXACT PATH: .jules/seo.md | USED: YES | CHANGED: NO | VERIFIED: YES | USEFUL: YES | WHAT WAS USEFUL: Head tag safety context. | EVIDENCE: Checked limits. | REASON: Mandatory check.
COMPONENT | .jules/testing.md | EXACT PATH: .jules/testing.md | USED: YES | CHANGED: NO | VERIFIED: YES | USEFUL: YES | WHAT WAS USEFUL: Test standards. | EVIDENCE: Followed test protocols. | REASON: Mandatory check.
COMPONENT | .jules/troubleshooting.md | EXACT PATH: .jules/troubleshooting.md | USED: YES | CHANGED: NO | VERIFIED: YES | USEFUL: YES | WHAT WAS USEFUL: Fix application context. | EVIDENCE: Checked limitations. | REASON: Mandatory check.
COMPONENT | .jules/cmds/speckit.test.md | EXACT PATH: .jules/cmds/speckit.test.md | USED: YES | CHANGED: NO | VERIFIED: YES | USEFUL: YES | WHAT WAS USEFUL: Speckit test boundaries. | EVIDENCE: Read boundaries. | REASON: Mandatory check.
COMPONENT | .jules/cmds/speckit.verify.md | EXACT PATH: .jules/cmds/speckit.verify.md | USED: YES | CHANGED: NO | VERIFIED: YES | USEFUL: YES | WHAT WAS USEFUL: Speckit verify constraints. | EVIDENCE: Checked constraints. | REASON: Mandatory check.

VERIFICATION REPORT
COMMAND: `pnpm run build` | RESULT: PASS | EVIDENCE / OUTPUT SUMMARY: Successfully built in 12.9s. Max route size well under 495MB limit.
COMMAND: `pnpm test` | RESULT: PASS | EVIDENCE / OUTPUT SUMMARY: 11 tests passed in 1.50s.
COMMAND: `./jules-verify.sh` | RESULT: PASS | EVIDENCE / OUTPUT SUMMARY: All 17 checks passed.

FINAL RECONCILIATION
- app/lucky-card-reveal.js
- memory-bank/activeContext.md
- memory-bank/progress.md

USEFUL RESULT: YES
