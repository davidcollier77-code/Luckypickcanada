# Research: Cloudflare Toolchain Re-Audit

**Date**: 2026-11-26

**Baseline**: `main` at `8a18c44583192e2f32e801c81c44c6f1311e71d7` (`docs(memory-bank): close out Spec 223 handoff (#2045)`)

This research re-derives the decision from live registry metadata, published manifests, release notes and advisories. The earlier Spec 220 conclusions were not treated as authoritative; where they differ, this document records the fresh evidence and the changed conclusion.

## 1. Repository baseline

| Item | Current repository resolution |
| --- | --- |
| Node.js engine | 26.x (`.nvmrc` 26; observed runtime 26.13.0) |
| Package manager | pnpm 10.30.3 (`packageManager`, bootstrap scripts, CI) |
| Next.js | 16.4.6 |
| React / React DOM | 19.3.1 |
| @opennextjs/cloudflare | 1.20.18 (exact) |
| @opennextjs/aws (transitive) | 4.2.0 |
| Wrangler | 4.166.0 (exact) |
| Undici override | `8.12.2`, globally applied |
| glob snapshots | 13.0.7 (adapter) and 14.0.6 (root devDependency) |
| minimatch snapshots | 11.0.1, 11.0.9, 3.1.5; no 10.x installed |
| Worker configuration | `wrangler.jsonc`, compatibility date 2026-08-04, `nodejs_compat`, R2 cache, D1 tag cache, Durable Object queue, KV, custom routes |
| Middleware/proxy | None (`middleware.ts` / `proxy.ts` absent; no `revalidateTag` call) |

## 2. Current stable releases (checked 2026-11-26)

| Package | Newest stable | Published | Next stable? |
| --- | --- | --- | --- |
| @opennextjs/cloudflare | **1.20.19** | 2026-11-25 | None newer (`dist-tags.latest` 1.20.19) |
| wrangler | **4.168.0** | 2026-11-24 | 4.168.1 and 4.169.0 return HTTP 404 |
| wrangler (intermediate) | 4.167.0 | 2026-11-23 | — |

The npm `latest` dist-tag endpoint for Wrangler in this environment returns a stale `4.152.0`, and `/wrangler/latest` returned an older body, so version existence was confirmed from versioned registry documents and the GitHub release pages instead. Wrangler 4.166.0 (2026-11-20), 4.167.0 (2026-11-23) and 4.168.0 (2026-11-24) all exist with immutable release pages; 4.169.0 does not.

## 3. Adapter selection: upgrade 1.20.18 → 1.20.19

Published manifests:

| Field | 1.20.18 | 1.20.19 |
| --- | --- | --- |
| `glob` | `^13.0.6` | `^14.0.6` |
| `@opennextjs/aws` | `4.2.0` | `4.2.1` |
| `next` peer | `>=15.5.29 <16 || >=16.4.5` | unchanged |
| `wrangler` peer | `^4.148.0` | unchanged |

Release notes for 1.20.19:

1. Bump `glob` to v14 to drop the vulnerable minimatch 10 dependency. `glob@13` depends on `minimatch@10`, affected by GHSA-g3hv-75wg-m249, which has no patched 10.x release; `glob@14` uses `minimatch@11`.
2. Bump `@opennextjs/aws` to 4.2.1: do not skip middleware and `next.config` routes for some `i18n` requests; require a path separator after the buildId in `/_next/data` requests; respond with 500 when the body stream errors before its first chunk; match middleware against the normalized pathname.
3. Validate `tagCache` rather than `incrementalCache` when checking for a custom tag cache (only affects a hand-written config with `incrementalCache: "dummy"`; this repository uses the R2 incremental cache and the D1 tag cache).
4. Fix cookie-bearing requests returning HTTP 500 in apps with `proxy.ts` or Node.js runtime middleware. The regression was introduced in **1.20.18**.
5. Do not serve stale regional-cache entries after `revalidateTag`. This repository does not use `withRegionalCache` and does not call `revalidateTag`, so this is not presented as a site fix.

Applicability to this repository:

- Next.js 16.4.6 satisfies the unchanged Next peer range; retained Wrangler 4.166.0 satisfies `^4.148.0`.
- The confirmed benefit is the supported dependency graph: the advisory-affected `glob 13 → minimatch 10` path leaves the graph instead of being papered over by the root cross-major `minimatch@10 → 11.0.1` override. `glob 14.0.6` is already installed through the root `glob ^14.0.6` devDependency, so this build already exercises that major.
- The 1.20.18 cookie/middleware regression is a defect in the currently pinned release even though this app has no middleware or proxy.

## 4. Wrangler decision: retain 4.166.0

| Release | Content | Applicability here |
| --- | --- | --- |
| 4.166.0 (current) | Waits for a just-uploaded Worker version during deploys; updates Undici to 7.30.2 for six upstream security fixes; workerd 1.20261119.1, miniflare 5.20261119.0-beta, workers-utils 0.56.0 | Already installed and CI-proven; contains the latest Undici security update for the Wrangler line |
| 4.167.0 | First-deploy recovery when the API returns a service without a script; first-deploy subdomain lookup retry; `--env-file` for the experimental `cf-wrangler dev`; removes `dispatch-namespace rename`; `basin sql` exit code; D1 help text; workerd 1.20261123.1 | First-deploy-only fixes do not affect the existing deployed Worker; other changes are for unused commands |
| 4.168.0 | Applies `images.url_transformations` at deploy; OAuth billing scopes for interactive `wrangler login`; `WRANGLER_LOG_PATH` fix; miniflare 5.20261123.1-beta, workerd 1.20261123.1, workers-utils 0.57.0 | `images.url_transformations` is not configured; CI authenticates with an API token, not interactive OAuth; no logging-path configuration |

Neither newer release contains a security advisory fix or a compatibility requirement for this deployment. Upgrading would adopt a new Miniflare beta/workerd pair and new deploy-time behaviour for no demonstrated benefit, so 4.166.0 is retained as the safer, proven choice.

The root Wrangler dependency serves the main OpenNext pipeline and the separate `workers/updater-scheduler` Worker, whose Wrangler dry-run remains part of verification.

## 5. Advisory analysis

### GHSA-g3hv-75wg-m249 (minimatch)

- Severity: Moderate, CVSS 6.9; CVE-2026-118764.
- Affected: `>= 7.0.0, < 11.0.1`; patched: **11.0.1**. There is no patched `10.x` release.
- Current state: the adapter's `glob 13` declares `minimatch ^10`; the root `minimatch@10: 11.0.1` override forces v11 so the vulnerable package is not installed, but that is a cross-major force on a build-critical consumer. The selected adapter removes the need for it.

### GHSA-xjj6-f33q-929c (undici)

- Severity: High, CVSS 7.5; CVE-2026-109869.
- Affected/fixed: `>= 6.23.0 < 6.29.1` → 6.29.1; `>= 7.18.0 < 7.30.1` → 7.30.1; `>= 8.0.0 < 8.12.2` → 8.12.2.
- Current graph: only `undici@8.12.2` is resolved, which is patched. The global override forces the exact `undici 7.30.2` requests of `wrangler`, `miniflare` and `@cloudflare/workers-utils` onto v8, and forces jsdom's `^8.12.3` down to 8.12.2.

## 6. Override disposition

All existing overrides are retained unchanged:

- `glob@10: 14.0.4` remains the documented compatibility protection for `@node-minify/core`.
- The `minimatch@10` and `minimatch@10.2.6>brace-expansion` entries are now inert because no `minimatch@10` snapshot remains. They are retained deliberately: removing them would change the security/resolution policy beyond the requested toolchain update, and an inert floor cannot regress.
- The undici override is not changed by this task. The cross-major force is a pre-existing residual risk recorded in `plan.md`; changing it would be a separate security-resolution decision with its own evidence and tests.

## 7. Repository controls that constrain the change

| Control | Requirement |
| --- | --- |
| Validate OpenNext Repair | Frozen install on Node 26/pnpm 10.30.3; Next.js build; strict 495 MiB gate; OpenNext build; compiled CSS/Worker/assets checks; `wrangler build` |
| Deploy OpenNext | Main-branch only; unchanged concurrency, rate-limit retry and post-deploy CSS checks; not triggered by this PR |
| Deploy updater scheduler | Node 26/pnpm 10.30.3; scheduler tests and Wrangler dry-run; main-branch only |
| Visual QA | A real `package.json` dependency change is not scripts-only and keeps both shards required |
| Protected File Changes | `package.json` and `pnpm-lock.yaml` require the exact authorization declaration and the environment gate |
| PR Verification Report | Seven categories; dependency health runs on every PR |

## 8. Verification environment

- Freebuff VM: Linux, Node.js **26.13.0**, npm 11.20.0.
- `scripts/bootstrap-pnpm.sh` provisioned the exact pnpm **10.30.3** pin into `$HOME/.local`.
- `pnpm install --lockfile-only` regenerated the lockfile; `pnpm install --frozen-lockfile` then installed the tree successfully.
- Playwright, OpenNext artifact validation, DevSkim and deployment run in CI; this task does not run browsers or deploy.

## 9. Sources

- OpenNext Cloudflare 1.20.19 release: https://github.com/opennextjs/opennextjs-cloudflare/releases/tag/%40opennextjs%2Fcloudflare%401.20.19
- npm adapter 1.20.19 manifest: https://registry.npmjs.org/@opennextjs/cloudflare/1.20.19
- npm adapter 1.20.18 manifest: https://registry.npmjs.org/@opennextjs/cloudflare/1.20.18
- npm @opennextjs/aws 4.2.1 manifest: https://registry.npmjs.org/@opennextjs/aws/4.2.1
- Wrangler 4.166.0 release: https://github.com/cloudflare/workers-sdk/releases/tag/wrangler%404.166.0
- Wrangler 4.167.0 release: https://github.com/cloudflare/workers-sdk/releases/tag/wrangler%404.167.0
- Wrangler 4.168.0 release: https://github.com/cloudflare/workers-sdk/releases/tag/wrangler%404.168.0
- npm Wrangler 4.166.0 manifest: https://registry.npmjs.org/wrangler/4.166.0
- npm Wrangler 4.168.0 manifest: https://registry.npmjs.org/wrangler/4.168.0
- minimatch advisory: https://github.com/advisories/GHSA-g3hv-75wg-m249
- undici advisory: https://github.com/advisories/GHSA-xjj6-f33q-929c
- npm @cloudflare/workers-utils 0.56.0 manifest: https://registry.npmjs.org/@cloudflare/workers-utils/0.56.0
- npm miniflare 5.20261119.0-beta manifest: https://registry.npmjs.org/miniflare/5.20261119.0-beta
- Local documentation: `.docs/troubleshooting/_opennextjs_opennextjs-cloudflare.md`, `.docs/troubleshooting/_opennextjs_docs.md`, `.docs/troubleshooting/_cloudflare_workers-sdk.md`
