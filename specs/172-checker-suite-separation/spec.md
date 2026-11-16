# Feature 172 — Checker suite separation

## Goal

Give the checking system independent responsibilities instead of growing one
general reviewer. This PR delivers the remaining roadmap (P1–P5) of
`specs/171-qa-checker-effectiveness/plan.md`; the general code-defect reviewer
stays in PR #1925 and is not extended here.

## Responsibilities and owners

| Responsibility | Owner | Trigger | Report |
| --- | --- | --- | --- |
| General code defects | `review_pr_changes.py` (PR #1925) | every pull request | sticky comment |
| Test quality | `checker_suite.py test-quality` | every pull request, changed test files only | sticky comment `<!-- qa-test-quality -->` |
| Performance (resource work) | `checker_suite.py performance` | every pull request, changed code files only | sticky comment `<!-- qa-performance -->` |
| Security alerts | `checker_suite.py security-summary` + existing DevSkim/CodeQL scan | every pull request | sticky comment `<!-- qa-security-summary -->` |
| Visual / browser QA | `visual-qa.yml` (unchanged) + `checker_suite.py browser-summary` | visual change sets | sticky comment `<!-- qa-browser-summary -->` |
| Scope, governance, protected files | existing `check_qa_pr_scope.py`, `protected-files.yml` | unchanged | unchanged |

## Reporting contract

- One comment per responsibility, identified by a marker on its first line.
- Re-runs update that comment; they never add another one.
- Every finding states what happened, where (`path:line`), the evidence and a
  suggested fix.
- `FAIL` marks something a developer must fix; `WARN` marks advisory findings;
  a skipped browser shard is reported as **NOT RUN**, never as a pass.
- The body is capped at 60,000 bytes and truncates only between whole findings.
  An unmarked or oversized body is refused by the publisher, not truncated.

## Safety and cost

- No pull request code is checked out or executed: every job checks out `main`.
- Visual QA keeps its `pull_request` trigger without write access; its summary
  runs afterwards from `workflow_run` on the default branch.
- Permissions are the minimum needed: `contents: read`, `pull-requests: write`,
  `issues: read`, and `security-events: read` for the alerts job.
- No new dependency, service, metered API, paid reviewer or credit card. No
  required check is weakened; the new checks are advisory.

## Acceptance criteria

1. Each mode renders a marker-first comment whose findings all carry a suggested
   fix, with block-safe truncation (SC-1).
2. Controlled fixtures prove each rule fires on the defect and stays silent on a
   harmless counterpart (SC-2).
3. A browser shard that is skipped or cancelled is reported as NOT RUN (SC-3).
4. The hygiene test proves trusted triggers, no PR-head checkout, unique
   markers, update-in-place and the refuse-don't-truncate publisher (SC-4).
5. `./freebuff-verify.sh`, the unit suite, the type check and the build-size cap
   pass (SC-5).

## Out of scope

- A measured runtime performance budget. Correct thresholds need a browser
  baseline that this environment cannot produce, and inventing them would risk
  failing `main`. The static resource-leak rules ship here; the measured budget
  remains a documented follow-up.
- Changes to external reviewer configuration or integrations.
