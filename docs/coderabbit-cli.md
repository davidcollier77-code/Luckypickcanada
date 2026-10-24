# CodeRabbit CLI — Local Review Layer

CodeRabbit CLI is an **optional, local, on-demand second opinion** for
LuckyPickCanada. It complements the existing CodeRabbit GitHub App, DevSkim,
CodeQL, tests, and other checks. It does not replace them.

## Why this setup is separate

- Local CLI instructions live in `.coderabbit-cli-instructions.md`.
- Run reviews through `bash scripts/coderabbit-cli-review.sh`; the wrapper
  passes that instruction file explicitly using CodeRabbit CLI's `--config`
  option.
- We deliberately do **not** add `.coderabbit.yaml`, `.coderabbit.yml`, or
  `.coderabbit.config.ts`. Those conventional repository configuration files
  can also affect the GitHub App integration.
- The rules are an independent review aid, not repository governance. Jules
  and any agent required to follow repository governance must continue to read
  `AGENTS.md` as required. This setup does not edit that file.
- No dependency, GitHub workflow, scanner, deployment, secret, or application
  runtime change is needed.

## Install and sign in (on your own computer)

Install the CodeRabbit CLI using the current official instructions:
<https://docs.coderabbit.ai/cli>

For macOS/Linux, the documented installer is:

```bash
curl -fsSL https://cli.coderabbit.ai/install.sh | sh
```

For Windows PowerShell, the documented installer is:

```powershell
irm https://cli.coderabbit.ai/install.ps1 | iex
```

Then, from a terminal, sign in and check readiness:

```bash
cr auth login
cr auth status
cr doctor
cr usage
```

Sign-in is interactive and must be completed by you on the computer where
you will run reviews. `cr usage` shows the included-review availability and
current usage for the account/plan; use it rather than assuming a fixed free
review quota.

## Common review commands

From the repository root, inspect staged/unstaged tracked changes and untracked
(non-ignored) files before committing:

```bash
bash scripts/coderabbit-cli-review.sh --uncommitted --include-untracked
```

Review the current branch against `main` using the deeper PR-style policy
(requires CLI 0.8.0 or later and a compatible CodeRabbit service):

```bash
bash scripts/coderabbit-cli-review.sh --base main --deep
```

Produce structured findings for an AI coding assistant to interpret (this
outputs findings; it does not authorize the CLI to edit code):

```bash
bash scripts/coderabbit-cli-review.sh --agent --uncommitted --include-untracked
```

You can pass other supported `cr review` flags through the wrapper. For the
complete current options, run `cr review --help` or consult the official
<https://docs.coderabbit.ai/cli/reference>.

## Safe operating practice

1. Review important, complex, or security-sensitive changes before the PR is
   opened. This is optional; it does not need to run on every change.
2. Evaluate each finding against the actual code and diff. Do not apply a fix
   solely because an AI reviewer suggested it.
3. Continue using normal tests, CI checks, security scan, and human review. A
   clean CLI result is not proof that the code is defect-free.
4. Keep authentication local. Do not commit API keys, tokens, or CLI state.
5. Do not run a deep review just to chase a quota; prioritize high-risk changes.

## Verification status

The repository configuration and wrapper are introduced through this pull
request. The CLI cannot be installed or authenticated through the GitHub
repository connection. After merging, install/sign in on the local development
computer, run `cr doctor` and `cr usage`, then run the review command above
to verify the first live review.
