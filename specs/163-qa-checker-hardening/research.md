# Research: QA Checker Hardening

## Inspected QA Surface

- `.github/scripts/check_qa_pr_scope.py` and `test_check_qa_pr_scope.py`
- `.github/scripts/verify_pr_verification_status.py` and its tests
- `.github/scripts/agents_md_protection.py` and its tests
- `.github/scripts/summarize_devskim_findings.py` and the DevSkim workflow
- `.github/scripts/classify-visual-changes.sh` and `__tests__/visual-qa-chromium-cache.test.js`
- `.github/workflows/visual-qa.yml`, `pr-scope-verification.yml`, `verification-integrity.yml`, `devskim.yml`
- `.github/pull_request_template.md`
- `freebuff-verify.sh` and `__tests__/freebuff-verify.test.js`
- Crystal Ball unit tests and `tests/visual/crystal-ball*.spec.ts`

## Reproduced Root Cause

At base commit `3d26f05d`, `changed_paths()` unconditionally evaluates:

```python
previous_filename = record["previous_filename"]
```

GitHub omits that field for ordinary modified and added records. The scope checker's own test helper creates exactly those records, so 24 of 65 QA checker tests error with `KeyError: 'previous_filename'`. The same crash would occur in PR Scope Verification because all 27 files in PR #1904 are additions or modifications with no renames.

The defect was introduced with the checker in commit `2e7cd054` (#1900), not by PR #1904. The feature branch does not change `.github/scripts` or workflows.

## Coverage Review

### Existing security coverage

- DevSkim scans every PR and main; raw and filtered SARIF are preserved, suppression is replayed, and findings are uploaded to Code Security.
- CodeQL analyzes JavaScript/TypeScript, Python, and Actions.
- The repository has CSP, header hardening, protected-file workflows, and Agent MD governance.
- Adding a generic injection scanner would duplicate DevSkim/CodeQL and create false positives.

### Existing code-quality and reliability coverage

- TypeScript checks syntax and referenced types.
- Vitest covers component/unit behavior, including Crystal Ball daily usage, fallbacks, greetings, and follow-up.
- Playwright covers browser interactions, layout, and Crystal Ball flows.
- OpenNext build validation covers production build compatibility and bundle output.
- No ESLint configuration currently exists, so adding a broad lint gate would require new configuration and dependencies. This task does not add one.

### Freebuff verification duplication

`visual-qa.yml` invokes `./freebuff-verify.sh` after the full unit suite. That script runs Spec Kit governance tests, a TypeScript check, a production build, and documentation tests. The QA workflow already runs unit tests, and OpenNext validation runs the production build. Making Visual QA depend on `freebuff-verify.sh` duplicates Freebuff's own Agent MD responsibility and creates a second failure surface. The plan removes that dependency, keeps a standalone TypeScript check, and leaves the script itself intact.

### Crystal Ball AI health

Existing coverage includes daily usage/allowance, fallback history, fortunes, greetings, local time/calendar, client follow-up, preview, Oracle route validation, daily limit, greeting, interactions, and follow-up outage browser specs. These use mocks or controlled routes rather than live AI requests. No new live-service call is needed.

## Design Decisions and False-Positive Controls

1. **Hard failures only for high-confidence evidence.** Private key headers, known provider token formats, and merge markers are unambiguous. Generic `password = ...` assignments are advisory because tests, examples, and configuration patterns vary.
2. **Scan added lines only.** This keeps findings tied to the PR's changes and avoids reporting existing accepted code.
3. **Map hunk line numbers.** Findings point to the new-file line, not the patch offset.
4. **Suppress known-safe patterns.** Environment lookups, placeholders, documentation-only snippets, and constructed test fixtures are excluded from hard failures.
5. **Deduplicate.** Repeated matches at the same path/line/rule become one finding.
6. **Separate warnings from failures.** Warnings are surfaced for manual review but do not block a PR.
7. **No duplicate generic rules.** Unsafe HTML and dynamic execution are advisory because sanitization context cannot be proven from a single line.
8. **Preserve the exact-path gate.** Unexplained scope still fails; legitimate shared/dependency/infrastructure changes remain possible through the existing declaration and owner-approval flow.

## Visual QA

The path-based classifier remains fail-closed and unchanged for workflow gating. The scope declaration adds an explicit visual-impact assessment so a logic change can declare visual relevance, and a path-classified visual change can be flagged when the author claims it is non-visual. Browser evidence remains mandatory for actual visual work, and all three approved tools remain equal.

## Environment

- Python 3 is available locally.
- pnpm dependencies are installed.
- Playwright browser execution may require the repository setup script; this task does not change browser code.
- No live AI service calls are made.
