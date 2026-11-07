# Documentation Updater Retirement Guard and Resilience

**Branch:** `freebuff/0c7146a6c6b6866b90666004` → `main`
**Feature:** `specs/103-docs-updater-retirement-guard`
**Implementation:** COMPLETE
**Verified completion:** NOT CLAIMED — PR-head CI pending

## Assigned Task and Task Groups

Repair `scripts/refresh-docs.js` so the four documents retired by PR #1746 can never be reintroduced by a future updater run, and so dangling symlinks or missing document targets neither crash the refresh nor disturb valid documents. Add isolated regression tests in `scripts/test-refresh-docs.js` and confirm repeated runs stay safe. Preserve every schedule, time zone, trigger, retry timing, Cloudflare Worker behaviour, and GitHub trigger integration.

| Group | Reason selected |
| --- | --- |
| `troubleshooting` | The task is a runtime crash repair in the documentation updater (dangling links and missing targets). |
| `testing` | The task requires executed regression coverage and proof that repeated updater runs are safe. |

No other group applies; the change is server-side updater tooling with no UI, SEO, audio, security-runtime, or creation surface.

## Library Documents Reviewed

| Document | Used | Useful | Note |
| --- | --- | --- | --- |
| `.freebuff/testing.md` | USED | YES | Requires real execution over inspection; drove the spawned two-run fixture rather than source-only assertions. |
| `.freebuff/troubleshooting.md` | USED | YES | Requires tests for changes and conditions its Linux reference; confirmed no shell/distro dependency. |
| `.docs/manifest.json` | USED | YES | Confirmed the four retired IDs are absent from groups/sources/inventory and identified the routing groups used in fixtures. |
| `.docs/troubleshooting/_debian_debian-reference.md` | NOT USED | NO | The repair uses Node `fs`/`path` semantics only; no Debian package, permission, or shell behaviour is involved. |
| `.docs/testing/_google_eng-practices.md` | NOT USED | NO | Generic review guidance added nothing beyond `AGENTS.md` and repository conventions for this narrow fix. |

## Implementation

**Retired-document protection**

- `RETIRED_LIBRARY_IDS` now holds the two existing Jules IDs plus the four PR #1746 IDs taken verbatim from `__tests__/docs-library-retirement.test.ts`:
  `/posthog/posthog-js`, `/magicuidesign/magicui`, `/pmndrs/react-three-fiber`, `/upstash/ratelimit`.
- `RETIRED_SNAPSHOT_FILENAMES` holds their canonical filenames using the updater's existing `safeName` convention: `_posthog_posthog-js.md`, `_magicuidesign_magicui.md`, `_pmndrs_react-three-fiber.md`, `_upstash_ratelimit.md`, plus the two Jules snapshots.
- Manifest groups, `sources`, `inventory`, and `githubShas` are sanitized before any fetch or write, so a restored or stale manifest cannot re-index a retired document.
- Snapshot cleanup now scans every on-disk `.docs` group directory instead of only manifest groups, so retired files in unrouted groups are removed. It deletes only the exact canonical filenames; regular files and dangling symlinks are both handled; nested documentation is untouched.

**Dangling symlinks and missing targets**

- `resolveDocsPath` no longer throws when `realpathSync` reports `ENOENT` for a final-path symlink. It validates the recorded link chain lexically (`validateSymlinkTargetChain`) and still throws for any target outside `.docs`, for unreadable chains, and for chains deeper than 40 hops.
- `isDanglingSymlink` and `ensureDocsSymlink` distinguish a valid file/link from a broken link. The dedup-link path then replaces a dangling link with the correct relative target; existing valid links and regular documents are left byte-identical. The existing copy fallback is unchanged.
- Because path resolution and size measurement now tolerate dangling links, `cleanupStaleTempFiles`, `getDirSize`, and the update loop no longer abort on a missing canonical target; the next successful fetch restores the canonical file and its link.

**Tests (`scripts/test-refresh-docs.js`)**

- Retired-ID coverage is derived from the repository retirement records rather than a duplicated guess, and includes the retained Jules guard.
- Full manifest sanitization, retained-source preservation, second-run idempotency, and re-stripping of a restored manifest.
- Snapshot deletion for regular files, dangling links, and unrouted groups; nested-file preservation; second-run idempotency.
- Dangling-link resolution and `.docs` size measurement; missing-target repair with untouched valid documents and links; rejection of escaping symlink targets.
- A fixture test spawns the real `scripts/refresh-docs.js` twice with only HTTPS mocked. It seeds retired IDs and stale snapshots, a missing canonical file with a dangling dedup link, and an unrelated valid document. Both runs succeed; retired entries and snapshots are gone; the canonical file and link are restored and readable; the unrelated document is unchanged; the second manifest is byte-stable.
- All pre-existing HTTP, redirect, sanitization, timeout, size-limit, SHA, and retry-timing tests are retained unchanged in behaviour.

## Files Changed

| File | Change |
| --- | --- |
| `scripts/refresh-docs.js` | Retired set/cleanup extended; dangling-link chain validation; link repair helper; generic function names. |
| `scripts/test-refresh-docs.js` | Isolated harness plus 8 new retirement/link tests and the two-run fixture; existing 17 tests preserved. |
| `.specify/feature.json` | Points to `specs/103-docs-updater-retirement-guard`. |
| `specs/103-docs-updater-retirement-guard/spec.md` | Specify artifact. |
| `specs/103-docs-updater-retirement-guard/plan.md` | Plan artifact. |
| `specs/103-docs-updater-retirement-guard/tasks.md` | Tasks artifact. |
| `specs/103-docs-updater-retirement-guard/checklists/requirements.md` | Requirements checklist. |
| `memory-bank/activeContext.md` | Active task record. |
| `memory-bank/progress.md` | Completed-work record. |
| `PR_SUMMARY.md` | This canonical summary. |

## Spec Kit Stages

Specify → Plan → Tasks → Implement, in order, reusing one new feature directory (`specs/103-docs-updater-retirement-guard`). No stage was skipped or marked N/A and no duplicate feature directory was created.

## Verification

| Check | Command | Status | Evidence |
| --- | --- | --- | --- |
| Updater syntax | `node --check scripts/refresh-docs.js` | PASS | Exit 0 |
| Test syntax | `node --check scripts/test-refresh-docs.js` | PASS | Exit 0 |
| Isolated updater suite | `node scripts/test-refresh-docs.js` | PASS | 25 passed, 0 failed (includes two spawned full runs) |
| Repository gate | `./freebuff-verify.sh` | PASS | Exit 0: frozen install, Spec Kit gate 25/25, typecheck, Next build, updater suite 25/25 |
| Build size | `.next` + `public` | PASS | 299,645,910 B + 32,840,043 B = **332,485,953 B (317.08 MiB)**, below the 495 MB hard maximum |
| Final diff audit | `git diff` + untracked listing | PASS | Only the updater, its test, feature pointer, spec artifacts, Memory Bank, and this report |
| Preserved configuration | diff inspection | PASS | No workflow, schedule, time zone, retry, Cloudflare Worker, manifest, `.docs`, application, dependency, payment, database, or authentication change |
| PR-head CI | GitHub check runs | PENDING | Must be observed on the pushed head; not run in this workspace |

## Preserved Behaviour

- Schedules `21 2/6/10 * * 2,5` in `America/Halifax`, `workflow_dispatch` inputs, concurrency, permissions, and the existing PR creation/notification steps are untouched.
- The 180-second retry, 15-second fetch timeout, 10 MB response cap, 495 MB `.docs` ceiling, batching/deferral, upstream SHA skipping, line-ending preservation, and Devsite normalization are untouched.
- Cloudflare updater-scheduler dispatch, Worker code, and all GitHub trigger integration are untouched.
- Application routes, visuals, dependencies, lockfile, payments, email, database, and authentication are untouched.
- `.docs/` was treated as read-only; no manifest or snapshot content changed.

## Remaining Issues and Limitations

- PR-head CI remains pending until the branch is pushed and checks run; until then verified completion is not claimed.
- The full-run fixture mocks HTTPS responses; it proves updater control flow and filesystem behaviour, not live upstream availability.
- The link-chain validation caps at 40 hops and validates lexical targets before realpath; deeper or adversarial chains fail closed rather than being followed.
- GitHub Actions runtime behaviour for the scheduled workflow itself is not executable in this workspace; the script and workflow wiring are unchanged.

## Final Diff Check

Reviewed the complete diff and untracked artifacts. No unrelated, generated, dependency, or protected-path change was included. The PR is left **open and unmerged** for owner review.

**USEFUL RESULT: NO** — all local mandatory checks pass, but PR-head CI is still pending and therefore verified completion is not claimed. The report will be updated with the actual PR-head results.
