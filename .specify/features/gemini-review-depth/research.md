# Research: Gemini Review Depth

## Verified configuration findings

- The existing workflow uses the pinned `the-pr-agent/pr-agent` GitHub Action and places its settings in the action step's `env` block.
- The existing primary model is `gemini/gemini-3.8-flash`; fallbacks are `gemini/gemini-3.6-flash` and `gemini/gemini-3.5-flash-lite`. These values are preserved.
- PR-Agent's current configuration reference documents `pr_reviewer.num_max_findings` with a default of 3, `pr_reviewer.extra_instructions`, and `pr_reviewer.inline_key_issues` (default false).
- PR-Agent's current documentation includes `pr_reviewer.require_risk_assessment`, `pr_reviewer.require_merge_recommendation`, and `pr_reviewer.require_failure_modes`.
- PR-Agent's official GitHub installation documentation demonstrates supplying `pr_reviewer.extra_instructions` through the action step's environment mapping.
- The repository already uses Vitest and has a targeted static test for its Gemini workflow.

## Sources consulted

- PR-Agent configuration reference: https://docs.pr-agent.ai/usage-guide/configuration_reference/
- PR-Agent GitHub Action installation/configuration: https://docs.pr-agent.ai/installation/github/
- Repository-routed GitHub Actions documentation snapshot: `.docs/troubleshooting/_github_docs.md`
- Repository-routed Gemini documentation snapshot: `.docs/troubleshooting/_websites_ai_google_dev_gemini-api.md`
- Repository-routed agent references and documentation inventory: `.docs/manifest.json`

## Constraints and unknowns

- More detailed instructions and the higher finding ceiling may increase review output tokens, although this does not add another review workflow or deliberate extra model call.
- Inline publication depends on provider support and the model's ability to anchor a finding to the diff.
- SEO, visual, and accessibility review must remain conditional on the change being relevant; actual rendered visual verification requires screenshots or browser evidence.
- Current-head automated test/governance/build results and review quality under the new prompt are UNKNOWN until the relevant CI and live review evidence exists.
- A prior live run of the current Gemini workflow encountered transient HTTP 503 service-unavailable responses. The existing fallbacks are retained; future provider availability is not guaranteed.
