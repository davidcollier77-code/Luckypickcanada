# Quickstart: Explore Your Luck Effect Repair

1. Install using the repository's configured package manager: `pnpm install --frozen-lockfile`.
2. Run the focused visual test with repository Playwright configuration: `pnpm exec playwright test tests/visual/homepage.spec.ts`.
3. Confirm the test sees rendered alpha pixels in the confetti canvas and sees the chime asset request before activation.
4. Confirm scrolling still reaches `#play-explore`, the 15-second cooldown blocks repeated activations, and keyboard interruption cancels the scroll.
5. Run `./jules-verify.sh`. Measure the actual build output and stop if it reaches 495 MB.
6. On a real mobile browser, tap Explore Your Luck and verify visible gold maple leaves and the short chime start together without a late sound after scrolling.
