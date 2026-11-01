# Plan: Gemini Reviewer Instruction Consolidation and Library-Context Removal

**Branch**: `freebuff/d83726e9f4ebf83f38ce1768` | **Date**: 2026-11-01
**Spec**: `.specify/features/gemini-review-context/spec.md`

## Summary

Replace the reviewer's `.gemini/rules/luckypickcanada.md` instruction source with one root-level
`GEMINI_REVIEWER.md` written in the Amazon Q A/B/C shape, consolidating only the Gemini-specific
rules the implementation needs. Delete the reviewer's entire Library-document path: manifest
parsing, group classification, document selection, snapshot loading, document assessment fields,
and the related report and coverage gaps. Keep source retrieval, coverage disclosure, batching,
the adversarial pass, JSON validation and recovery, the model chain, review formatting, and the
opt-in fix workflow exactly as they are.

## Technical Context

- **Language / Runtime**: Node.js 22.x CommonJS reviewer and autofix scripts; no new dependencies.
- **Instruction loading**: `readFileSync` of `RULE_PATH = "GEMINI_REVIEWER.md"` at module scope,
  unchanged fail-closed check `if (!RULES) throw ...`.
- **Testing**: `pnpm test -- __tests__/gemini-reviewer-context.test.ts`, `...-workflow.test.ts`,
  `...-trigger.test.ts`, `...-quality.test.ts`, then `pnpm test`, `pnpm exec tsc --noEmit`,
  `./freebuff-verify.sh`.
- **Target**: trusted-base GitHub Actions workflow; PR-head code is never executed.

## Design Decisions

1. **Single root file**: `GEMINI_REVIEWER.md` is the only standing instruction source. The retired
   `.gemini/rules/luckypickcanada.md` is deleted because no other supported integration reads it
   (verified by repository-wide search; the workflow was the only other consumer and is updated).
   No compatibility shim is added, so no second competing copy of the rules can exist.
2. **Trusted-file integrity preserved**: the workflow check becomes
   `git diff --exit-code -- GEMINI_REVIEWER.md .github/workflows .github/scripts`, keeping the same
   protection against a PR modifying trusted reviewer inputs.
3. **Consolidation, not duplication**: the new file carries the A/B/C structure plus the rules the
   implementation relies on — status-colour meanings, 0.80 confidence threshold, severity rubric,
   evidence/claim verification, coverage disclosure, adversarial pass, fix controls, and the
   no-edit/no-commit/no-merge boundary. Verbose per-document and per-snapshot instructions are
   dropped because they described removed behaviour.
4. **Context reduction**: remove `loadDocumentManifest`, `walkDocs`, `loadGeminiApiDevSkill`,
   `isGeminiApiDevSkillRelevant`, `classifyReviewGroups`, `patchPreview`, `fallbackGroups`,
   `isJulesSpecificDoc`, `geminiManifestGroups`, `isGeminiCliDoc`, `isGeminiApiOverviewDoc`,
   `isGeminiReferenceDoc`, `isGeminiReferenceRelevant`, `geminiReferenceReason`,
   `selectRelevantGeminiReferenceDocs`, `fallbackAdditionalDocs`, `describeTaskGroupReason`,
   `chooseDocs`, `loadDocs`, and `docReport`, plus their call sites, prompt fields, schema property,
   summary line and coverage gaps. `GEMINI_API_DEV_SKILL_PATH` is removed.
5. **Fix path**: `applyAutoFix` and `confirmFindings` lose `docs`, `docPaths` and `documentReport`
   parameters and prompt lines; verification and suggestion generation work from patches only.
6. **Preserved**: `collectSourceContext`, `clipSourceWithAnchors`, coverage accounting and
   disclosure, batching and patch truncation, adversarial pass, `REVIEW_RESPONSE_SCHEMA` and
   `validateReviewPayload`, JSON recovery ladder, retry/fallback model chain, formatting and
   statuses, finding selection, suggestion eligibility, permissions, and trusted-base execution.
7. **Tests**: reviewer tests assert the new rule path, the removal of document selection/loading,
   the absence of the old rules path, and preserved source-context capability.

## Project Structure

- `GEMINI_REVIEWER.md` (new)
- `.gemini/rules/luckypickcanada.md` (removed)
- `.github/scripts/gemini-reviewer.cjs`
- `.github/scripts/gemini-autofix.cjs`
- `.github/workflows/gemini-reviewer.yml`
- `__tests__/gemini-reviewer-context.test.ts`, `...-workflow.test.ts`, `...-trigger.test.ts`
- `.specify/features/gemini-review-context/{spec,plan,tasks}.md`, `.specify/feature.json`
- `PR_SUMMARY.md`, `memory-bank/activeContext.md`

## Verification Plan

- `node --check` both scripts, then focused reviewer Vitest files, full `pnpm test`,
  `pnpm exec tsc --noEmit`, and `./freebuff-verify.sh` (which includes the production build).
- Measure the production build size against the 495 MB hard maximum.
- Search the scripts for any remaining `.docs/` loading, manifest, or document-assessment reference.
- Inspect the complete final diff. Do not claim a live-model review; no API key is available here.
