# Quickstart: Automatic Cloudflare Observability Issue Resolution

## Operator setup (one time)

The site Worker holds two Wrangler-managed secrets. Their values are never committed; Wrangler prompts for each value.

```bash
pnpm exec wrangler secret put CLOUDFLARE_API_TOKEN --config ./wrangler.jsonc
pnpm exec wrangler secret put CLOUDFLARE_ISSUE_RESOLVE_TOKEN --config ./wrangler.jsonc
```

- `CLOUDFLARE_API_TOKEN` — the existing Cloudflare API token. It needs `Workers Observability: Edit` so it can modify issue status.
- `CLOUDFLARE_ISSUE_RESOLVE_TOKEN` — a new random caller credential. The resolution route compares it with the `Authorization: Bearer` value before contacting Cloudflare; it is never sent to Cloudflare.

The repository also needs the caller credential as the Actions secret `CLOUDFLARE_ISSUE_RESOLVE_TOKEN` (Settings → Secrets → Actions) so the post-deploy job can authenticate. `CLOUDFLARE_API_TOKEN` already exists there for deployment.

`CLOUDFLARE_ACCOUNT_ID` is optional. When unset, the site Worker uses the Lucky Pick Canada account already recorded in `scripts/cloudflare/workers-issues-to-github-setup.sh`.

## Resolving an issue after a fix

Name the Cloudflare issue in the fix's commit message or pull request body:

```text
Cloudflare-Issue: a94d47c2-d9e8-468d-ae61-c966c9ab7199
```

Then ship the fix through the normal flow. Once `Deploy OpenNext to Cloudflare` has built, verified and deployed it, the `Resolve Cloudflare observability issues` job:

1. reads the deployed commits and the bodies of the pull requests they came from;
2. asks `POST https://luckypickcanada.ca/api/cloudflare-issues/resolve` to resolve the referenced issues;
3. succeeds only when Cloudflare reports `status: resolved` for every one of them;
4. otherwise fails the run, records "remains unresolved" in the run summary and leaves the issue untouched.

Deployments that name no issue resolve nothing and are not failures.

## Verifying locally

```bash
pnpm exec vitest run __tests__/cloudflare-observability-issues.test.ts
node --test .github/scripts/test-cloudflare-issue-references.node-test.mjs
pnpm tsc --noEmit
./freebuff-verify.sh
```

The route tests use a stubbed transport. A real Cloudflare status change requires the deployed Worker and the two Worker secrets, so live confirmation is verified by the post-deploy job, not locally.

## What must not change

The Workers Observability scanner, the `Workers Issues to GitHub` generic webhook, GitHub issue creation, `ISSUE_DEDUPE` duplicate protection, the `workers_observability_real_time_issue` notification policy, the issue automation and every scheduled workflow stay exactly as they are. This feature only adds a resolution path.
