# Creation Specialist

## Shared Engineering Practices Reference

When it materially helps with the task, consult the shared Google Engineering Practices snapshot at `.docs/creation/_google_eng-practices.md`. It offers cross-cutting guidance on design, functionality, complexity, tests, naming, comments, style, and documentation. This is an optional reference, not required reading for every task. Apply only what is relevant; it supplements but never overrides `AGENTS.md`, repository conventions, or this group's instructions. The upstream source is Google's [What to Look For in a Code Review](https://github.com/google/eng-practices/blob/master/review/reviewer/looking-for.md), licensed under [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/). The upstream repository is archived, so the updater can synchronize the fixed source but Google is no longer actively maintaining it.


## Conditional Gemini API Developer Skill Reference
Consult `.docs/creation/_google-gemini_gemini-skills_gemini-api-dev.md` only when the task directly changes code that calls, configures, or integrates with the Gemini API or SDK. This is a specialist reference, not a general-purpose coding requirement. Do not load it merely because a task, PR title, documentation page, or reviewer mentions Gemini. Apply its guidance only to the Gemini API-specific work, and do not infer authorization for API or model migrations.

## Optional Gemini API Overview
Use `.docs/creation/_websites_ai_google_dev_gemini-api.md` when the task directly involves implementing, configuring, or troubleshooting a Gemini API integration. It is not a mandatory general-purpose coding reference.

## Conditional Gemini CLI Reference
Consult the Gemini CLI reference only when the task directly involves creating, configuring, modifying, or integrating Gemini CLI commands or behavior. Start with the local snapshot `.docs/creation/_google-gemini_gemini-cli.md` (read-only); do not load it for unrelated tasks. If the snapshot is insufficient and live documentation is materially necessary, use `/google-gemini/gemini-cli` only under the repository's explicit MCP approval rules.

## Controlled Context7 Libraries
When materially necessary, consult the following approved libraries. (Requires Context7 approval if not available in `.docs/`):
- GitHub Docs "/github/docs"
- Next.js "/vercel/next.js"
- React "/reactjs/react.dev"
- TypeScript "/microsoft/typescript"
- Tailwind CSS "/websites/tailwindcss"
- Motion "/websites/motion_dev"
- Lucide "/lucide-icons/lucide"
- React Hook Form "/react-hook-form/documentation"
- React Hook Form Resolvers "/react-hook-form/resolvers"
- Sonner "/emilkowalski/sonner"
- React Error Boundary "/bvaughn/react-error-boundary"
- Dropbox zxcvbn "/dropbox/zxcvbn"
- React Three Fiber "/pmndrs/react-three-fiber"
- Google WebP "/websites/google_webp"
- Sharp "/lovell/sharp"
- web.dev Images "/websites/web_dev_images"
- MDN Image Types "/websites/mdn_image_types"

**Note:** `.docs/` is READ-ONLY. Do not attempt to refresh or modify documentation during normal tasks. Local documentation snapshots are available in `.docs/`.

When implementing, ensure you test your changes.
