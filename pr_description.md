Fix visual and audio lifecycle synchronization in Lucky Card reveal.

As per `AGENTS.md` and repository guidelines, investigated the lifecycle synchronization between the visual canvas and audio paths in `app/lucky-card-reveal.js`. Diagnosed that a premature 700ms `setTimeout` was triggering `setIsGenerating(false)`, which caused the foreground and background canvas layers to unmount while audio paths running on independent Howler.js timeouts continued.

The fix expands the unmount safety release timeout from 700ms to 2500ms, effectively covering the 3.0-second `maxLifetime` post-flip animation padding, ensuring that visuals and audio correctly complete their sequence together.

- Investigated visual and audio lifecycle
- Adjusted unmount timeout from 700ms to 2500ms
- Preserved existing animation timing, layout, and visual/audio assets
- No new dependencies added
- Verified syntactical accuracy and tests passed (`pnpm run build` and `./jules-verify.sh`)
