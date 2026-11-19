# Evidence: HTML5 Audio Reactivity and Gemini Retirement QA

## Visual QA failure reproduced

Command:

```bash
pnpm exec vitest run __tests__/reviewer-retirement.test.ts
```

Result before the repair:

```
FAIL custom Gemini reviewer retirement > preserves historical reviewer records and shared Gemini API references
AssertionError: .docs/deep-dive/_google-gemini_gemini-skills_gemini-api-dev.md must remain available: expected false to be true
```

The expectation was stale: #1973 removed both Gemini API library identifiers from the manifest and
routing, and #1974 removed their `deep-dive` and `troubleshooting` links. The canonical
`.docs/creation` copies were the only files left and were unmanaged snapshots. They were removed in
this PR; nothing was restored or regenerated.

## Unit and repository checks

| Check | Command | Result |
| --- | --- | --- |
| Focused suites | `pnpm exec vitest run __tests__/graphics-sound-reactivity.test.js __tests__/docs-library-retirement.test.ts __tests__/reviewer-retirement.test.ts __tests__/graphics-creative-workbench.test.js` | PASS — 4 files, 44 tests after the review repairs (42 before) |
| Refresh docs | `node scripts/test-refresh-docs.js` | PASS — 48 passed, 0 failed |
| Type check | `pnpm exec tsc --noEmit` | PASS — exit 0 |
| Full suite | `pnpm run test` | PASS — recorded in the PR |
| Production build | `pnpm run build` | PASS — size recorded in the PR |

## Chromium verification — supported capture path

Tool: repository Playwright wrapper (`./scripts/playwright-cli.sh`), Chromium.
Page: `/workbench/creative` with `CREATIVE_WORKBENCH=1`, balanced tier, `golden-motes` scene.

1. Synthetic pointer gesture to unlock audio; `playCue('dockChime')` through Web Audio.
2. Wait for the cue to finish and the envelope to decay to zero.
3. `playHtml5Cue('dockChime')` — the same recording through Howler's `html5: true` path, with no
   Web Audio cue playing.

```json
{
  "webStart": { "ok": true, "cue": "dockChime" },
  "webAudio": { "level": 0.064, "available": true, "reason": null, "html5Sources": 0 },
  "silence": { "level": 0, "html5Sources": 0 },
  "html5Start": { "ok": true, "cue": "dockChime", "html5": true },
  "html5Peak": 0.065,
  "html5Captured": true,
  "html5Playing": true,
  "html5Available": true,
  "html5Last": { "level": 0.001, "bass": 0.004, "available": true, "html5Sources": 1, "html5Playing": false },
  "errors": []
}
```

The HTML5 cue alone produced a 0.065 envelope peak, the same order as the Web Audio baseline, while
`html5Sources` was 1. It played to its natural end, so playback was not cut off by capture.

## Chromium verification — analysis unavailable fallback

Same page after reload with `AudioContext.prototype.createMediaElementSource` removed. All other Web
Audio capability stayed intact, so playback was untouched.

```json
{
  "webStart": { "ok": true, "cue": "dockChime" },
  "webAudio": { "level": 0.064, "available": true },
  "silence": { "level": 0, "html5Sources": 0 },
  "html5Start": { "ok": true, "cue": "dockChime", "html5": true },
  "html5Peak": 0,
  "html5Captured": false,
  "html5Playing": true,
  "html5Available": true,
  "html5Last": { "level": 0, "html5Sources": 0, "html5Playing": false, "available": true },
  "errors": []
}
```

Without media capture the HTML5 cue still played (`html5Playing: true`) and no element was captured
(`html5Sources: 0`, peak 0). The page reported no error, and the Web Audio path continued to measure
at 0.064.

## Owner-directed review repairs

Four findings from the PR reviews were repaired without changing the approved architecture:

| Finding | Repair |
| --- | --- |
| A failed analyser connect left the element permanently marked as captured, so its analysis edge was never re-established. | The captured source is tracked even when the edge fails; `connectHtml5AnalysisEdge` retries it on every scan and after a graph rebuild, without calling `createMediaElementSource` twice. |
| Howler's `autoSuspend` could suspend the context after inactivity, silencing an element that capture had rerouted into it. | `preventCapturedCueSuspension` disables `Howler.autoSuspend` once a cue is captured (Howler's scheduled timeout re-checks the flag), and `ensureCapturedCuePlayback` resumes a suspended or interrupted context while a captured cue is playing. |
| HTML5 capture state leaked between tests, making count and de-duplication assertions order-dependent. | `resetHtml5AnalyserCapture()` clears the registry, and the HTML5 suite resets it in `beforeEach`. |
| `.freebuff/sentinel.md` still mandated the retired Gemini API source, and the retirement test skipped it. | The stale mandate was removed and the retirement test now reads every `.freebuff/*.md` file (asserting `sentinel.md` is included). |

Focused result after the repairs: `pnpm exec vitest run __tests__/graphics-sound-reactivity.test.js __tests__/docs-library-retirement.test.ts __tests__/reviewer-retirement.test.ts __tests__/graphics-creative-workbench.test.js` — 4 files, 44 tests passed.

## Visual capture

- `artifacts/195-html5-audio-reactivity/workbench-media-analysis.png` — the workbench page after the
  fallback run.
- No visitor route, artwork, layout, animation or existing cue was changed.
