LuckyPickCanada — Amazon Q Rules

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
