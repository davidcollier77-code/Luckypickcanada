# CodeRabbit CLI — Automatic PR Review Layer

LuckyPickCanada's CodeRabbit CLI layer is designed to add an independent review to the existing CodeRabbit GitHub App, PR Agent, DevSkim, CodeQL, tests, and other checks. It does not replace those systems and does not edit or merge code.

## Automatic GitHub Actions review

The dedicated workflow `.github/workflows/coderabbit-cli-review.yml` reviews pull requests targeting `main` when a PR is opened, reopened, updated with new commits, or marked ready for review. It publishes or updates one CodeRabbit CLI review comment on the pull request, rather than adding a new comment for every commit.

The workflow copies `.coderabbit-cli-instructions.md` from the PR's **base commit**, so a proposed change cannot rewrite the review instructions used to review itself. It checks for the API-key secret before checking out the PR head. If the secret is missing or unavailable (including for fork PRs), the workflow skips the review with a warning and a job-summary explanation. The initial setup PR also skips itself if its base revision does not yet contain the new instructions file; this bootstrap guard avoids trusting instructions supplied only by the PR being reviewed.

### One-time setup (phone browser is sufficient)

**Important:** Follow these steps only after pull request #1591 has been merged into `main`. Do not add this API key to GitHub Secrets while the workflow change is still under review.

**The CLI needs its own CodeRabbit Agentic API key.** The existing CodeRabbit GitHub App installation does not automatically authenticate the CLI. CodeRabbit's official headless setup says the key must belong to an organization where the user has an assigned seat. Access and included review allowance depend on the CodeRabbit account and plan; this workflow does not promise that CLI reviews are available for free.

1. Sign in to CodeRabbit and create an Agentic API key on the [CodeRabbit API Keys page](https://app.coderabbit.ai/settings/api-keys). Follow CodeRabbit's [headless CLI setup guide](https://docs.coderabbit.ai/cli/headless-cli-integration).
2. Open [LuckyPickCanada's GitHub Actions secrets](https://github.com/davidcollier77-code/Luckypickcanada/settings/secrets/actions) in your browser. Choose **New repository secret**.
3. Set the **Name** to `CODERABBIT_API_KEY` and the **Secret** to the Agentic API key, then save it.

Keep the key in GitHub Secrets. Do not paste it into a chat, issue, pull request, workflow file, or commit. The repository connection cannot create or read this secret on your behalf.

### Cost and safety controls

- The workflow installs the pinned CLI release `0.9.0` and disables automatic CLI self-updates for reproducibility. It deliberately does **not** pass CodeRabbit CLI's `--use-credits` option. It does not opt into paid over-limit review credits. If the account has no eligible allowance or the key lacks access, the comment is marked incomplete rather than showing a false clean result.
- The workflow does not auto-fix, push commits, approve, or merge pull requests.
- The workflow uses read-only repository contents permission and only the permissions needed to publish/update its PR comment.
- The API key is checked before PR code is checked out. GitHub does not expose repository secrets to fork-originated `pull_request` runs, so those reviews are skipped safely.
- The new workflow is separate from the existing CodeRabbit GitHub App configuration. It does not change scanner workflows or add `.coderabbit.yaml`, `.coderabbit.yml`, or `.coderabbit.config.ts`.
- Because GitHub loads a new `pull_request` workflow from the base branch, this workflow becomes active for PR events after this change is merged into `main`. The first live run still requires a valid secret and eligible CodeRabbit CLI access.

## Optional local CLI review

The local wrapper remains available to anyone using a computer with the repository checked out. It is not needed for the automatic GitHub Actions path.

Official installation details are maintained at <https://docs.coderabbit.ai/cli>. For macOS/Linux, CodeRabbit currently documents:

```bash
curl -fsSL https://cli.coderabbit.ai/install.sh | sh
```

For Windows PowerShell:

```powershell
irm https://cli.coderabbit.ai/install.ps1 | iex
```

Then sign in and inspect readiness and quota:

```bash
cr auth login
cr auth status
cr doctor
cr usage
```

Review uncommitted tracked changes plus untracked files:

```bash
bash scripts/coderabbit-cli-review.sh --uncommitted --include-untracked
```

Review the current branch against `main`:

```bash
bash scripts/coderabbit-cli-review.sh --base main
```

Produce structured findings for an AI coding assistant (without authorizing it to edit files):

```bash
bash scripts/coderabbit-cli-review.sh --agent --uncommitted --include-untracked
```

The wrapper explicitly supplies `.coderabbit-cli-instructions.md`. The current CLI reference documents `--config` as an additional-instructions option and includes Markdown instruction-file examples: <https://docs.coderabbit.ai/cli/reference>.

## Review expectations

Review findings are advisory. Check each reported issue against the diff and supporting code. Continue running the normal test suite, security scanners, and human review. An empty finding list is not proof that a change is defect-free.

## Verification status

The workflow and supporting regression test are proposed in the current pull request. Full repository CI and the first authenticated live CLI review have not yet been verified. The workflow must be merged to `main` and configured with `CODERABBIT_API_KEY` before it can review later PRs. The first setup PR is expected to skip because the instructions file is not yet present on its base branch.
