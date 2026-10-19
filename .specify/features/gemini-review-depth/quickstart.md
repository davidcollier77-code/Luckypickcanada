# Quickstart: Gemini Review Depth

## Inspect the configuration

1. Review `.github/workflows/pr-agent.yml` for `pr_reviewer.num_max_findings`, `pr_reviewer.inline_key_issues`, risk/merge/failure-mode options, and the multi-area `extra_instructions`.
2. Review `__tests__/pr-agent-workflow.test.js` for assertions covering those options and review standards.
3. Check the exact PR head's status checks and `./jules-verify.sh` result before merging.
4. Once the configuration reaches `main`, let one naturally occurring supported PR event trigger a Gemini review. Check that inline comments and the summary use the new prompt. Do not trigger repeated reviews just to increase activity.

## Acceptance

The configuration and static tests must pass first. Fully operational behavior remains unverified until a live post-merge event posts the expected review. Do not treat a green static test as proof of provider connectivity or output quality.
