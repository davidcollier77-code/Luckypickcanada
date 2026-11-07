# Implementation Plan: Sitewide SEO Audit

**Feature**: `specs/106-seo-audit`
**Branch**: `docs/seo-audit-20261107`
**Created**: 2026-11-07

## Technical Context

- **Application**: Next.js App Router (16.4.3) on Cloudflare Workers via OpenNext; static homepage, dynamic `/map` and `/where-luck-has-been-found-in-canada`, hourly `/lucky-map-of-canada`, client-rendered `/reveal`, `/lucky-meter`, `/crystal-ball`.
- **Task type**: read-only audit. No runtime, dependency, configuration or content change.
- **Audit method**: live HTTP inspection (`curl`) of every discovered URL and asset, server-rendered HTML parsing (Node, no dependencies), image metadata measurement with the repository's installed `sharp`, byte-size measurement of the initial JS/CSS/font set, and source inspection of `app/**` metadata, `app/robots.js`, `app/sitemap.js`, `public/robots.txt`, `next.config.mjs`, `wrangler.jsonc`.
- **Excluded tools**: PageSpeed Insights API (HTTP 429, shared anonymous quota exhausted), CrUX API (requires an API key), Lighthouse (not installed; installing new tooling is prohibited), Search Console, Analytics, Cloudflare dashboards.

## Constitution Check

| Principle | Assessment |
| --- | --- |
| I. Single Source of Truth | PASS — `AGENTS.md` read first; this plan only adds task artifacts. |
| II. Verify Before Acting | PASS — every finding derives from an executed request or a read file; unavailable data is declared. |
| III. Implementation Sequence | PASS — inspect, identify, understand, plan, then document; no production change. |
| IV. Protect Core Systems | PASS — no payment, auth, database, Cloudflare, secret or deployment change. |
| V. Resource Conservation | PASS — `.docs/` untouched; no new dependency installed. |

No gate violation; nothing to justify.

## Phase 0: Research

No material unknown required external research. The audit applies general SEO practice (crawlability, canonicalization, metadata, structured data, image delivery, internal linking) to measured evidence. The one research-shaped question — whether FAQ rich results remain available to a non-government site — was resolved from known search-engine guidance and is stated as context, not as a measured result; it does not change any recommendation's scope.

## Phase 1: Design artifacts

- `data-model.md` — omitted: no persisted data, contract or state change.
- `contracts/` — omitted: no external interface.
- `quickstart.md` — omitted: the repeatable checks are listed in `tasks.md`; the report itself records the executed commands.

## Structure

Documentation-only change set:

```text
specs/106-seo-audit/spec.md
specs/106-seo-audit/plan.md
specs/106-seo-audit/tasks.md
specs/106-seo-audit/checklists/requirements.md
PR_SUMMARY.md                      # single canonical report (PR body)
.specify/feature.json              # pointer
memory-bank/activeContext.md       # task record
memory-bank/progress.md            # durable outcome
```

Not changed: `app/**`, `public/**`, `themes/**`, `components/**`, `next.config.mjs`, `wrangler.jsonc`, `.github/**`, `package.json`, `pnpm-lock.yaml`, `.docs/**`.

## Verification Plan

1. `./freebuff-verify.sh` — Spec Kit governance tests and gate, TypeScript, production build, refresh-docs tests.
2. Measure `.next` + `public` bytes and compare with the 495 MB maximum.
3. Confirm the diff contains only documentation paths and no protected surface.
4. Re-run the live crawl commands after writing the report to confirm the recorded statuses and byte counts still hold.
5. Publish the report as the PR body; record PR-head CI as PENDING rather than assumed.

## Risks

- **Evidence drift**: the live site can change or be redeployed between the crawl and the report review. Mitigation: record the crawl timestamp and exact byte counts, and state that verification is a point-in-time observation.
- **Overclaiming performance**: without field or lab CWV, only static byte/timing figures are reported. Mitigation: every performance statement is either measured bytes or explicitly labelled unverified.
- **Automatic-client differences**: social platforms may answer bots differently. Mitigation: such findings carry Medium confidence and a manual-confirmation step.
- **Scope creep**: the audit naturally generates fixes. Mitigation: no fix is implemented; all are recorded as recommendations for separate approval.
