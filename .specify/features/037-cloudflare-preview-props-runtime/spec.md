# Cloudflare preview manifest runtime repair

## Problem
Production requests to the homepage and `/crystal-ball` return Cloudflare Worker Error 1101. The captured Worker exception is `Unexpected loadManifest(/.next/server/preview-props.json) call!`, raised during Next.js server initialization.

## User Story
As a visitor, I need LuckyPickCanada pages to render normally on Cloudflare after a successful deployment, so the site does not return a Worker exception page.

## Requirements
- Use an OpenNext Cloudflare adapter release containing the upstream Next.js 16.4+ `preview-props.json` loadManifest fix.
- Keep the adapter and Wrangler peer versions compatible, and update the pnpm lockfile consistently.
- Preserve site appearance, copy, application behavior, database settings, secrets, domain routes, and unrelated dependencies unless dependency resolution requires a documented transitive change.
- Do not merge or deploy this repair from the task branch.

## Acceptance Criteria
1. The dependency graph resolves under the repository's pinned pnpm version with a frozen install.
2. Next.js and OpenNext builds pass on the proposed branch.
3. The combined `.next` and `public` output remains below the 495 MiB hard cap.
4. The PR documents the exact runtime exception, upstream fix, changed dependencies, executed checks, and any verification that remains pending.
5. The pull request stays open and unmerged pending review.
