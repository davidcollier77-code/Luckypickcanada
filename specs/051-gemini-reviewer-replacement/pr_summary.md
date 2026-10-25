# PR Summary — Gemini Reviewer and Opt-In Auto-Fix

## Task and scope
- Task group: creation — introduce a distinct GitHub Actions review workflow and supporting rule file.
- Original request: provide automatic Gemini code review, practical suggested fixes, and a separate opt-in auto-fix action with a Gemini fallback model.
- Rules: .gemini/rules/luckypickcanada.md is separate from and does not modify .amazonq/rules/luckypickcanada.md.
- Models: Gemini 3.8 Flash primary; Gemini 3.6 Flash fallback. The existing secret name GEMINI_API_KEY is reused; secret presence/value cannot be inspected from this API-connected session.

## Document-library behavior
- The workflow consults .docs/manifest.json and asks Gemini to select relevant snapshots from any group or groups, with no one-group restriction.
- Only documents actually loaded into the review prompt are reported as consulted. The summary distinguishes documents that materially helped from those that did not.
- .docs/ remains read-only.

## Safety and behavior
- Automatic review runs use the trusted base-branch workflow/scripts and retrieve PR diffs through the GitHub API.
- Ordinary reviews only comment; they do not change code, approve, request changes, or merge.
- Auto-fix requires the explicit /gemini-fix command from a trusted collaborator or a manual workflow_dispatch selection of fix. Fork-owned PR branches and protected reviewer/governance files are rejected.
- Auto-fix checks the generated patch and whitespace, commits only eligible changed files, and leaves the PR open. It does not execute PR-head code or project scripts.

## Verification
- API-authored branch; local shell access is unavailable in this session.
- pnpm test: NOT RUN locally.
- ./jules-verify.sh: NOT RUN locally.
- Live Gemini API and Actions secret: NOT tested/inspectable in this session.
- Current-head CI and final workflow test results: PENDING.
- Owner must merge before this workflow can run from the default branch and prove live operation.

## Used material
- AGENTS.md and .jules/jules.md: consulted for repository governance and safety boundaries.
- .jules/creation.md, .docs/manifest.json, routed creation snapshots, and Spec Kit definitions: consulted for repository workflow/documentation context.
- Official Gemini model/pricing and GitHub workflow/review documentation were checked.
