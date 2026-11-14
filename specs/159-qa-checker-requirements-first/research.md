# Research: QA Checker Requirements Before Task Specification

## Repository Findings

- AGENTS.md already requires agents to inspect applicable QA and validation requirements in Section A.8, but its wording focuses on identifying checks as targets before implementation.
- PR_SUBMISSION.md separately requires checker requirements to be reviewed before implementation and again before submission. That is too late to ensure those requirements shape the initial task specification.
- The existing QA scope checker validates declared changed paths, per-file purposes, scope expansion, baseline updates, governance declarations and browser evidence. It requires explicit owner approval for governance changes.
- The protected-file workflow classifies AGENTS.md edits as dedicated governance changes only when unrelated application/workflow changes are absent. It also requires human authorization through the protected-file-authorization environment before merge.
- The existing governance regression suite reads AGENTS.md and verifies canonical governance requirements. It is the appropriate place to guard the new planning-stage requirement.

## Decision

Add a distinct section in Section A — PREPARE AND PLAN, before the current QA validation item. It requires agents to inspect actual QA checker definitions and understand what they detect, enforce or prevent before drafting task specifications. The findings must shape task scope, constraints, implementation approach, acceptance criteria and verification planning.

No checker implementation or existing pass/fail requirement is changed.
