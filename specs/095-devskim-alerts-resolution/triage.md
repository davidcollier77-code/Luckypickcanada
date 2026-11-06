# Triage: every recorded DevSkim entry

**Baseline**: `devskim-alerts.md` at `3510a665` held **164** entries. All 164 were
re-audited against the current tree. The scanner was also re-run locally
(DevSkim CLI 1.0.100, the release line used by `microsoft/DevSkim-Action`),
excluding `node_modules`, `.next` and `.git` because CI checks out without them.

Measured scan: **259** raw results. The repository's production filter removed
**150**. **109** remained, and after this task's reviewed additions it removed
**109**, leaving **0** results at any location still recorded in the report.

## Classification

| Recorded entries | Rule | Location | Classification | Evidence |
| ---: | --- | --- | --- | --- |
| 37 | DS173237 | `.docs/manifest.json` (`githubShas`) | False positive, already filtered | Each value is a public 40-hex upstream commit SHA in the auto-updated manifest's `githubShas` map. The existing `should_suppress_checksum_metadata_finding` predicate validates the map, key, exact value and source span. `.docs/` is read-only and unchanged. |
| 107 | DS162092 | `artifacts/perf-audit/*.json`, `artifacts/reveal-phase2/report.json` | False positive, now filtered | Committed browser-probe measurement dumps. Every finding is a `127.0.0.1` URL that was captured from the local test server; the files are data under `artifacts/`, never in the Next.js build or `public/`. |
| 1 | DS162092 | `playwright.config.ts:31` | False positive, now filtered | The line is Playwright's `webServer.command` starting the local Next.js dev server; the neighbouring `url` is the same loopback origin. Test-runner configuration only. |
| 10 | DS172411 | `app/lucky-reveal-celebration.jsx` | Outdated; current equivalents already filtered | The recorded lines 217–250 and 288–289 no longer exist; the five timers now at 265/315/334/338/359 are callable callbacks with compile-time constants. The scan finds two celebration results and the existing audited patterns remove both. |
| 2 | DS172411 | `app/lucky-reveal-popup.js` | Outdated; current equivalent already filtered | Lines 197/268 are stale; the single current call at 219 is the reviewed callback already covered by the audited pattern. |
| 2 | DS172411 | `__tests__/lucky-reveal-finish-phase2.test.js` | False positive, already filtered | Both entries point at quoted assertion strings, not executed timers; the existing exact test-literal predicate covers them. |
| 1 | DS172411 | `__tests__/lucky-reveal-confetti-phase1.test.js:69` | Stale | The current scan reports no DS172411 result in this file; line 69 is an assertion wrapper, not a timer call. |
| 1 | DS172411 | `app/share-lucky-pick-button.js:280` | False positive, now filtered | `window.setTimeout(() => URL.revokeObjectURL(url), 1000)` passes a callable callback and a fixed delay; no string or request data is evaluated. |
| 1 | DS172411 | `app/share-lucky-pick-button.js:258` | Stale | Line 258 is no longer a timer; the earlier warm-up timer at 172 already carries a reviewed inline ignore. |
| 1 | DS137138 | `__tests__/lucky-reveal-phase2.test.js:254` | Stale | The file does not exist in the current tree. |
| 1 | DS137138 | `__tests__/gift-email-test-tool.test.js:170` | Stale | The file was deleted with the gift-email test tool; it does not exist in the current tree. |

## Reviewed filter additions (this task)

- DS162092 — `playwright.config.ts`: only the exact `webServer.command` and
  `webServer.url` loopback lines, with the reported span equal to the loopback token.
- DS162092 — `artifacts/**/*.json`: the file must parse as JSON, be under
  `artifacts/`, and the reported span must sit inside a JSON string value whose
  URL host is loopback. A loopback value that is not a URL, malformed JSON, a
  non-`.json` path, or any other directory stays visible.
- DS172411 — `app/share-lucky-pick-button.js`: only the exact
  `window.setTimeout(() => URL.revokeObjectURL(url), 1000);` statement.

No rule, severity, workflow trigger, scan glob, or application source changed.
