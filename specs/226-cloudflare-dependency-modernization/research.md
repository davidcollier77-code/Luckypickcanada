# Research: Cloudflare Production Dependency Modernization

Date: 2026-11-27. Every version statement below was re-derived from live registry metadata, advisory records and the generated lockfile, not from memory.

## 1. Cloudflare build/deploy pair

| Item | Evidence |
| --- | --- |
| `@opennextjs/cloudflare` latest | `dist-tags.latest = 1.20.19` (already pinned; no update available). |
| Adapter peers | `next >=15.5.29 <16 || >=16.4.5` (installed 16.4.6), `wrangler ^4.148.0`. |
| `wrangler` latest stable | `dist-tags.latest = 4.168.0` (published 2026-11-24). |
| `wrangler` installed before | 4.166.0 with `workerd 1.20261119.1`, `miniflare 5.20261119.0-beta`, `@cloudflare/workers-utils 0.56.0`. |
| `wrangler` 4.167.0 / 4.168.0 changes | 4.167.0: `--env-file` support in the experimental `cf-wrangler dev` delegate, removal of `dispatch-namespace rename`, Basin SQL non-zero exit, D1 help text; 4.168.0: `images.url_transformations` applied after deploy (not configured here), OAuth billing scopes (CI uses API tokens), `WRANGLER_LOG_PATH` fix, new workerd/Miniflare pair. |
| Decision | Upgrade `wrangler` to 4.168.0. It is the current stable release, satisfies the adapter peer range, and brings the bundled Workers runtime (`workerd 1.20261123.1`) forward; no configured feature is removed by these releases. |

The two packages are reviewed together because the adapter declares Wrangler as a peer; upgrading one without the other would leave the deploy tool behind the runtime it targets.

## 2. Override audit

The manifest carried 18 `pnpm.overrides` entries. Each was tested against the regenerated graph.

| Override (before) | Graph evidence | Disposition |
| --- | --- | --- |
| `undici@6/7/8` | Each major has a patched floor; consumers declare older ranges. | **Kept** — verified security floors (Spec 224). |
| `glob@10: 14.0.4` | No `glob@10` consumer remains; the only glob is 14.0.6 (OpenNext `^14.0.6`, Sentry, direct devDependency). The recorded value 14.0.4 is not even in the lockfile. | **Removed** — inert historical workaround. |
| `minimatch@10: 11.0.1` | Only minimatch-10 consumer was `@typescript-eslint/typescript-estree` 8.69.0. Version 8.74.0 declares `minimatch ^11.0.1`. | **Removed** — fixed upstream instead of cross-major forcing. |
| `brace-expansion@1: >=1.1.21`, `@2: >=2.1.7` | Normal resolution yields 1.1.21 and 5.0.13. GHSA-v6h2-p8h4-qcjw floors are 1.1.12/2.0.2/3.0.1/4.0.1. | **Removed** — already patched by upstream ranges. |
| `minimatch@8.0.7>brace-expansion`, `minimatch@10.2.6>brace-expansion` | Parent versions 8.0.7 and 10.2.6 do not exist in the graph; the pinned 5.0.12 is older than the resolved 5.0.13. | **Removed** — inert selectors. |
| `minimatch@3.1.5>brace-expansion: 1.1.21` | The parent resolves 1.1.21 anyway; duplicate of the `brace-expansion@1` floor. | **Removed** — redundant. |
| `proxy-addr: 2.0.8` | 2.0.8 is the latest published version and satisfies express 5.3.0's `^2.0.7`. | **Removed** — restated normal resolution. |
| `source-map-js: 1.2.2` | Consumers declare `^1.2.x`; normal resolution keeps 1.2.2 and remains audit-clean. | **Removed** — restated normal resolution. |
| `qs: >=6.16.0` | Express declares `^6.14`; normal resolution selects 6.17.1 (latest). | **Removed** — restated normal resolution. |
| `fast-uri: >=3.1.8` | ajv 8.20.0 declares `fast-uri ^3.0.1`; the override forced 4.2.3, a cross-major jump. Normal resolution selects 3.1.9, above the tabulated security floor. | **Removed** — the force was the risk. |
| `sharp: 0.35.5` | Duplicate of the direct devDependency exactly; single 0.35.5 resolved without it. | **Removed** — no-op. |
| `vite: >=8.3.8` | Duplicate of the direct devDependency; single 8.3.8 resolved without it. | **Removed** — no-op. |
| `postcss: ^8.5.10` | Survives removal as Next 16.4.6's own `^8.5.23` plus stylelint's 8.5.31/8.5.33; no advisory applies to any of them. | **Removed** — no security requirement. |
| `@vitest/mocker: 5.0.5` | Forced Vitest 5.1.1 onto 5.0.x internals (`@vitest/mocker`, `@vitest/spy`). | **Removed** — a downgrade, not a fix; both now 5.1.1. |

### Advisory evidence

- **GHSA-g3hv-75wg-m249 / CVE-2026-118764** — minimatch DoS, affected `>=7.0.0 <11.0.1`, patched `11.0.1`. It was the reason for the `minimatch@10` override. With `@typescript-eslint` 8.74.0 declaring minimatch 11 upstream, no consumer requires the override. The remaining 3.1.5 copy is below the affected range.
- **GHSA-v6h2-p8h4-qcjw / CVE-2025-5889** — brace-expansion ReDoS, patched 1.1.12 / 2.0.2 / 3.0.1 / 4.0.1. The graph's 1.1.21 and 5.0.13 are both above the floors.
- `pnpm audit` on the final graph: **0 advisories** across 999 dependencies.

## 3. Wider stack review

| Concern | Finding | Action |
| --- | --- | --- |
| Node.js | `engines.node` and `.nvmrc` are `26.x`; local runtime 26.13.0; all workflows use `node-version: '26'`. Wrangler 4.168.0 requires `>=22.12.0`; the adapter has no Node floor above this. | No change needed. |
| Package manager | `packageManager: pnpm@10.30.3`, pinned identically in four workflows and in `scripts/bootstrap-pnpm.sh`. A newer 10.x exists (10.34.9). | No change in this PR — pinning is intentional and CI-consistent; see recommendations. |
| Next.js / React | `next` 16.4.6 is the latest release and satisfies the adapter peer (`>=16.4.5`); React 19.3.1 matches `react-dom`. | No change. |
| Cloudflare runtime config | `wrangler.jsonc` uses `compatibility_date` 2026-08-04 with `nodejs_compat`, well above OpenNext's documented minimum (2024-09-23); bindings (R2 incremental cache, D1 tag cache, DO queue, KV) match `open-next.config.ts`. | No change — compatibility-date advancement changes runtime semantics and needs separate owner authorization. |
| Deprecated dependencies | No package in the resolved graph is marked deprecated on install; `npm warn deprecated` did not appear. ESLint 10 sits in `dependencies` rather than `devDependencies`. | Noted as a recommendation; moving it touches the production install surface and is out of scope. |
| Vulnerabilities | `pnpm audit` 0; the GitHub advisory database is also cross-checked by the repository's Dependency Health checker on the PR. | Verified. |
| CI/deploy reliability | Both protected workflows already build the OpenNext artifact and run `wrangler build`; the new pair is exercised locally before push. | Verified locally; CI remains authoritative. |
| Broader outdated packages | `typescript` 7.0.2, `@testing-library/jest-dom` 8.0.0, `dotenv` 18.x are new majors; `@sentry/nextjs` 11.19.0, `vitest` 5.1.2, `resend` 6.40.1, `lucide-react` 1.82.0, `@stripe/stripe-js` 10.4.0, `dompurify` 3.5.0 are minor/patch. | Excluded — not required by this task's scope; listed as optional follow-ups. |

## 4. Rejected alternatives

- **Keep `minimatch@10 → 11.0.1`**: rejected once the consumer's upstream release declared minimatch 11; the override would be a permanent cross-major force with no advisory left to justify it.
- **Upgrade the adapter's peer or jump to a prerelease adapter**: no newer adapter exists; `latest` is 1.20.19.
- **Stay on Wrangler 4.166.0**: rejected because the mission asks for a current mutually supported pair; 4.168.0 is the latest stable within the adapter's supported range and removes no configuration this project uses.
- **Advance `compatibility_date`**: rejected in this task — it is a runtime-behaviour change to a protected deployment file and needs separate authorization and post-deploy observation.
- **Upgrade pnpm to 10.34.9**: rejected here — it requires lockfile churn plus four workflow edits and test updates, with no security driver.
