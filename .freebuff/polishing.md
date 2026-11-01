# Polishing Specialist

## Shared Engineering Practices Reference

When it materially helps with the task, consult the shared Google Engineering Practices snapshot at `.docs/polishing/_google_eng-practices.md`. It offers cross-cutting guidance on design, functionality, complexity, tests, naming, comments, style, and documentation. This is an optional reference, not required reading for every task. Apply only what is relevant; it supplements but never overrides `AGENTS.md`, repository conventions, or this group's instructions. The upstream source is Google's [What to Look For in a Code Review](https://github.com/google/eng-practices/blob/master/review/reviewer/looking-for.md), licensed under [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/). The upstream repository is archived, so the updater can synchronize the fixed source but Google is no longer actively maintaining it.


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
- axe-core "/dequelabs/axe-core"
- Magic UI "/magicuidesign/magicui"
- Pillow "/python-pillow/Pillow"
- NumPy "/numpy/numpy"
- Google WebP "/websites/google_webp"
- Sharp "/lovell/sharp"
- web.dev Images "/websites/web_dev_images"
- MDN Image Types "/websites/mdn_image_types"

## Required Reference for Image-Format and Raster-Asset Optimization
When a polishing task selects, converts, or serves raster image formats (including AVIF, WebP, JPEG, and PNG), you MUST consult the repository's maintained MDN image-format reference before deciding on the format strategy:
- `.docs/polishing/_websites_mdn_image_types.md` (manifest source ID: `/websites/mdn_image_types`; upstream: https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/Image_types)
- Also consult the relevant project-specific image optimization guide/checklist and applicable implementation library documentation, such as Sharp or Next.js, when relevant.
- Apply the reference to the actual task: compare browser support, quality/size trade-offs, transparency needs, and fallback behavior rather than blindly preferring one format.
- In the PR Summary, list this MDN document under the documents actually consulted and explain its concrete contribution. Set `USED: NO` if it was not actually consulted; never infer or claim use from its presence in the manifest alone.

**Note:** `.docs/` is READ-ONLY. Do not attempt to refresh or modify documentation during normal tasks. Local documentation snapshots are available in `.docs/`.

When implementing, ensure you test your changes.

## 2026-09-20 - Cinematic Visual Updates
**Learning:** Using purely static positional keyframes within Framer Motion without `scale` interpolations is necessary to prevent perspective distortion when a 3D-rotated object (like the Lucky Card) performs its flip inside a complex canvas scene. Coordinate sync between HTML elements and the Canvas `ctx` layer provides high-quality interactive visuals without structural deformation.
**Action:** Overhauled `app/lucky-card-reveal.js` to draw physical energy strikes directly onto fixed target layout coordinates without using the CSS scaling that caused previous visual glitches.
