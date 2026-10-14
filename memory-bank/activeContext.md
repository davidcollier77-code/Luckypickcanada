# Active Context

- **Current Goal**: Repair the Explore Your Luck golden-leaf effect and synchronize its chime without changing its working scroll behavior.
- **Latest Verified Issue**: Visual QA #384 and #387 measured zero confetti pixels. The canvas-confetti default instance uses a Blob worker, which conflicts with this site's restrictive CSP. The component now creates its own fixed overlay canvas and calls `confetti.create(canvas, { resize: true, useWorker: false })`, leaving `script-src` unchanged. The existing negative-coordinate maple SVG uses an explicit matrix derived from its viewBox to avoid the library's expensive auto-bounds scan.
- **Verified Findings**:
  - The previous component loaded the leaf bitmap on activation and used a custom bitmap shape without the transform matrix expected by the confetti renderer.
  - The previous visual test checked only that the confetti canvas existed, not that visible particles were rendered.
  - The previous chime was initialized on activation, creating avoidable module/audio loading delay. The earlier repair preloaded the Mixkit sparkle sound; the current task switches that source to the already-committed same-origin `/sounds/sparkling.wav` asset and removes the external host allowance.
- **Current Branch**: `fix/local-sparkling-confetti-audio`.
- **Additional Fixes**: The chime URL in `app/lib/magicalChimeSource.mjs` points to `/sounds/sparkling.wav`; `next.config.mjs` allows only same-origin media for this effect and no longer derives a CSP exception from an external URL. `tests/visual/homepage.spec.ts` mocks and asserts the local WAV preload. The existing dedicated main-thread confetti canvas (`useWorker: false`), maple path transform, Howler error handling, and existing interaction behavior remain unchanged.
- **Implementation Status**: The local sound integration is implemented on branch `fix/local-sparkling-confetti-audio`: the canonical chime URL now points to `/sounds/sparkling.wav`, CSP permits same-origin media only, and the homepage Playwright test expects the local asset. Visual QA run #388 and OpenNext validation run #997 passed for the earlier confetti repair, not for this current audio-source change. The local `./jules-verify.sh`, current-task Playwright/verification runs, full build-size measurement against the 495 MB cap, and audible local-file playback on an actual mobile device remain outstanding; no merge/deploy is claimed.
- **Next Steps**:
  - Run `./jules-verify.sh` in a capable local checkout and inspect its governance/typecheck/test output.
  - Measure the full build output against the 495 MB hard cap; the OpenNext worker upload was 7038.94 KiB (1422.73 KiB gzip), but that alone is not a measurement of the full output directory.
  - Run current-task Playwright tests and `./jules-verify.sh` in GitHub Actions or a capable checkout; inspect results before claiming verification.
  - Measure full build output against the 495 MB hard cap.
  - Verify audible local WAV chime timing and visible leaves on a real mobile browser. CI's silent WAV fixture deliberately validates interaction and rendering independently from actual audio playback.
