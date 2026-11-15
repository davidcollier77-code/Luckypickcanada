# Evidence — Freebuff Playwright Agent Guidance

## Source Review

- Confirmed the repository-pinned interactive launcher is `./scripts/playwright-cli.sh`.
- Confirmed Option A is `pnpm exec playwright test` using `playwright.config.ts`.
- Confirmed Option B is `pnpm exec playwright test --config=playwright.swiftshader.config.ts`, which forces ANGLE/SwiftShader, uses one worker and no retries, and is intended for software-rendered graphics investigations.
- Confirmed README.md already documents the lengthy Freebuff startup procedure; this change does not duplicate it.
- Confirmed the AGENTS.md protection workflow requires a dedicated governance PR and owner authorization before merge.

## Change Scope

- Updated AGENTS.md only within the new Playwright guidance section.
- Extended the existing governance regression test with assertions for the new section.
- Did not change Playwright scripts, browser setup, Playwright configurations, CI workflows, application code or README.md.

## Verification Status

- **PASS — source review:** Existing launcher and both Playwright mode commands were confirmed from repository files.
- **PASS — scope review:** Changed implementation scope is limited to AGENTS.md and its existing governance test; supporting Spec Kit and Memory Bank records are task documentation.
- **NOT RUN — focused Vitest:** No shell-capable repository checkout is available through the connected GitHub editing interface.
- **NOT RUN — freebuff-verify.sh:** ChatGPT is explicitly prohibited from loading or executing this script.
- **PENDING — PR workflows:** Run independently after PR creation; no result is claimed here.
