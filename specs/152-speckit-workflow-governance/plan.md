# Implementation Plan: Spec Kit Workflow Governance Alignment

**Branch**: `governance/speckit-workflow-alignment-152` | **Date**: 2026-11-13 | **Spec**: `specs/152-speckit-workflow-governance/spec.md`

**Input**: Feature specification in `specs/152-speckit-workflow-governance/spec.md`

## Summary

Make Section A.9 of `AGENTS.md` accurately describe the installed Spec Kit 1.4.0 command set, required core-stage sequence, required/conditional/optional template content, workflow-drift notification and the owner's authorization for a surgical governance correction. Update the existing governance test so these requirements remain enforced.

## Technical Context

**Language/Version**: Markdown and JavaScript tests; repository runtime Node.js 26.x.

**Primary Dependencies**: No dependency changes.

**Storage**: N/A.

**Testing**: Focused Vitest test `__tests__/agent-governance-single-source.test.js`; `./freebuff-verify.sh` when a shell-capable repository environment is available.

**Target Platform**: GitHub repository governance and documentation.

**Project Type**: Existing Next.js web application; this change is documentation and governance-test only.

**Performance Goals**: N/A — no runtime or application code changes.

**Constraints**: Dedicated governance PR; preserve unrelated governance; no application, dependency, security, deployment, visual or integration changes. Production build limit remains unchanged and no build is planned for this documentation-only change.

## Constitution Check

- `AGENTS.md` remains the single source of repository governance.
- The owner's authorization covers the narrowly scoped Section A.9 correction.
- The governance regression test is updated with the requirement so existing tests do not enforce superseded wording.
- The protected-file workflow classifies this as a dedicated governance PR; its human authorization gate remains required before merge.
- No payment, authentication, database, Cloudflare deployment, secrets, application behavior or visual assets are changed.
- No constitution violation or exception is introduced.

## Project Structure

### Documentation (this feature)

```text
specs/152-speckit-workflow-governance/
├── spec.md
├── research.md
├── plan.md
├── tasks.md
└── checklists/
    └── requirements.md
```

### Source Code (repository root)

```text
AGENTS.md
__tests__/agent-governance-single-source.test.js
.specify/feature.json
```

**Structure Decision**: Keep the change confined to the governance instructions, their existing regression test, and the Spec Kit feature pointer and records. No application source files or build configuration are changed.
