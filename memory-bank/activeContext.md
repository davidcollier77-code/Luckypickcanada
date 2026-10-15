# Active Context

- **Current Goal**: Correct the Crystal Ball illustration after merged PR #1484 used console-style Lucky Meter artwork instead of the supplied target.
- **Current Branch**: `fix/crystal-ball-reference-artwork`.
- **Verified Root Cause**: `app/components/CrystalBall/CrystalBall.tsx` directly loaded `/assets/crystal-ball-pedestal.avif` (WebP/PNG fallbacks) as the primary artwork. The prior visual test checked load/dimensions but not the depicted design.
- **Current Change**: Replace the console image with a transparent SVG foreground showing a reflective cosmic orb, ruby maple leaf, emerald clover, sapphire drop, and ornate gold-and-obsidian pedestal.
- **Scope Boundaries**: Keep the Milky Way background, fortune flow, audio, navigation, APIs, payments, deployment settings, and unrelated assets unchanged.
- **Verification Status**: Source edits and updated test expectations are prepared on this branch. Browser execution, the full test suite, build, `./jules-verify.sh`, desktop/mobile visual comparison, and 495 MB build-size measurement remain outstanding until CI/runtime evidence is available.
