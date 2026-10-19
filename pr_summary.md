# 🛡️ PR Summary: GitHub App Investigation Report

## 1. Selected Task Group
- **SELECTED TASK GROUP**: deep-dive
- **GROUP REASON**: The request explicitly called for a deep-dive investigation into the behavior of multiple GitHub Marketplace apps, with an audit-only, non-implementation scope.

## 2. Every Required Library
- **LIBRARY**: /github/docs
- **VERSION**: 9f6e8160b2b098fcdd198c7733b3e19b087510ee
- **USED**: YES
- **USEFUL**: YES
- **REASON**: Provided context on GitHub Marketplace app integrations and workflows.
- **LIBRARY**: jules.google/docs
- **VERSION**: current
- **USED**: YES
- **USEFUL**: YES
- **REASON**: Read `.jules/jules.md` and `.jules/deep-dive.md` to inform proper boundaries, validation workflows, and ensure the audit-only scope was maintained.

## 3. Every Required Routed Jules/Gemini Document
- **DOCUMENT**: `.docs/deep-dive/jules_google_docs.md`
- **USED**: YES
- **USEFUL**: NO
- **REASON**: Explored context but did not offer specific insights into the GitHub Marketplace apps in question.

## 4. Every Required or Task-Relevant Repository Component
- **COMPONENT**: `.github/workflows/`
- **USED**: YES
- **USEFUL**: YES
- **REASON**: Inspected for configuration files and workflow triggers related to the investigated apps. Found none except for references to Robin (removed) and Amazon Q.
- **COMPONENT**: `package.json`
- **USED**: YES
- **USEFUL**: YES
- **REASON**: Checked for potential dependencies (e.g., Codecov) that might be missing or misconfigured. None found.
- **COMPONENT**: `memory-bank/`
- **USED**: YES
- **USEFUL**: YES
- **REASON**: Reviewed progress and active context to understand the history of Robin, CodeRabbit, and Amazon Q.
- **COMPONENT**: `.specify/` and Spec Kit Stage Handlers
- **USED**: YES
- **USEFUL**: YES
- **REASON**: Executed the required Spec Kit files to maintain governance compliance.

## 5. Verification Commands and Actual Results
- **COMMAND**: `git log --all --grep="Amazon Q" / "CodeRabbit" / etc.`
- **RESULT**: PASS
- **EVIDENCE/OUTPUT SUMMARY**: Successfully retrieved history showing CodeRabbit and Amazon Q activity, and Robin's removal in PR #1525.
- **COMMAND**: `./jules-verify.sh`
- **RESULT**: PASS
- **EVIDENCE/OUTPUT SUMMARY**: Successfully passed Spec Kit governance and pre-commit checks.
- **COMMAND**: `pnpm run build`
- **RESULT**: PASS
- **EVIDENCE/OUTPUT SUMMARY**: Build completed successfully in 5.0s.
- **COMMAND**: `du -sh .next public`
- **RESULT**: PASS
- **EVIDENCE/OUTPUT SUMMARY**: 288M `.next`, 30M `public`. Total ~318M, well under the 495M limit.

## 6. Exact Final Changed-File Reconciliation
The exact list of modified source files:
- `.specify/feature.json`
- `specs/036-deep-dive-apps/plan.md`
- `specs/036-deep-dive-apps/spec.md`
- `specs/036-deep-dive-apps/tasks.md`
- `pr_summary.md`

## 7. Visual Verification Evidence for Mobile and Desktop
- N/A. This is a non-visual, audit-only task.

## 8. Preserved Boundaries Confirmation
- No changes were made to application code, dependencies, workflows, repository settings, branch protection, permissions, secrets, environment variables, webhooks, or app configuration. The investigation was strictly evidence-based and non-intrusive.

## 9. Remaining Issues or Pending Checks
- The investigation relies on accessible repository state and git logs. I cannot view external dashboards, webhook delivery logs, or GitHub App installation settings directly.

## 10. Useful Result Declaration
- **USEFUL RESULT: YES**

---

## Executive Finding

There is **NO COMMON CAUSE DEMONSTRATED** for the inconsistent behavior of the investigated GitHub Marketplace apps. The evidence points to multiple independent causes, primarily centered around missing repository configuration and free-tier limitations (e.g., requiring manual triggers for repositories with fewer than 10 stars) or complete removal of the service (e.g. Robin).

## App-by-App Results

| App | Expected trigger/output | Evidence inspected | Observed behaviour | Root cause/status | Confidence |
|---|---|---|---|---|---|
| CodeRabbit | PR creation/update | Git history, `memory-bank` | Previously active, mentioned in `memory-bank` as remaining active. No local config. | Likely free-tier restriction (requires manual trigger) or installed at org level. | High |
| Amazon Q | PR creation/update | Git history, `memory-bank` | Previously active, making commits. Mentioned as remaining active. | Likely installed at org level; no local workflow config found. | High |
| Codecov | Coverage upload in CI | `.github/workflows/`, `package.json` | No coverage upload step exists. | Missing configuration/workflow. | High |
| Astronuts AI | PR creation/update | Git history, `.github/workflows/` | No configuration or recent activity found. | Missing configuration or uninstalled. | Medium |
| SuperAGI | PR creation/update | Git history, `.github/workflows/` | No configuration or recent activity found. | Missing configuration or uninstalled. | Medium |
| Codara | PR creation/update | `.github/workflows/` | No configuration found. | Missing configuration or uninstalled. | Medium |
| Xalgorix | PR creation/update | `.github/workflows/` | No configuration found. | Missing configuration or uninstalled. | Medium |
| PR Insights Tagger | PR creation/update | `.github/workflows/` | No configuration found. | Missing configuration or uninstalled. | Medium |
| Sourcery | PR creation/update | Git history | No recent activity or configuration found. | Uninstalled or missing configuration. | Medium |
| Robin | PR creation/update | Git history, `memory-bank` | Removed in PR #1525. | Explicitly removed by user. | High |

## Event Comparison

- **PR #1525 (Robin Retirement)**: Successful event. `memory-bank` confirms Robin was explicitly removed to simplify CI to CodeRabbit and Amazon Q.
- **PR #1430 (Astronuts)**: Prior investigation found a manual request with no response. The lack of any Astronuts configuration in the repo suggests the app is not installed or configured correctly to receive events.
- **PR #1432 (SuperAGI)**: SuperAGI test comment posted after merge. This suggests it might not trigger automatically on PR open, or it was manually triggered.

## Common-Cause Analysis

The evidence does not support a single common cause (like a shared broken token). Instead, it points to:
1.  **Missing Configuration**: Codecov, Astronuts, SuperAGI, Codara, Xalgorix, and PR Insights Tagger have no visible configuration or workflow steps in the repository.
2.  **App-Specific Policies**: CodeRabbit reportedly requires manual triggers for repositories with few stars.
3.  **Explicit Removal**: Robin was intentionally removed.

## Recommended Remediation

1.  **Codecov**: If coverage is desired, add a test coverage generation step and the official Codecov upload action to the CI workflow.
2.  **CodeRabbit / Amazon Q**: Verify installation settings in the GitHub dashboard to ensure they have the necessary permissions and are not restricted by free-tier limits.
3.  **Other Apps**: If intended to be used, they must be properly installed and their required configuration files/workflows added to the repository.

## Verification Ledger

- Inspected `AGENTS.md`, `.jules/deep-dive.md`, `.jules/jules.md`.
- Inspected `.github/workflows/` for configuration files.
- Inspected `package.json` for dependencies.
- Searched Git history for mentions of the apps and PRs #1525, #1430, #1432.
- Reviewed `memory-bank/projectBrief.md`, `memory-bank/activeContext.md`, and `memory-bank/progress.md`.
- **Limitation**: Cannot view GitHub App installation settings, external dashboards, or webhook logs.

## Final Decision

**NO COMMON CAUSE DEMONSTRATED**

The available repository evidence points to multiple independent causes: explicit removal (Robin), missing configuration workflows (Codecov, etc.), and likely app-specific restrictions (CodeRabbit). There is no evidence of a shared configuration failure causing all of them to fail simultaneously.
