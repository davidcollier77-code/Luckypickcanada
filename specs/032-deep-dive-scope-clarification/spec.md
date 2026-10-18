# Feature Specification: Deep-Dive Investigation Scope Clarification

**Feature Branch**: `fix/deep-dive-audit-scope-clarification-20261018`  
**Created**: 2026-10-18  
**Status**: Wording correction prepared; required CI verification pending  
**Input**: Correct the deep-dive specialist rule so an explicitly authorized audit-only task is allowed without weakening evidence and reporting requirements.

## User Scenarios & Testing

### User Story 1 — Owner-authorized audits stay within scope (Priority: P1)

A repository owner explicitly authorizes an audit or report-only investigation. Jules must be allowed to complete the requested investigation without manufacturing code changes, deleting files, or expanding the scope.

**Acceptance Scenarios**:

1. **Given** the owner explicitly authorizes audit-only scope, **when** Jules completes the task, **then** it may deliver substantive findings and recommendations without implementation changes.
2. **Given** an investigation is authorized to include implementation, **when** evidence identifies a verified issue within scope, **then** findings should inform appropriate implementation work.
3. **Given** an audit-only task, **when** Jules reports completion, **then** it must still include evidence, limitations, next steps, and required verification/reporting.
4. **Given** this wording correction, **when** the diff is reviewed, **then** `AGENTS.md`, `.docs/`, application code, dependencies, and runtime behavior remain unchanged.

## Scope Boundaries

- In scope: clarify the final investigation-scope rule in `.jules/deep-dive.md` and maintain the required Spec Kit and Memory Bank records.
- Out of scope: changing `AGENTS.md`, changing `.docs/`, removing assets/dependencies, changing workflows or runtime code, or changing unrelated governance.
- Verification: inspect the exact diff and run the repository-required `./jules-verify.sh` plus PR checks before treating the task as fully verified.
