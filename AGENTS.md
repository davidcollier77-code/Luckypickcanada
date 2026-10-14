# 🔴 AGENTS.md — Mandatory Governance

🔴 READ FIRST. Verify; never assume, guess, or claim without evidence.

## A — ANALYZE

Read `AGENTS.md` first. Then read `.jules/jules.md`, `memory-bank/projectBrief.md`, and `memory-bank/activeContext.md`.

Select the task group or groups that apply. The exact group files are `.jules/creation.md`, `.jules/troubleshooting.md`, `.jules/polishing.md`, `.jules/testing.md`, `.jules/security.md`, `.jules/audio.md`, `.jules/deep-dive.md`, and `.jules/seo.md`. Read every selected file and applicable specialist route; multiple groups are allowed.

For EVERY task, consult all four mandatory resources: Jules Documentation (`jules.google/docs`); Jules API (`developers.google.com/jules/api`); Gemini CLI (`/google-gemini/gemini-cli`); Gemini API (`/websites/ai_google_dev_gemini-api`).

For each selected group, read its actual local snapshots:
- Creation: `.docs/creation/jules_google_docs.md`, `.docs/creation/_google-gemini_gemini-cli.md`, `.docs/creation/_websites_ai_google_dev_gemini-api.md`
- Troubleshooting: `.docs/troubleshooting/jules_google_docs.md`, `.docs/troubleshooting/_google-gemini_gemini-cli.md`, `.docs/troubleshooting/_websites_ai_google_dev_gemini-api.md`
- Polishing: `.docs/polishing/jules_google_docs.md`, `.docs/polishing/_google-gemini_gemini-cli.md`, `.docs/polishing/_websites_ai_google_dev_gemini-api.md`
- Testing: `.docs/testing/jules_google_docs.md`, `.docs/testing/_google-gemini_gemini-cli.md`, `.docs/testing/_websites_ai_google_dev_gemini-api.md`
- Security: `.docs/security/jules_google_docs.md`, `.docs/security/_google-gemini_gemini-cli.md`, `.docs/security/_websites_ai_google_dev_gemini-api.md`
- Audio: `.docs/audio/jules_google_docs.md`, `.docs/audio/_google-gemini_gemini-cli.md`, `.docs/audio/_websites_ai_google_dev_gemini-api.md`
- Deep-dive: `.docs/deep-dive/jules_google_docs.md`, `.docs/deep-dive/_google-gemini_gemini-cli.md`, `.docs/deep-dive/_websites_ai_google_dev_gemini-api.md`
- SEO: `.docs/seo/jules_google_docs.md`, `.docs/seo/_google-gemini_gemini-cli.md`, `.docs/seo/_websites_ai_google_dev_gemini-api.md`

Check `.docs/manifest.json` as the source inventory and routing aid, not as a command to consult every library. Use task-relevant registered sources and follow specialist triggers; do not skip a relevant required source or consult unrelated sources. `.docs/` is READ-ONLY. Context7 requires explicit owner approval before EVERY invocation; mandatory documentation does not authorize it. Other MCPs require approval unless already explicitly authorized.

## B — BOUNDARIES + PLAN

Spec Kit is mandatory for EVERY task, in order:
1. `/speckit.specify` — `.jules/cmds/speckit.specify.md`
2. `/speckit.plan` — `.jules/cmds/speckit.plan.md`
3. `/speckit.tasks` — `.jules/cmds/speckit.tasks.md`
4. `/speckit.implement` — `.jules/cmds/speckit.implement.md`

Use native dispatch when available; otherwise follow each definition's complete procedure. Maintain the active feature's `spec.md`, `plan.md`, and `tasks.md`. If a stage or approval is blocked, stop and report the exact blocker. Run `./jules-verify.sh`; never bypass its gates.

Inspect files, configuration, dependencies, tests, and repository state before changes. Establish scope, plan, resources, verification, and authorization. Make the smallest appropriate change and preserve unrelated behavior. Explicit user authorization is required for changes to payments, databases/schema, authentication/security, APIs or existing functionality, deployment, secrets/environment, accessibility/responsive behavior, approved visuals/product behavior, documentation refresh systems, or `AGENTS.md`. Never expose secrets or weaken safeguards. Use pnpm, never `npm ci`. Measure every build: 495 MB is the hard maximum. At or above 495 MB, stop and report the safe resume point.

## C — EXECUTE + VERIFY

Run relevant tests; use configured Playwright verification for visual work. Inspect the final diff and every changed file.

The PR Summary must truthfully report: selected group(s) and reasons; consulted resources/libraries with version, USED, USEFUL, and specific reason; relevant components; exact changed-file paths; verification commands, results, and evidence; scope and authorization; remaining issues; `USEFUL RESULT: YES/NO`; and the final double-check. USED=YES means actually consulted or inspected; USEFUL=YES requires a concrete contribution. Never invent results. Update `memory-bank/activeContext.md` and `memory-bank/progress.md` as required. Missing demonstrated governance or an incomplete PR Summary means no task approval.
