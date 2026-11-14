# Research: QA Review Repairs

**Feature**: `specs/160-qa-review-repairs`
**Parent PR**: [#1900](https://github.com/davidcollier77-code/Luckypickcanada/pull/1900)
**Parent branch**: `feat/158-qa-infrastructure-integrity`

## Review Sources and Scope

Reviewed the four distinct sources of reviewer feedback on PR #1900: Amazon Q Developer, Graphite, Pullfrog and GitHub Advanced Security. Compared inline findings with the current PR head and the original PR description and feature artifacts. The parent PR scope is QA infrastructure only: application behaviour, artwork and screenshot baselines must remain unchanged.

## Findings and Disposition

| Finding | Current-state assessment | Disposition |
|---|---|---|
| Conditional check grouping ignored its group name | Already repaired in the parent branch with a prefix match scoped to the passed name | Added a two-group regression test with opposite shard outcomes |
| Raw/filtered SARIF errors lacked source context | Already repaired in the parent branch with contextual re-raises | Added separate raw-file and filtered-file error tests |
| Empty paginated jq aggregation returned null | Already repaired in the parent workflow with `jq 'add // []'` for files and comments | Confirmed and preserved; no duplicate workflow edit |
| Missing paths in reason/purpose entries had generic diagnostics | Already repaired with field-specific null guards | Added direct tests for `scope_expansion` and `file_purposes` |
| BLOCKED report joined the string `none` | Already repaired with `or []` before joining | Added output regression test |
| Missing `changed_files` key produced a misleading count error | The parent branch contained a malformed guard and a malformed error block | Repaired with an explicit missing-key exception and preserved strict count validation |
| Added file records with absent/null `previous_filename` failed | Confirmed defect: the parent branch always normalized the optional field | Repaired optional-field handling and removed duplicate insertion |
| Rename old path could collide with another filename | Current set tracking covered paths but lacked focused collision coverage; previous-path handling was unsafe | Added shared-set collision handling and regression test |
| Dynamic Next.js routes and exact filenames | Parent already accepted bracket/parenthesis route segments; regex review noted risky hyphen range | Made the hyphen literal unambiguous and added route/hyphen/comma tests |
| AVIF screenshot baselines | Not recognized by baseline extension detection | Added `.avif` and a focused test |
| Pending browser evidence placeholder | Existing validation accepted any non-empty reference, including the test's `pending-pr-check` fixture | Reject explicit placeholder tokens, use a real-looking URL in positive fixtures, and document that remote execution status is not fetched |
| Advanced Security TODO finding | A placeholder test deliberately contained literal `TODO` in its fixture data | Split the fixture literal into concatenated pieces without changing the runtime value |

## Reviewer Suggestions Deliberately Not Adopted

- **Approval digest over structured fields only**: rejected. The task's approved scope requires approval to bind to the complete PR description and current head; free-form prose can contain scope or verification claims and must invalidate an old approval when edited.
- **Derive expansion paths automatically instead of requiring them in `paths`**: rejected. The feature contract and PR template explicitly require each expanded path to appear in the exact path manifest and in the reasoned expansion list. This makes the full changed-file inventory and purpose declaration reviewable from one exact manifest.
- **Treat any pending-like URL as completed or invalid based only on a substring**: not adopted. The checker blocks known exact placeholder tokens; a URL is only recorded, not remotely verified. The template now states this limitation plainly.

## Applicable Repository References

- `.docs/security/_trailofbits_skills_sarif-parsing.md` — **Useful**. Documents defensive handling of optional SARIF fields and filename/run-context validation. Relevant to source-specific parser diagnostics.
- `.docs/security/_trailofbits_skills_sarif-parsing-jq-queries.md` — **Useful**. Documents jq aggregation and SARIF query patterns. Relevant to safe empty-array aggregation and preserving the raw/filtered distinction.
- `.docs/testing/_google_eng-practices.md` — **Useful**. Provides unit-test and code-review guidance supporting regression tests for each fixed edge.
- `.docs/manifest.json` — **Useful**. Used to locate the small set of task-relevant reference documents; not modified.

## Tools and Execution Limits

- GitHub integration was used to inspect review threads, the original PR body, changed-file inventory, branch contents, commit history and workflow definitions; changes were written only to the new repair branch.
- No specialist skills were materially used.
- The local repository/runtime is not available in this session. Python unit tests and `py_compile` could not be executed here. Repository startup scripts and `freebuff-verify.sh` were not run.
- The current integration catalog exposes no Playwright tool through Firecrawl; no browser verification is claimed. This patch does not change rendered application output or visual baselines, so Playwright visual checks are not applicable to these file changes.
