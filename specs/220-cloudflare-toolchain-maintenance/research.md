# Research: Cloudflare Toolchain Dependency Maintenance

**Date**: 2026-11-26

## 1. Repository baseline

The live default-branch manifest and lockfile were inspected at main commit c9ac9e87f75138f722a029f9dce3f1267bc98415.

| Item | Current repository resolution |
| --- | --- |
| Node.js engine | 26.x |
| Package manager | pnpm 10.30.3 |
| Next.js | 16.4.6 |
| React / React DOM | 19.3.1 |
| @opennextjs/cloudflare | 1.20.18 |
| @opennextjs/aws (transitive) | 4.2.0 |
| Wrangler | 4.166.0 |
| Undici override | 8.12.2, globally applied |
| OpenNext glob path | glob 13.0.7 -> minimatch 11.0.1 due to the root override |
| Existing glob override | glob@10 -> 14.0.4 |

The root package.json also directly depends on glob ^14.0.6. The lockfile therefore contains both glob 13.0.7 (through OpenNext 1.20.18) and glob 14.0.6. Existing minimatch overrides force minimatch 11 beneath the older glob 13 line, despite glob 13's declared range. This is not the right long-term resolution once OpenNext moves to glob 14.

The root undici override currently forces all declared Undici dependency lines to 8.12.2. Wrangler's published package manifest, including 4.168.0, declares Undici 7.30.2. The override crosses the consumer's declared major boundary.

## 2. Current stable package metadata

The npm registry's latest stable dist-tags were checked on 2026-11-26:

- @opennextjs/cloudflare: 1.20.19
- wrangler: 4.168.0

OpenNext 1.20.19 declares relevant peers:
- next: >=15.5.29 <16 || >=16.4.5
- wrangler: ^4.148.0

The repository's Next.js 16.4.6 satisfies the Next peer range, and Wrangler 4.168.0 satisfies the adapter's Wrangler peer range.

Wrangler 4.168.0 declares Node.js >=22.12.0; Node 26.x satisfies that engine range. Its optional @cloudflare/workers-types peer is ^5.20261123.1. The release brings Workerd 1.20261123.1, Miniflare 5.20261123.1-beta and @cloudflare/workers-utils 0.57.0. The Miniflare prerelease is part of Wrangler's published dependency set and must not be independently overridden without evidence.

Both npm package metadata records include SLSA provenance attestations. This records the presence of publisher provenance metadata; it is not a substitute for validating lockfile integrity and a successful frozen installation.

## 3. OpenNext 1.20.19 changes and applicability

The official OpenNext Cloudflare release notes list:
1. Upgrade glob to v14 to remove the vulnerable minimatch 10 dependency path.
2. Upgrade @opennextjs/aws to 4.2.1.
3. Fix cookie-bearing requests that could return HTTP 500 in applications using proxy.ts or Node.js runtime middleware; the regression was introduced in 1.20.18.
4. Fix a regional-cache stale-entry issue involving withRegionalCache and bypassTagCacheOnCacheHit after revalidateTag.
5. Validate tagCache rather than incrementalCache when checking a custom tag-cache configuration.

The repository has no root proxy.ts or middleware.ts, so the cookie-middleware fix is not evidence of an existing site defect. The story-submission route uses revalidatePath; repository search found no revalidateTag call. open-next.config.ts configures R2 incremental caching, queueCache with regionalCacheTtlSec of 5 seconds and waitForQueueAck enabled, plus D1 tag caching. It does not configure withRegionalCache. The regional incremental-cache fix is therefore not presented as a confirmed fix for the queue-cache implementation.

The custom tag cache is configured through d1NextTagCache, so the tag-cache validation fix applies to the configuration path, but no existing failure has been observed. The confirmed benefit is the supported dependency graph: OpenNext moves from glob 13 to glob 14, replacing the minimatch 10 path upstream rather than relying on a cross-major consumer override.

## 4. Wrangler 4.168.0 changes and applicability

The official release notes list deployment support for images.url_transformations, a change to Wrangler's interactive Cloudflare OAuth login scopes, a WRANGLER_LOG_PATH fix and updated Miniflare dependencies.

The current wrangler.jsonc does not declare images.url_transformations. CI authenticates with repository API-token secrets rather than Wrangler's interactive OAuth login. No change to those settings or credentials is required.

wrangler.jsonc has an explicit compatibility_date of 2026-08-04 and nodejs_compat. These deliberate Worker runtime settings must not be advanced as part of a local Wrangler CLI update.

The root Wrangler dependency is used by both the OpenNext app pipeline and the separate updater-scheduler Worker. Both paths must be checked.

## 5. Undici advisory and API compatibility

GitHub Advisory GHSA-xjj6-f33q-929c (CVE-2026-109869) identifies affected Undici releases and fixed versions:

| Major line | Affected range | First fixed version |
| --- | --- | --- |
| 6.x | 6.23.0 through versions below 6.29.1 | 6.29.1 |
| 7.x | 7.18.0 through versions below 7.30.1 | 7.30.1 |
| 8.x | 8.0.0 through versions below 8.12.2 | 8.12.2 |

Wrangler 4.168.0's published npm manifest declares the exact dependency `undici: 7.30.2`, already above the fixed v7 floor. The repository's global `undici: 8.12.2` override rewrites that declared v7 dependency to v8.12.2. The regenerated lockfile must restore the Wrangler edge to exactly 7.30.2, not merely any v7 release.

Undici's v7-to-v8 migration guide describes dispatcher/handler API changes. Node 26 meets the documented v8 runtime minimum, but Node engine support alone does not prove that Wrangler and Miniflare's v7-facing code is compatible with v8 APIs. Preserve consumer major compatibility while enforcing a patched version within each major actually present.

pnpm 10 documentation explicitly supports package-version selectors such as `"bar@^2.1.0": "3.0.0"` and parent-specific selectors such as `"qar@1>zoo": "2"`. For this task, the corresponding syntax patterns are `"undici@<version selector>": "<patched version>"` and `"<parent>@<parent version selector>>undici": "<patched version>"`. A package-version selector matches Undici package versions; it does not establish that the replacement satisfies every parent's declared request, so inspect the original consumer ranges and verify compatibility separately. An illustrative Wrangler-only selector is `"wrangler@4.168.0>undici": "7.30.2"`, but do not add it if removing the global override already restores Wrangler's exact declared request. The empty-range convergence override form such as `undici@` is not documented for pnpm 10 and was added in pnpm 11.13.0; it must not be used. Do not upgrade the package manager. Verify any selected selector using the exact pnpm 10.30.3 binary, `pnpm install --lockfile-only`, `pnpm why undici` and direct inspection of each lockfile entry. Every v6 resolution must be >=6.29.1, every v7 >=7.30.1, every v8 >=8.12.2, and the Wrangler 4.168.0 edge must resolve exactly to 7.30.2. If a consumer's original range cannot accept the patched target, stop and resolve its parent rather than forcing a breaking version.

## 6. Minimatch and glob override disposition

OpenNext 1.20.19 depends on glob ^14.0.6, which uses minimatch 11. The application already has a direct glob ^14.0.6 development dependency. After lockfile regeneration, verify that glob 13.0.7 is no longer resolved through OpenNext; minimatch 10 is not present or required by another package; and no path has been forced outside its consumer's declared major range.

The existing glob@10 -> 14.0.4 override remains only if the current package graph still needs it and the dependency-management regression passes. Remove the two minimatch 10-specific overrides only after the full graph demonstrates that they are unused. Preserve unrelated security overrides.

## 7. Existing CI and release assurance

| Repository control | Relevant requirement |
| --- | --- |
| Validate OpenNext Repair | Frozen install on Node 26/pnpm 10.30.3; Next.js production build; strict 495 MiB gate; OpenNext build; compiled CSS, Worker and asset checks; Wrangler build validation. |
| Deploy OpenNext | Main-branch deployment only; deterministic OpenNext build; build ID, CSS and artifact checks; bounded rate-limit retry; post-deployment stylesheet verification. Its non-cancelling concurrency group must remain unchanged. |
| Deploy updater scheduler | Node 26/pnpm 10.30.3; scheduler tests and Wrangler dry-run for workers/updater-scheduler/wrangler.toml; deployment is main-branch-only. |
| Visual QA | A real package.json dependency change is not exempt as a scripts-only edit; both Playwright shards remain required. |
| Protected File Changes | package.json and pnpm-lock.yaml are protected and require the existing explicit declaration and separate human authorization gate on the implementation PR. |
| PR Verification Report | Seven-category current-head report retains dependency health, scope, governance, protected-file and integrity evidence. |
| Dependency-management tests | Keep pnpm 10.30.3 and the committed lockfile as the single source; preserve existing security override contracts. |
| Undici override test | Must verify patched versions per major and Wrangler's preserved v7 resolution, rather than require one global v8 pin. |

The PR build and visual classifiers treat documentation, Spec Kit artifacts and Memory Bank entries as non-build/non-visual changes. A later PR changing package.json and pnpm-lock.yaml is build-affecting and visual-QA-affecting; neither gate may be bypassed.

## 8. Historical repository upgrade evidence

- PR #1279 updated Wrangler to 4.141.0. Its first validation caught a stale Wrangler 4.125.0 reference inside the OpenNext lockfile snapshot and an integrity mismatch. Both were corrected before CI passed.
- PR #1280 updated OpenNext Cloudflare to 1.20.6 and OpenNext AWS core. CI verified the Next.js build, OpenNext build, compiled CSS, Worker, assets and Wrangler build.

These precedents reinforce the need to validate the complete lock graph, all package references and registry integrity—not only root manifest pins.

## 9. Sources

- OpenNext Cloudflare 1.20.19 release: https://github.com/opennextjs/opennextjs-cloudflare/releases/tag/%40opennextjs%2Fcloudflare%401.20.19
- OpenNext issue describing the glob/minimatch incompatibility: https://github.com/opennextjs/opennextjs-cloudflare/issues/1508
- Wrangler 4.168.0 release: https://github.com/cloudflare/workers-sdk/releases/tag/wrangler%404.168.0
- npm OpenNext metadata: https://registry.npmjs.org/%40opennextjs%2Fcloudflare/latest
- npm Wrangler metadata: https://registry.npmjs.org/wrangler/latest
- npm Wrangler 4.168.0 published manifest: https://registry.npmjs.org/wrangler/4.168.0
- Undici security advisory: https://github.com/advisories/GHSA-xjj6-f33q-929c
- Undici v7-to-v8 migration guide: https://undici.nodejs.org/best-practices/migrating-from-v7-to-v8
- pnpm 10.x override and selector documentation: https://github.com/pnpm/pnpm.io/blob/main/versioned_docs/version-10.x/settings.md#overrides
- pnpm current dependency-resolution documentation (convergence syntax history): https://pnpm.io/settings#overrides
- pnpm convergence override introduction (v11.13.0): https://pnpm.io/blog/releases/11.13.0
- Repository Node.js 26 migration plan: specs/135-nodejs-26-migration/plan.md

## 10. Investigation limitations

This investigation used current GitHub file contents, registry metadata, upstream release notes and repository documentation snapshots. The ChatGPT startup environment exposes Node.js 22.16.0 and no pnpm executable. No dependencies were installed, no lockfile was generated, and no local build, test, Wrangler command or deployment was run. Implementation verification must take place in the repository's Node 26.x / pnpm 10.30.3 environment.
