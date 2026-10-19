# Research: Gemini PR-Agent Workflow Repair

## Findings

### Workflow structure

- **Verified**: The merged workflow placed mapping entries immediately below the `uses:` scalar without a step-level `env:` key. That is malformed GitHub Actions step configuration and prevents the action options from being passed as intended.
- **Verified**: The file on `main` selected `gemini/gemini-2.0-flash`, inconsistent with the feature's stated Gemini 3.8 Flash requirement.
- **Verified**: A job condition on `github.event.sender.type != 'Bot'` could skip the event when a repository automation creates or updates the PR.
- **Verified**: GitHub's trigger list and PR-Agent's internal `github_action_config.pr_actions` list must remain consistent for the desired event types.

### Provider configuration

- **Decision**: Keep the existing immutable PR-Agent action reference: `the-pr-agent/pr-agent@fbf7f6d3fcff6d9bf15aef7d8f4a6c2cacc7ad1f`.
- **Decision**: Pass the secret through `GOOGLE_AI_STUDIO.GEMINI_API_KEY` in the action step's `env` and set `config.model` to `gemini/gemini-3.8-flash`.
- **Reference**: PR-Agent installation/configuration documentation: https://docs.pr-agent.ai/installation/github/
- **Reference**: Google Gemini API model documentation: https://ai.google.dev/gemini-api/docs/models
- **Secret safety**: The workflow checks only whether the secret is empty. It must not print or interpolate the value into output. The available GitHub interface does not expose the configured secret values, so the existence and validity of the secret are not verified from repository files.

### Scope and verification limits

- **Decision**: Do not change CodeRabbit, Amazon Q, Robin-retirement files, application runtime code, dependencies, or deployment configuration.
- **Verified limitation**: A local checkout attempt was blocked because the execution environment could not resolve `github.com`; no local test, build, TypeScript check, or Spec Kit verifier run is claimed.
- **Required live evidence**: After the workflow reaches `main`, a new eligible PR event must produce a successful PR-Agent run and a visible Gemini review. A static configuration test alone does not establish provider connectivity.

## Alternatives considered

- **Keep Gemini 2.0 Flash**: Rejected because it fails the feature's intended model requirement.
- **Use a moving action tag**: Rejected to preserve the already chosen immutable action pin.
- **Allow automatic PR descriptions/improvements**: Rejected; scope remains review-only.
- **Skip bot-originated PRs**: Rejected because it can exclude Jules-created PRs.
