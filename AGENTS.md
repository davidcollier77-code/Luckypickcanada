# 🔴 AGENTS.md — Mandatory Governance

🔴 READ FIRST. Verify; never guess or make unsupported claims.

## A — ANALYZE

Read `AGENTS.md`, `.jules/jules.md`, `memory-bank/projectBrief.md`, and `memory-bank/activeContext.md` first.

Select the task group or groups that apply. Exact group files: `.jules/creation.md`, `.jules/troubleshooting.md`, `.jules/polishing.md`, `.jules/testing.md`, `.jules/security.md`, `.jules/audio.md`, `.jules/deep-dive.md`, and `.jules/seo.md`. Read selected files and routes; multiple groups are allowed.

Every task requires four resources: Jules Documentation (`jules.google/docs`); Jules API (`developers.google.com/jules/api`); Gemini CLI (`/google-gemini/gemini-cli`); Gemini API (`/websites/ai_google_dev_gemini-api`).

Read these exact snapshots for each selected group:
- Creation: `.docs/creation/jules_google_docs.md`, `.docs/creation/_google-gemini_gemini-cli.md`, `.docs/creation/_websites_ai_google_dev_gemini-api.md`
- Troubleshooting: `.docs/troubleshooting/jules_google_docs.md`, `.docs/troubleshooting/_google-gemini_gemini-cli.md`, `.docs/troubleshooting/_websites_ai_google_dev_gemini-api.md`
- Polishing: `.docs/polishing/jules_google_docs.md`, `.docs/polishing/_google-gemini_gemini-cli.md`, `.docs/polishing/_websites_ai_google_dev_gemini-api.md`
- Testing: `.docs/testing/jules_google_docs.md`, `.docs/testing/_google-gemini_gemini-cli.md`, `.docs/testing/_websites_ai_google_dev_gemini-api.md`
- Security: `.docs/security/jules_google_docs.md`, `.docs/security/_google-gemini_gemini-cli.md`, `.docs/security/_websites_ai_google_dev_gemini-api.md`
- Audio: `.docs/audio/jules_google_docs.md`, `.docs/audio/_google-gemini_gemini-cli.md`, `.docs/audio/_websites_ai_google_dev_gemini-api.md`
- Deep-dive: `.docs/deep-dive/jules_google_docs.md`, `.docs/deep-dive/_google-gemini_gemini-cli.md`, `.docs/deep-dive/_websites_ai_google_dev_gemini-api.md`
- SEO: `.docs/seo/jules_google_docs.md`, `.docs/seo/_google-gemini_gemini-cli.md`, `.docs/seo/_websites_ai_google_dev_gemini-api.md`

Use `.docs/manifest.json` as an inventory, not a command to read every library. Follow relevant source registrations and specialist triggers. `.docs/` is READ-ONLY. Context7 requires explicit owner approval before EVERY invocation; mandatory documentation does not authorize it. Other MCPs need approval unless already explicitly authorized. 

## B — BOUNDARIES + PLAN

Spec Kit is mandatory for EVERY task, in order:
1. `/speckit.specify` — `.jules/cmds/speckit.specify.md`
2. `/speckit.plan` — `.jules/cmds/speckit.plan.md`
3. `/speckit.tasks` — `.jules/cmds/speckit.tasks.md`

Complete stages 1–3 in this section. These Markdown files are definitions, not commands; use native dispatch or each definition's full file-driven procedure. Do not implement until Section C. Report each stage's command, definition path, actual method, result, and artifact paths. Maintain the active feature's `spec.md`, `plan.md`, and `tasks.md`; keep `.specify/feature.json` pointed at it. If blocked, stop and report the exact blocker.

Inspect files, configuration, dependencies, tests, and Git state. Before editing, establish scope, authorization, and verification. Make only scoped changes; avoid unrelated refactors, redesigns, upgrades, or dependencies. Explicit authorization is required for payments, databases/schema, authentication/security, APIs or existing functionality, deployment, secrets/environment, accessibility/responsive behavior, approved visuals/product behavior, documentation refresh systems, or `AGENTS.md`. Never expose secrets or weaken validation, sanitization, authorization, Turnstile/CAPTCHA, rate limits, duplicate protection, or environment handling. Inspect `package.json` before using scripts. Use pnpm, never `npm ci`. Measure every build: 495 MB is the hard maximum. At or above 495 MB, stop and report the safe resume point.

For audio work, follow `.jules/audio.md`; Howler is primary unless routed guidance says otherwise. Consult `.docs/polishing/_goldfire_howler_js.md` when relevant; do not add prohibited public MP3 assets. Preserve accessibility, keyboard behavior, responsive behavior, and `prefers-reduced-motion`.

## C — EXECUTE + VERIFY

Only after B stages 1–3, complete stage 4: `/speckit.implement` using `.jules/cmds/speckit.implement.md` and its full procedure. Then run `./jules-verify.sh`; never bypass gates. Run relevant tests; use Playwright via `playwright.config.ts` for visual work. Inspect every changed file and the final diff.

The PR Summary must truthfully report selected group(s) and reasons; every routed document, resource/library (name and version), and relevant component with USED=YES/NO, USEFUL=YES/NO, and a specific reason; exact changed paths reconciled with the diff; verification commands, results, and evidence; scope, authorization, and remaining issues; `USEFUL RESULT: YES/NO`; and the final double-check. USED=YES means actually consulted or inspected; USEFUL=YES requires a concrete contribution. Never invent results. Update `memory-bank/activeContext.md` and `memory-bank/progress.md` as required. Missing demonstrated governance or an incomplete PR Summary means no task approval.
