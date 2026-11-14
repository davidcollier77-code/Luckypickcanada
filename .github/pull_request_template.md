## Purpose

Describe the problem, the intended outcome, and the user-visible or repository-facing change.

## Scope and affected areas

List the specific features/components, shared dependencies, configuration, tests, assets, and documentation this PR is intended to change. The manifest below is an exact file-level declaration; do not use directory-wide wildcard patterns.

## QA Scope Declaration

Keep the markers and JSON structure. List every intended changed path exactly. If the diff adds an unlisted file, the scope checker will block until the scope is explicitly expanded and the repository owner approves the exact expansion digest in a PR comment.

<!-- qa-scope:start -->
{
  "version": 1,
  "summary": "",
  "features": [],
  "paths": [],
  "shared_dependencies": [],
  "visual_baseline_updates": [],
  "scope_expansion": [],
  "governance_changes": [],
  "browser_evidence": []
}
<!-- qa-scope:end -->

### Explicit approval commands

Only the repository owner can authorize an expansion by posting the exact command emitted by the check:

- Scope expansion: /approve-scope <digest>
- Visual baseline update: /approve-visual-baselines <digest>
- Governance change: /approve-governance <digest>

The approval digest is bound to the declared paths and reasons. Editing the PR description is not approval. Protected-file and Agent MD authorization checks remain separate and mandatory.

### Browser evidence

For visual changes, record the browser tool that actually ran and link its run, trace, or artifact. Supported tools are Playwright, Firecrawl, and Browserless. Do not relabel one tool's evidence as another. A pending CI run is not a completed verification result.

### Visual baseline changes

List only the screenshot files intentionally changed under visual_baseline_updates. Every baseline change needs an owner approval comment. The update must be limited to the affected feature and viewport; preserve unrelated baselines and keep the old image available in the PR diff/history.

### Governance changes

If governance files are intentionally changed, list each exact file and a reason under governance_changes. The separate protected-file / Agent MD authorization workflow still has to pass.

## Verification

Record checks actually run, their results, and any skipped or blocked checks. Distinguish application/test failures, scanner findings, flaky results, and infrastructure failures. Do not report pending PR-triggered checks as passed.

## Out of scope

List adjacent features or files that must remain unchanged.
