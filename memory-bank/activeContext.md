# Active Context

## 2026-09-25 — Lucky Card Reveal Web Audio Implementation (Standard Tier)

- Branch: `fix/lucky-card-audio-runtime`
- Verified defect: The Standard tier reveal audio sequence was relying on `setTimeout` to schedule Howler.js triggers, which can desynchronize with `requestAnimationFrame` visuals and suffer from mobile browser AudioContext suspension blocks.
- Action: Implemented deterministic Web Audio scheduling specifically for the Standard tier:
  - Fetched and cached array buffers in `useEffect` on mount.
  - Initialized and unlocked `AudioContext` immediately upon user interaction in `triggerCardDraw`.
  - Replaced imprecise `setTimeout` callbacks with deterministic `AudioBufferSourceNode.start(audioCtxRef.current.currentTime + delay)`.
  - Used `GainNode` automation for volume and fading (e.g. `linearRampToValueAtTime`) rather than relying on Howler `fade()` callbacks for the Standard tier.
  - Premium and Flagship tiers retain the original Howler implementation unchanged as required by bounds.
- Checked build size: 293 MB (well under the 495 MB cap).
- Passed standard tests (`pnpm test` and `pnpm run build`).
