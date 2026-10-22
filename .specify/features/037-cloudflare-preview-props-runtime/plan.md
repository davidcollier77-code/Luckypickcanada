# Implementation Plan — Cloudflare preview manifest runtime repair

## Selected Task Group
`troubleshooting` — repair a confirmed production runtime failure.

## Verified Evidence
- Cloudflare logs for GET `/crystal-ball` show `Unexpected loadManifest(/.next/server/preview-props.json) call!` from `NextNodeServer.getPreviewProps` during server initialization.
- The currently configured adapter is `@opennextjs/cloudflare@1.20.6`; Next.js is `16.4.1`.
- Upstream OpenNext PR #1356 fixes manifest inlining for Next.js 16.4+, and that fix is included in the 1.20.12+ release line.
- Adapter 1.20.13 requires a compatible Wrangler peer at `^4.148.0`; therefore update the pinned Wrangler version together with the adapter.

## Approach
1. Upgrade the pinned adapter and Wrangler versions to a mutually compatible, fixed release set.
2. Regenerate `pnpm-lock.yaml` using pnpm 10.30.3; do not hand-edit dependency resolutions.
3. Run the repository OpenNext validation/build and inspect all available current-head CI results.
4. Review the diff for unrelated changes and record the exact verification status in the PR.

## Constraints
- No direct production deployment, no merge, and no secret or environment-variable changes.
- Preserve website visuals, wording, routes, and application behavior.
- Enforce the 495 MiB `.next + public` hard maximum.
- A successful build alone is not proof of live runtime recovery; production remains unverified until the fix is deployed by the owner and the homepage plus `/crystal-ball` are checked.
