# Jules Governance Flow

## Goal
Make Jules tasks predictable and easier to complete by removing redundant context loading, avoiding non-blocking approval pauses, and preventing shared active-feature metadata from creating cross-PR conflicts.

## User story
As the repository owner, I want one strict, sequential, task-scoped workflow so Jules completes authorized work without repeatedly loading unrelated instructions, asking for routine confirmation, dispatching duplicate work, or requiring commits to shared checkout-local Spec Kit state.

## Requirements
- Read AGENTS.md first, then load only the required common context, one selected task group, its routed documents, and the command definitions actually used.
- Keep the four Spec Kit stages in order, run each once, and keep artifacts concise.
- Do not stop for unchecked checklist items unless a real blocking gate, safety/security risk, missing essential input, or authorization boundary requires it.
- Treat .specify/feature.json as local checkout state, not a shared committed PR artifact.
- Verify exactly one changed feature directory contains non-empty spec.md, plan.md, and tasks.md; fail clearly for missing or multiple feature directories.
- Preserve all existing protected-system, security, verification, and 495 MB build-size safeguards.

## Out of scope
- Application behavior, visuals, audio, dependencies, deployment, secrets, and production configuration.
- Weakening the required Spec Kit sequence or mandatory verification.

## Acceptance criteria
- The verifier passes when one task's three artifacts are changed and no feature.json exists.
- The verifier fails closed for missing, empty, stale-only, or ambiguous multiple task artifact sets.
- Regression tests cover those pass/fail paths.
- Jules governance and command definitions have one consistent sequential workflow.
- Repository CI determines whether the changes are ready to merge.
