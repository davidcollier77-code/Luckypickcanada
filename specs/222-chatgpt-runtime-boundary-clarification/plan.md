# Implementation Plan: ChatGPT Runtime Governance Clarification

**Feature**: Spec 222
**Date**: 2026-11-26

1. Replace only the three environment/execution bullets in AGENTS.md §6 with explicit Node.js, Playwright and general-script permission boundaries.
2. Preserve the existing Library startup instructions and the separate Freebuff startup exclusion.
3. Update the existing governance regression test to assert the exact distinctions and permitted scripts.
4. Update the active Spec Kit pointer and required Memory Bank records.

## Verification

- Review the exact AGENTS.md diff and confirm no other governance section changes.
- Run the existing governance regression test and repository-required verification in CI.
- ChatGPT cannot run Node.js 26-dependent project operations or the repository Playwright CLI setup; PR-triggered checks remain authoritative.
