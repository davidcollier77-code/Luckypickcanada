# Specification — Gemini PR Reviewer and Opt-In Auto-Fix

## Goal
Provide an independent Gemini-powered code reviewer for LuckyPickCanada with actionable review quality comparable to or better than the existing Amazon Q review standards, plus explicit, optional auto-fix.

## Requirements
- Automatically review pull requests when opened, reopened, updated with commits, made ready for review, or review-requested.
- Use Gemini 3.8 Flash as the primary model and Gemini 3.6 Flash as fallback when the primary call is unavailable or fails after a bounded retry.
- Load and follow .gemini/rules/luckypickcanada.md on every review and fix run. Leave Amazon Q's original rule file unchanged.
- Inspect relevant changes, report evidence-based bugs/regressions/security/error-handling/performance/test findings, filter low-confidence findings, and offer concise explanations and practical fixes.
- Select relevant local .docs/ groups and snapshots from the manifest without an arbitrary one-group restriction. Report exact snapshots actually consulted, whether they were materially useful, and why.
- Post one review summary plus inline comments for verified changed-line findings; include GitHub suggestion blocks when a safe targeted code suggestion is available.
- Never edit code during an ordinary review. Only apply auto-fixes after an explicit trusted /gemini-fix comment or manual fix workflow dispatch.
- Restrict auto-fix to eligible files already changed in the same-repository PR. Validate the patch, check whitespace, create a commit on the PR branch, and leave the PR open and unmerged.
- Use trusted base-branch workflow/script/rules for pull-request events. Never execute code from PR head during review or auto-fix.
- Use the existing Actions secret name GEMINI_API_KEY; never expose its value or alter secrets.
- Do not add dependencies, change application runtime behavior, or modify Amazon Q's rules.
