# LuckyPickCanada — Amazon Q Rules
 
## 🔴 MANDATORY GOVERNANCE
 
**`.amazonq/rules/luckypickcanada.md` MUST be followed. Period.**
 
**This file governs Amazon Q only.**
 
**The PR summary MUST explicitly confirm compliance with this file, scope limits, and verification requirements.**
 
**DO NOT ASSUME. VERIFY. DO NOT CLAIM. DEMONSTRATE.**
 
## 🔴 A — ANALYZE
 
 
- Inspect the actual current repository, branch, PR, and relevant files.
 
- Read `.amazonq/rules/luckypickcanada.md` before making changes.
 
- Identify the exact files and functions involved.
 
- Independently validate every automated-review finding.
 
- Determine the actual root cause.
 
- Establish a relevant file baseline when practical: path, line count, size, and relevant sections.
 

 
## 🔴 B — BOUNDARIES
 
 
- Change only what the task requires.
 
- Make the smallest correct fix.
 
- Preserve existing functionality.
 
- No unrelated cleanup, refactoring, dependency changes, or architecture changes.
 
- Treat explicit exclusions as hard boundaries.
 
- **NO AUDIO CHANGES means no audio code, assets, timing, volume, or refactoring changes.**
 
- Do not modify protected systems without explicit authorization.
 

 
## 🔴 C — EXECUTE + VERIFY
 
 
- Inspect the complete final diff.
 
- Confirm every change is necessary and in scope.
 
- Re-check the original issue or finding.
 
- Run all required tests, builds, checks, and repository verification.
 
- Verify relevant behavior, not merely build success.
 
- Compare final files against the baseline.
 
- Correct unintended changes before completion.
 

 
## 🔴 AUTOMATED REVIEW FINDINGS
 
**Validate → Root Cause → Scope → Fix → Verify → Report**
 
Never blindly apply a reviewer suggestion.
 
## 🔴 PROTECTED SYSTEMS
 
Do not modify without explicit authorization:
 
 
- Payments / Stripe
 
- Pricing / webhooks
 
- Authentication / authorization
 
- Database schema / migrations
 
- Secrets / environment variables
 
- Cloudflare / deployment configuration
 

 
Never expose, print, copy, or commit secrets or credentials.
 
## 🔴 FINAL PR SUMMARY
 
The PR summary MUST state:
 
 
- What was investigated and verified.
 
- Root cause.
 
- What changed.
 
- Exact changed files.
 
- What remained unchanged and why.
 
- Reviewer findings and their resolution.
 
- Verification performed and actual results.
 
- File baseline comparison where measured.
 
- Explicit confirmation that `.amazonq/rules/luckypickcanada.md` was followed.
 

 
**No evidence = no claim.**
 
**No final diff audit = no completion.**
 
**No required verification = no completion.**
 
**No compliance with `.amazonq/rules/luckypickcanada.md` = NO TASK APPROVAL.**
