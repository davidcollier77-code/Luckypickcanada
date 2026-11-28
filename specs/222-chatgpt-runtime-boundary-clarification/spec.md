# Feature Specification: ChatGPT Runtime Governance Clarification

**Feature Branch**: `222-chatgpt-runtime-boundary-clarification`
**Created**: 2026-11-26
**Status**: Implemented

## Goal

Make AGENTS.md ChatGPT Operating Instructions §6 unambiguous about ChatGPT's Node.js 22.x environment, the repository's Node.js 26.x requirement, the unavailable repository Playwright CLI setup, and permission to run all other compatible repository/Freebuff scripts.

## Requirements

- ChatGPT MUST continue to use only the ChatGPT Library startup README and its designated startup script.
- ChatGPT MUST use Node.js 22.x in its own environment and MUST NOT attempt to install or switch to Node.js 26.x.
- Repository operations that require Node.js 26.x MUST NOT be run under ChatGPT's Node.js 22.x runtime; only those operations are blocked.
- The repository Playwright CLI and its setup/installation MUST NOT be attempted in ChatGPT's environment.
- Other repository scripts, QA checkers, Freebuff verification scripts and PR-support scripts MUST remain permitted when their own prerequisites, runtime, permissions and side effects are acceptable.
- Freebuff's startup/environment-provisioning sequence MUST NOT be run by ChatGPT because it provisions Freebuff's separate Node.js 26.x / Playwright environment.
- A regression test MUST assert these rules so future edits cannot reintroduce ambiguous blanket restrictions.

## Scope

Only `AGENTS.md` §6, its governance regression test, the required Spec Kit records, and the corresponding Memory Bank records. No application code, dependencies, Cloudflare configuration, deployment workflow, secrets or production resources.
