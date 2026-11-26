# Implementation Plan: ChatGPT Repository Execution Guidance

**Branch**: `222-chatgpt-repository-execution-guidance` | **Date**: 2026-11-26 | **Spec**: [spec.md](spec.md)

**Input**: Owner-authorized correction to ChatGPT-only Section 6 of `AGENTS.md`.

## Summary

Replace Section 6's blanket ban on repository scripts and Node.js-26-gated execution with precise instructions for ChatGPT's own Library startup process and the only two environment limitations: Node.js 22.x cannot satisfy Node.js-26-specific commands, and the repository Playwright CLI does not work in ChatGPT's environment. Explicitly permit other suitable repository scripts and utilities, including those whose filenames contain `freebuff`. Update the existing governance regression test so the correction cannot silently regress.

## Technical Context

- **Language/version**: Markdown and JavaScript/Vitest source; repository execution targets Node.js 26.x.
- **Dependencies**: No dependency or lockfile changes.
- **Storage/platform**: GitHub repository documentation and existing CI.
- **Testing**: `__tests__/agent-governance-single-source.test.js`, `.github/scripts/test_agents_md_protection.py`, dedicated protected-file workflow, PR Scope Verification and the consolidated seven-category PR report.
- **Project type**: Governance documentation and regression coverage.
- **Performance/build**: No production code or build inputs change. The trusted build classifier treats `AGENTS.md`, Markdown task records and `__tests__/` as build-exempt; the visual classifier treats Markdown and direct unit tests under `__tests__/` as non-rendering.
- **Constraints**: Preserve AGENTS.md's 200-line test, BOTH/FREEBUFF ONLY/CHATGPT ONLY classification, Node runtime boundary, Python Playwright-first policy, protected-file detection, digest approval and separate protected-file GitHub Environment authorization. No unrelated path changes.

## Constitution Check

- The owner explicitly authorized this protected governance change.
- The current `.specify/memory/constitution.md`, workflow registry, templates and available workflow definitions were inspected. The required specify → plan → tasks → implement sequence is represented by this feature's three artifacts and the implementation diff.
- `.freebuff/cmds/` remains Freebuff-only and is not used as ChatGPT's operating procedure.
- `AGENTS.md` remains the sole repository governance authority; its surrounding sections are preserved.
- The existing protected-file classifier and workflow are not weakened or modified. The PR must retain the exact human-authorization declaration, governance digest approval and separate protected-file environment gate.
- No application behavior, assets, runtime dependencies, secrets, deployment configuration, workflows, startup Library files or production resources change.
- `.docs/manifest.json` is consulted for task relevance; no additional `.docs/` snapshot is necessary for this focused wording/test change.
- The active Spec Kit pointer is left unchanged to avoid colliding with the already-open Spec 221 PR; the repository's task gate discovers the single feature directory from the changed Spec Kit artifacts.

## Project Structure

- `AGENTS.md` — replace only ChatGPT-only Section 6.
- `__tests__/agent-governance-single-source.test.js` — update the existing ChatGPT environment regression assertions.
- `specs/222-chatgpt-repository-execution-guidance/spec.md` — requirements and acceptance scenarios.
- `specs/222-chatgpt-repository-execution-guidance/plan.md` — this plan.
- `specs/222-chatgpt-repository-execution-guidance/tasks.md` — implementation and verification record.

## Complexity Tracking

No new systems, dependencies, test harnesses, workflows or protections are introduced. The change narrows wording to the actual available environment and strengthens the existing governance test.
