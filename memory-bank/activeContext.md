# Active Context

- **Current Goal**: Repair the Explore Your Luck golden-leaf effect and synchronize its chime without changing its working scroll behavior.
- **Verified Findings**:
  - The previous component loaded the leaf bitmap on activation and used a custom bitmap shape without the transform matrix expected by the confetti renderer.
  - The previous visual test checked only that the confetti canvas existed, not that visible particles were rendered.
  - The chime was initialized on activation, creating avoidable module/audio loading delay.
- **Current Branch**: `018-explore-luck-effect-repair`.
- **Implementation Status**: The branch contains a path-based leaf shape, an increased burst, chime preload/synchronous-play handling, and stronger visual assertions. The repair is not complete until Playwright, repository verification, CI and real mobile behavior are checked.
- **Next Steps**:
  - Run focused Playwright tests and `./jules-verify.sh` in a capable checkout.
  - Inspect CI statuses, final diff and measured build size.
  - Verify visible leaves and chime timing in a real mobile browser.
