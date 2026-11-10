# Evidence: Security Alert Ledger Remediation

**Collected**: 2026-11-10 against `main` at `94cb61946e8a6bdf414bf3863d8e4a966ddb9aed`.

## Open alerts retrieved from GitHub

- Code scanning (DevSkim, `note`): 20 alerts — #558, #561, #562, #563, #564, #566, #567, #568, #569, #570, #582, #584–#591, #599.
- Code scanning (DevSkim, `error`): 3 alerts — #597, #600, #601.
- Code scanning (CodeQL, `actions/missing-workflow-permissions`): 1 alert — #602.
- Dependabot: 1 alert — #69, `minimatch` 10.2.6, GHSA-g3hv-75wg-m249 / CVE-2026-118764, patched in 11.0.1.

## Ledger classification (29 recorded entries)

| Recorded location | Rule | Open alert | Current source | Classification and remediation |
|---|---|---|---|---|
| `scripts/test-support/mock-refresh-https.js:40` | DS172411 | #558 | `setTimeout(() => {` at line 40, fixed `0` ms delay, callable callback | Reviewed false positive; test-only transport, no string evaluation. Added to the DS172411 allowlist. |
| `tests/visual/homepage-content-refresh.spec.ts:92,116,133,157,207,255,280` | DS172411 | #569, #568, #567, #566, #599, #564, #563 | `test.setTimeout(120_000)` at each line | Reviewed false positive; Playwright test-runner timeout configuration. Added to the DS172411 allowlist. |
| `tests/visual/homepage-content-refresh.spec.ts:249,274` | DS172411 | superseded by #564/#563 at lines 255/280 | Recorded lines no longer contain the token | Superseded by later edits; covered by the live alerts above. |
| `tests/visual/mobile-accessibility.spec.ts:123` | DS172411 | #582 | `test.setTimeout(45_000)` at line 123 | Reviewed false positive. Added to the DS172411 allowlist. |
| `tests/visual/mobile-accessibility.spec.ts:116` | DS172411 | none | Line 116 is `return results;`; the file's only timer is the reviewed line 123 | Stale line number; no open alert. |
| `tests/visual/map-marker-interaction.spec.ts:67,82` | DS172411 | none | Lines 67/82 contain no timer; the file's `test.setTimeout(120_000)` is line 141 and was already covered by the audited contextual allowlist | Stale line numbers; no open alert and no surviving finding. |
| `__tests__/homepage-content-refresh.test.js:182` | DS176209 | #561 | `expect(item.answer).not.toMatch(/lorem|TODO|coming soon/i);` | Reviewed false positive; an absence assertion, not unfinished code. Added an exact-line DS176209 family. |
| `__tests__/homepage-content-refresh.test.js:178` | DS176209 | superseded by #561 | Recorded line is blank | Stale line number; covered by the live alert above. |
| `artifacts/browser-testing-tooling/out/tool-probes.json:53,74` | DS162092 | #570, #562 | `127.0.0.1` / `localhost` inside quoted `command` JSON values that contain loopback URLs | Reviewed false positive; committed probe evidence, not shipped code. Extended the artifact check to loopback text inside JSON string values. |
| `artifacts/map-marker-fix/after-wide.json:4–7,1280–1283` | DS162092 | #591, #590, #589, #588, #587, #586, #585, #584 | `127.0.0.1` inside quoted console-warning JSON values that contain a loopback URL | Same reviewed false positive and remediation. |
| `scripts/cloudflare/workers-issues-to-github-setup.sh:51` | DS173237 | #597 | `ACCOUNT_ID="dbd3120f6fa0104b5fe66c201ea4251b"` | Reviewed false positive; the Cloudflare account ID is a documented public identifier. Added an exact-line family. |
| `app/lib/cloudflare-observability-issues.ts:26` | DS173237 | #601 | `export const DEFAULT_CLOUDFLARE_ACCOUNT_ID = 'dbd3120f6fa0104b5fe66c201ea4251b';` | Same public identifier and remediation. |
| `__tests__/playwright-agent-toolkit.test.js:77` | DS173237 | #600 | `expect(upstream).toContain('0a808078d96496cf2a8fa725143c870354f63cda');` | Reviewed false positive; a pinned upstream commit revision, not a credential. Added an exact-line family. |

## Genuine findings and fixes

| Alert | Finding | Fix |
|---|---|---|
| #602 (CodeQL) | `.github/workflows/deploy-open-next.yml` defined no `permissions`, so the workflow token kept the repository default. | Added a workflow-level `permissions: contents: read` block. Cloudflare authentication uses repository secrets; the `resolve-observability-issues` job keeps its narrower job-level `contents: read` / `pull-requests: read`. The protected concurrency and rate-limit blocks are unchanged. |
| Dependabot #69 | `minimatch` 10.2.6 is in the vulnerable range `<11.0.1` for GHSA-g3hv-75wg-m249 (globparts amplification). | Added the existing-mechanism pnpm override `minimatch@10: 11.0.1`. minimatch 11.0.1 ships dual CJS/ESM builds and supports Node 18/20/22+, so the current toolchain consumers keep their module shape. Verified by the frozen-lockfile install, type check, build and test suite recorded in the PR summary. |

## Verification results (local, 2026-11-10)

| Check | Command | Result |
|---|---|---|
| Python syntax (warnings fatal) | `python3 -W error::SyntaxWarning -m py_compile` on the filter, replay and test files | exit 0 |
| Suppression regression suite | `python3 -m unittest discover -s .github/scripts -p 'test_suppress_devskim_false_positives.py'` | 97 tests, OK (15 new cases in `ReviewedAlertBatchSuppressionTests`) |
| Filter replay | SARIF assembled from the 23 reviewed alert locations (real source tokens, UTF-16 offsets, current snippets) then `verify_devskim_sarif_replay.py` | 23 results → 23 suppressed, 23 removed, 0 remaining; second pass removed nothing; no audited family survived and no removal fell outside the allowlist |
| Type check | `pnpm exec tsc --noEmit` | exit 0 |
| Unit tests | `pnpm test` | 56 files / 481 tests passed |
| Repository gate | `./freebuff-verify.sh` | exit 0, "All verification steps passed" |
| Build size | `du -sb .next public` (workflow convention) | 335,101,411 bytes (319.58 MiB) against the 519,045,120-byte (495 MiB) cap |
| Dependency resolution | `pnpm why minimatch` after `pnpm install` | 3.1.5, 5.1.9, 9.0.9, 11.0.1 — no 10.x remains |
| Dependency consumers | `new minimatch.Minimatch(...)` via `@eslint/config-array`; `globSync` walk with `glob@13`; TypeScript parse via `@typescript-eslint/typescript-estree` | All exit 0; `@eslint/config-array` imports the namespace and constructs `Minimatch`, which minimatch 11.0.1 still exports |
| Diff hygiene | `git diff --check` | clean |

The replay input is **synthetic**: DevSkim-Action cannot run in this environment, so the SARIF regions were assembled from the alert coordinates against current source instead of scanner output. The alert-closure claim therefore rests on the filter's deterministic checks plus the post-merge scan, not on a local scanner run.

## Alert closure semantics

The DevSkim workflow uploads SARIF after the audited filter has removed verified false positives. GitHub marks an existing alert fixed only when a later analysis no longer reports it, so these alerts are expected to close on the first default-branch scan after this change merges. No alert was dismissed directly, and no scanner rule, path coverage or trigger was weakened to reduce the count.
