# Spec: Gemini Reviewer Selected Findings

## Objective
Improve Gemini PR Reviewer to support a "Select-Findings-Then-Fix-Selected" workflow. Improve detection and presentation of defects.

## Requirements
1. **Interactive Checklist**:
   - Present findings as a markdown checklist (`- [ ] Finding ...`).
   - Allow user to check (`[x]`) one or more findings.
2. **"Fix Selected Issues" Action**:
   - Must have a clearly labelled action checkbox: `- [ ] 🛠️ **Fix selected findings**`
   - If selected findings > 0, generate fix suggestions *only* for the selected findings.
   - If no findings selected, safely do nothing and explain.
   - Reject stale, duplicate, or mismatched selections against PR HEAD.
3. **Preserve existing Commands & Safety**:
   - Keep `@gemini full review`.
   - Keep `@gemini repair one <path>:<line> -- <finding title>`.
   - Keep `@gemini repair all` (all eligible findings).
   - No auto-commits, pushes, merges.
   - Keep suggestion constraints (one added line, safe code).
4. **Improved Review Quality**:
   - Gather source context efficiently to avoid false positives.
   - Test against recent PR misses (e.g. AVIF/WebP mismatch if possible).
5. **No Visual Changes**: Do not touch website layout, visuals, animations, AVIF/WebP structure.

## Artifacts
- Updated `.github/scripts/gemini-reviewer.cjs`
- Updated `__tests__/gemini-reviewer-context.test.ts`
