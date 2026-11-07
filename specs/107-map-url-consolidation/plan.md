# Implementation Plan: Consolidate duplicate map URLs onto `/map`

**Feature**: `specs/107-map-url-consolidation` · **Branch**: `feat/map-url-consolidation-20261107` · **Spec**: `specs/107-map-url-consolidation/spec.md`

## Technical Context

- **Application**: Next.js App Router 16.4.3 (`package.json` and installed `node_modules/next`), React
  19.3.1, deployed to Cloudflare Workers through OpenNext; `output: 'standalone'`, webpack builds.
- **Change surface**: `next.config.mjs` → `redirects()`, plus one Vitest regression test. Next.js
  evaluates `redirects()` from the build/routing manifest before route resolution, so the two alias
  page modules are never rendered once the paths redirect.
- **Current state**: `redirects()` already returns `/stories` → `/map` (`permanent: true`) and a
  `www.luckypickcanada.ca` host redirect to the apex. Both entries must stay byte-identical.
- **Status code**: `permanent: true` makes Next.js answer **308 Permanent Redirect**, which is what
  the existing `/stories` redirect already returns live. 308 is a permanent redirect and carries the
  same consolidation meaning as 301; matching the site's existing convention avoids mixing codes.
- **Query handling**: Next.js preserves an incoming query string when the redirect destination
  declares none, so `?utm_*` and other parameters survive. Verified by execution, not assumed.
- **Testing**: Vitest (`pnpm run test`) imports `next.config.mjs` directly and executes
  `redirects()`, so the assertion runs against the real configuration object.
- **No data model, contracts or quickstart artifacts**: the change adds no entities, interfaces or
  external integration, so those Phase 1 artifacts are not applicable.

## Constitution Check

| Principle | Assessment |
| --- | --- |
| I. Single Source of Truth | Compliant — no governance, Memory Bank or specialist instruction is duplicated. |
| II. Verify Before Acting | Compliant — finding re-verified from the audit evidence and the live route modules before editing. |
| III. Implementation Sequence | Compliant — inspect, plan (this file), implement, test, double-check, report, PR. |
| IV. Protect Core Systems | Compliant — no payment, authentication, database, secret or deployment configuration touched. |
| V. Resource Conservation | Compliant — `.docs/` untouched; artifacts kept concise. |
| Build/execution safety | Compliant — build measured against the 495 MB ceiling and reported. |

Post-design re-check: no new artifact or decision changes the assessments above.

## Approach

1. Add two entries to `redirects()` — one per legacy alias — with `destination: '/map'` and
   `permanent: true`, placed after `/stories` and before the host catch-all so the most specific
   path rules are evaluated first.
2. Leave `/map`, its metadata, the sitemap and the alias route modules untouched. The redirect is the
   authoritative fix; route removal would add diff without changing the served result.
3. Add `__tests__/map-url-redirects.test.js` covering both redirects, the two pre-existing
   redirects, and sitemap exclusion of the aliases.
4. Verify by execution (local production server + `curl`), then run the repository gate.

## Files

| File | Change |
| --- | --- |
| `next.config.mjs` | Two permanent redirects added; existing entries unchanged. |
| `__tests__/map-url-redirects.test.js` | New regression test. |
| `specs/107-map-url-consolidation/**` | Spec, plan, tasks, checklist. |
| `.specify/feature.json` | Feature pointer. |
| `memory-bank/activeContext.md`, `memory-bank/progress.md` | Task record. |

Not changed: `app/**` (including `/map` and both alias modules), `public/**`, themes, components,
`wrangler.jsonc`, dependencies, workflows, `.docs/**`.

## Verification plan

| Check | Method |
| --- | --- |
| Redirect behaviour | `pnpm build` then local server; `curl -sSI` both aliases expecting a permanent 3xx with `Location: /map` |
| Query preservation | `curl -sSI "/lucky-map-of-canada?utm_source=audit-check"` → `Location: /map?utm_source=audit-check` |
| `/map` unaffected | `curl -sS /map` returns 200 with its own title and canonical |
| Regression test | `pnpm exec vitest run __tests__/map-url-redirects.test.js` |
| Repository gate | `./freebuff-verify.sh` (Spec Kit gate, `tsc --noEmit`, build, size ceiling, tests) |
| Build size | measured `.next` + `public` bytes versus 495 MB |

## Risks and mitigations

- **Redirect shadowed by the host rule**: the host entry requires `has: host`, so it cannot match an
  apex request; verified by execution after the change.
- **Trailing-slash double hop**: `/alias/` normalises to `/alias` first and then redirects; one extra
  hop only for the trailing-slash variant, the same behaviour `/stories` already has.
- **Old links to alias paths with parameters**: covered by SC-002.
- **Indexed aliases**: a permanent redirect is the correct signal whether or not they are indexed;
  Search Console is unavailable, so index state stays unverified and is reported as such.
