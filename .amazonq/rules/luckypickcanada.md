LuckyPickCanada — Amazon Q Rules

🔴 MANDATORY GOVERNANCE

".amazonq/rules/luckypickcanada.md" MUST be followed. Period.

This file governs Amazon Q only.

The PR summary MUST explicitly confirm compliance with this file, scope limits, and verification requirements.

DO NOT ASSUME. VERIFY. DO NOT CLAIM. DEMONSTRATE.

🔴 A — ANALYZE

- Inspect the actual current repository, branch, PR, and relevant files.

- Read ".amazonq/rules/luckypickcanada.md" before making changes.

- Identify the exact files and functions involved.

- Independently validate every automated-review finding.

- Determine the actual root cause.

- Establish a relevant file baseline when practical: path, line count, size, and relevant sections.

🔴 B — BOUNDARIES

- Change only what the task requires.

- Make the smallest correct fix.

- Preserve existing functionality.

- No unrelated cleanup, refactoring, dependency changes, or architecture changes.

- Treat explicit exclusions as hard boundaries.

- NO AUDIO CHANGES means no audio code, assets, timing, volume, or refactoring changes.

- Do not modify protected systems without explicit authorization.

🔴 C — EXECUTE + VERIFY

- Inspect the complete final diff.

- Confirm every change is necessary and in scope.

- Re-check the original issue or finding.

- Run all required tests, builds, checks, and repository verification.

- Verify relevant behavior, not merely build success.

- Compare final files against the baseline.

- Correct unintended changes before completion.

🔴 AUTOMATED REVIEW FINDINGS

Validate → Root Cause → Scope → Fix → Verify → Report

Never blindly apply a reviewer suggestion.

🔴 LIBRARY ACCESS — READ ONLY

Amazon Q has access to the project's Library system as a reference and documentation source.

The Library is read-only for Amazon Q. Q must never modify, create, delete, overwrite, or otherwise change Library content.

Required Library Workflow

1. Determine the single most applicable task/documentation group for the assigned task.

2. Locate the Library documents belonging to that group.

3. Read and follow the relevant libraries/documents in that group.

4. Use the Library material as supporting governance, requirements, documentation, or technical guidance for the assigned task.

5. Do not attempt to follow every Library document or every group. Select the one group that is applicable to the task.

6. If multiple documents exist within the selected group, consult the documents that are relevant to the task.

7. If a required Library document cannot be accessed, state that explicitly. Do not assume or invent its contents.

8. Do not modify the Library under any circumstances.

Library Consultation Evidence

The final PR summary MUST include a LIBRARY CONSULTATION REPORT identifying the actual Library documents consulted.

For each consulted document, report:

"LIBRARY/DOCUMENT | VERSION | USED: YES/NO | USEFUL: YES/NO | REASON"

Only report USED: YES when the document was actually opened/read.

Only report USEFUL: YES when the document materially informed the assigned task.

No Library consultation claim without evidence.

The Library is reference-only. Q must never update the Library.

🔴 PROTECTED SYSTEMS

Do not modify without explicit authorization:

- Payments / Stripe

- Pricing / webhooks

- Authentication / authorization

- Database schema / migrations

- Secrets / environment variables

- Cloudflare / deployment configuration

Never expose, print, copy, or commit secrets or credentials.

🔴 FINAL PR SUMMARY

The PR summary MUST state:

- What was investigated and verified.

- Root cause.

- What changed.

- Exact changed files.

- What remained unchanged and why.

- Reviewer findings and their resolution.

- Verification performed and actual results.

- File baseline comparison where measured.

- LIBRARY CONSULTATION REPORT, including the actual Library documents consulted and how they informed the task.

- Explicit confirmation that ".amazonq/rules/luckypickcanada.md" was followed.

- Explicit confirmation that the Library was treated as read-only and was not modified.

No evidence = no claim.

No final diff audit = no completion.

No required verification = no completion.

No compliance with ".amazonq/rules/luckypickcanada.md" = NO TASK APPROVAL.