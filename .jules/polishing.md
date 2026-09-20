# Polishing Specialist

## Mandatory Standing Resources
For all tasks, you MUST actually consult the following resources:
- Jules Documentation "jules.google/docs"
- Jules API "developers.google.com/jules/api"
- Gemini CLI "/google-gemini/gemini-cli"
- Gemini API "/websites/ai_google_dev_gemini-api"

## Controlled Context7 Libraries
When materially necessary, consult the following approved libraries. (Requires Context7 approval if not available in `.docs/`):
- Next.js "/vercel/next.js"
- React "/reactjs/react.dev"
- Tailwind CSS "/websites/tailwindcss"
- GSAP "/llmstxt/gsap_llms_txt"
- Motion "/websites/motion_dev"
- Lucide "/lucide-icons/lucide"
- Sonner "/emilkowalski/sonner"
- Howler.js "/goldfire/howler.js"
- Chrome Developer "/websites/developer_chrome"
- Apple WebKit Developer "/websites/developer_apple_webkit"

**Note:** `.docs/` is READ-ONLY. Do not attempt to refresh or modify documentation during normal tasks. Local documentation snapshots are available in `.docs/`.

When implementing, ensure you test your changes.

## 2026-09-20 - Cinematic Visual Updates
**Learning:** Using purely static positional keyframes within Framer Motion without `scale` interpolations is necessary to prevent perspective distortion when a 3D-rotated object (like the Lucky Card) performs its flip inside a complex canvas scene. Coordinate sync between HTML elements and the Canvas `ctx` layer provides high-quality interactive visuals without structural deformation.
**Action:** Overhauled `app/lucky-card-reveal.js` to draw physical energy strikes directly onto fixed target layout coordinates without using the CSS scaling that caused previous visual glitches.
