# DevSkim Alert Triage Ledger

**Source reviewed:** user-supplied screen recording of GitHub Security → Code scanning, filtered to open alerts on `main`, plus targeted inspection of the referenced source files on the current `main` branch.

**Recorded dashboard state (historical only):** 113 open / 27 closed. The page rows were shown as detected by DevSkim and approximately five hours old at the time of recording. These are not represented as live current totals.

**Inventory limitation:** The connected GitHub repository interface rejected the Code Scanning alerts API URL as an unsupported endpoint, and no alert-dismiss/update operation is exposed by the available connector. This ledger therefore records the distinct findings visible in the recording and source context that could be inspected; it does **not** claim a complete, current, per-alert inventory for all 113 items. The remaining alert records must not be bulk-dismissed or called cleared based on this ledger alone.

## Confirmed remediation

| Alert | Finding | Evidence | Disposition |
|---|---|---|---|
| #125 | HTML anchor with `target="_blank"` lacks opener protection; video points to `app/.../send-gift/route.ts:91`. | The current file `app/api/send-gift/route.ts` generates the email anchor with a fixed Lucky Pick Canada reveal URL, but did not declare `rel`. The href, URL construction and link label do not need to change. | **VERIFIED VULNERABILITY — FIXED IN PR CANDIDATE.** Added `rel="noopener noreferrer"`; a targeted regression assertion was added to `__tests__/security-payment.test.js`. Test/CI result is pending actual execution. |

## Findings supported as false positives by current source context

| Visible alert IDs / group | Location(s) | Source evidence and classification | Source change |
|---|---|---|---|
| #69–#60 | `pnpm-lock.yaml` at the lines shown in the recording (295, 1980, 2045, 4116, 4282, 5430, 5611, 5642, 5688, 7114). | The inspected lockfile entries contain SHA-512 integrity fields. Some nearby package names refer to algorithms such as SHA-1 or MD5, but package naming or a cryptographic API/dependency name is not proof that package integrity is using a weak digest. **VERIFIED FALSE POSITIVE for the inspected matches**; do not infer that every other alert at an unseen location has the same disposition without checking it. | None. `pnpm-lock.yaml` is unchanged. |
| #143–#131 and repeated manifest matches such as #55, #53, #28, #24–#21 | `.docs/manifest.json`, visible line range about 428–460. | These entries are hashes/commit identifiers used to pin or identify documentation-source snapshots, not credentials. A public Git commit SHA or file checksum is not an API key. **VERIFIED FALSE POSITIVE for the inspected manifest matches.** `.docs/` is read-only under `AGENTS.md`. | None. `.docs/manifest.json` and all of `.docs/` are unchanged. |
| #117–#108 | `.specify/integrations/generic.manifest.json`, visible line range about 6–15. | The manifest records SHA-256 content hashes for Spec Kit command files. They are integrity/checksum metadata, not authentication material. **VERIFIED FALSE POSITIVE for the inspected rows.** | None. Manifest is unchanged. |
| #74 | `workers/jules-bridge/src/index.js:3`. | The matched value is a Cloudflare account identifier used by the worker, not an API token, password, or secret credential. The code separately refers to secret *environment-variable names* but no credential value was copied into this ledger. **VERIFIED FALSE POSITIVE for this specific match.** | None. Identifier, worker configuration and secret stores are unchanged. |
| #128, #127, #126 | `app/components/CrystalBall/CrystalBall.tsx:137,147,181`. | The calls pass callback functions and fixed numeric delays; no untrusted value is evaluated as timer source code. **VERIFIED FALSE POSITIVE for the inspected calls.** | None. |
| #123, #122 | `components/LuckyGenerator.tsx:465,1100`. | The inspected timer usage passes callback functions and a numeric delay; the share-status timer similarly passes a callback. **VERIFIED FALSE POSITIVE for the inspected calls.** | None. |
| #121 and related visible Daily Resonance matches | `components/DailyResonance.tsx:279` and subsequent animation/audio delays. | The source passes arrow-function callbacks to `setTimeout`; the callback body operates on existing refs/state. There is no string evaluation or user-supplied timer program. **VERIFIED FALSE POSITIVE for the inspected calls.** | None. |
| #77 | `app/homepage/ExploreLuckButton.js:143`. | The cooldown timer passes a callback that resets a local ref and a constant numeric delay. It does not evaluate untrusted content as code. **VERIFIED FALSE POSITIVE for this call.** | None. |
| #75 | `app/api/oracle/route.js:135`. | The timeout calls `controller.abort()` through a callback after a fixed timeout; it is not a string timer and uses no request value as executable code. **VERIFIED FALSE POSITIVE for this call.** | None. |
| #73–#71 and related visible homepage matches | `app/homepage/HomePage.js:215,221,319`. | The timers schedule local shooting-star/resize callbacks with numeric delays. They do not execute untrusted text. **VERIFIED FALSE POSITIVE for the inspected calls.** | None. |
| #70 | `app/lib/audio.js:201`. | The inspected callback stops a captured audio instance after the existing 160 ms fade and checks the captured ID before resetting state. It is callback-based and not an untrusted code string. **VERIFIED FALSE POSITIVE for this call.** | None. |
| #25 | `scripts/test-refresh-docs.js:97`. | The inspected use is a test double for `setTimeout` receiving a callback. It is not an application injection sink. **VERIFIED FALSE POSITIVE for this call.** | None. |
| #17 | `app/lucky-card-reveal.js:1049`. | The visible match is a callback-based animation/audio timer, not an untrusted string passed as timer code. **VERIFIED FALSE POSITIVE for the inspected call.** | None. |
| #83–#80 | `app/.../suggestions/route.test.js:69,86,96,111` and additional test-only rows. | These findings point to `http://localhost` in test-created `Request` objects. The origin text is fixture plumbing, not production network routing. **VERIFIED FALSE POSITIVE for the visible test-file matches.** | None. |
| #76 and additional localhost warnings | `app/api/oracle/route.js:9`, `functions/api/oracle.js` allowed-origin list, and test-only `localhost` requests. | The test-file matches refer to locally constructed requests. The application route's localhost value is a dev origin in an exact allowlist; its presence alone does not demonstrate a production vulnerability. Removing it without testing local development could change behavior. **NOT CONFIRMED AS A VULNERABILITY; retain pending rule-specific alert review.** | None. |
| #124 | `components/LuckyGenerator.tsx:226`. | The `http://` string is the required XML namespace URI `http://www.w3.org/2000/svg` on an inline SVG loader, not an HTTP network request or insecure external resource. **VERIFIED FALSE POSITIVE for this match.** | None. |

## Remaining alert-level work

1. The displayed count of 113 open findings cannot be independently refreshed through the connected API; the historical 113/27 count must not be restated as a current count.
2. Individual DevSkim alert detail/status and dismissal endpoints are unavailable to this session. Even where the source evidence supports a false-positive classification, this session cannot safely execute or verify the corresponding GitHub alert-level dismissal. Do not report these dashboard rows as closed.
3. The PR candidate should trigger normal PR scanning. Check the actual current-head scan and alert transitions if visible in CI, but a scan pass alone must not be described as proving that every dashboard alert is closed.
4. No genuine secret value or active credential was confirmed in the reviewed token/key matches. This task does not modify, revoke, rotate, delete, disable, or replace any secret or external key; no credential value is reproduced here. The separate historical Neon-connection-string remediation in PR #1546 is not changed by this task and is not duplicated as a new rotation action.

## Integrity checks

- No broad suppression, rule disablement, mass dismissal, severity change, or scanner configuration change was made.
- `.docs/`, the dependency lockfile, manifests, environment variables, external secret stores, design assets, and unrelated application behavior are intentionally untouched.
- The only intended application source change is opener protection on the one confirmed new-window email link, plus a regression assertion.
- Remaining code/test/Spec Kit verification and alert-level statuses must be reported from actual CI/dashboard evidence; they must not be inferred from editing this ledger.