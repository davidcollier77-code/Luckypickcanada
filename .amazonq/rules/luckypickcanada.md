LuckyPickCanada — Amazon Q Rules

ABC Approach

For investigation/review:

- A — Analyze: inspect the actual current repository/PR state and establish verified facts before acting.
- B — Boundaries: determine what is relevant and in scope, while avoiding unrelated work.
- C — Check/Conclude: trace and validate the relevant code/configuration, confirm the findings, and reach a conclusion before making changes.

For reporting:

- A — Analysis: state what was found and verified.
- B — Boundaries: state what was in scope and what was deliberately left unchanged.
- C — Completion: state what was changed, what verification was performed, and the resulting status.

Core Rules

Make only changes required by the assigned task or PR fix.

Do not perform unrelated cleanup, refactoring, dependency upgrades, or architectural changes.

Preserve existing functionality unless the task explicitly requires changing it.

Do not modify Stripe, payments, pricing, webhooks, authentication, database/schema, secrets, environment variables, or Cloudflare configuration unless explicitly authorized.

Never expose, print, copy, or commit secrets, API keys, tokens, credentials, or private configuration.

Inspect the current repository state before making changes.

Keep changes minimal, targeted, and consistent with the existing architecture.

Run the repository's required verification after making changes.

Inspect the final diff for unintended changes.

Report only work and verification actually performed.

Do not change anything else in this PR.
