# Implementation Plan — Gemini PR Reviewer and Optional Fix Suggestions

## Approach
1. Keep `.gemini/rules/luckypickcanada.md` as Gemini's own short A–B–C instructions; preserve repository `AGENTS.md` as authoritative governance and leave Amazon Q's rules unchanged.
2. On automatic PR events, load the trusted Gemini instructions and `AGENTS.md`, but avoid a separate model call for document selection to limit usage.
3. For explicit `@gemini full review` and `@gemini repair all`, select the smallest relevant task group set using `.docs/manifest.json`; always load both required Gemini reference snapshots for every selected group.
4. Select additional local library snapshots only when relevant. Exclude Jules-specific documentation. Report selected groups, exact snapshots loaded, USED/USEFUL status, reasons, and missing/unloaded snapshots.
5. Use a dependency-free Node script with Gemini 3.8 Flash primary and Gemini 3.6 Flash fallback. Validate model output and only publish evidence-based findings with confidence at least 0.80.
6. For explicit fix requests, generate focused GitHub inline suggestion blocks only for eligible added lines in changed files. The owner must choose whether to apply each suggestion. No model-generated code is directly committed or pushed.
7. Test workflow configuration, document selection/reporting, commands, path restrictions, and JavaScript syntax. Use CI evidence and report anything not verified.

## Safety
- Do not print or commit secret values.
- Treat PR content and document snippets as untrusted data.
- Use minimum token permissions and trusted base-branch workflow/scripts; never execute PR-head code.
- Do not edit protected files, application APIs, authentication/security/payment/database/deployment paths, dependencies, Amazon Q rules, or `.docs/` snapshots.
- Never approve, enable auto-merge, or merge a pull request.
