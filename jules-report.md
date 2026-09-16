A — VERIFIED ANALYSIS
- **Verified Facts:** The current `DailyResonance.tsx` animation loop enforced an absolute hard stop at 5.5 seconds (`const isHardStop = elapsedMs > 5500;`). This prematurely terminated visual and audio effects for long-running animations like the White Willow firework, even while its particles were still actively decaying on screen. The proper completion condition (`particles.length === 0 && meteors.length === 0 && lightningStrikes.length === 0`) was present but overridden by the fixed timeout. Additionally, the White Willow effect reused the standard `fireworkBurst` and a generic `mixkit-magic-sparkles.mp3` loop for crackle, violating the requirement for a distinct White Willow audio identity.
- **Guidance Applied:** I read `AGENTS.md`, `.jules/jules.md`, and `.jules/audio.md`. I adhered to the rules forbidding arbitrary refactoring, ensuring only targeted changes were made while maintaining `Howler.js` integrations, design structure, and accessibility fallbacks.
- **Files Inspected:** `components/DailyResonance.tsx`, `memory-bank/projectBrief.md`, `memory-bank/activeContext.md`.

B — BOUNDARIES AND PLAN
- **Scope:** Remove the arbitrary 5.5-second hard stop in the canvas animation loop and ensure effect completion relies solely on all visual elements successfully terminating (empty particle/meteor tracking arrays).
- **Audio Scope:** Acquire a distinct "crackle" sound (licensed under standard free/commercial terms), integrate it exclusively for the White Willow tier, and synchronize its audio decay directly with the visual opacity decay of the White Willow particles.
- **Protected Areas:** Maintained existing Howler.js structure, `prefers-reduced-motion` fallbacks, ordinary firework audio mapping, and untouched documentation refresh systems.
- **Authorizations:** Executed under explicit user authorization received after the initial analysis phase.

C — EXECUTE, VERIFY, AND FINAL STATE
- **Execution:**
  - Acquired `mixkit-firework-crackle.mp3` from Mixkit (Sound Effects Free License - commercial use allowed).
  - Wired `willowCrackle` into `DailyResonance.tsx` alongside `fireworkBurst` in the `soundsRef` Hook.
  - Modulated `willowCrackle`'s volume proportionally against the `p.opacity` value of the remaining `willow` particles, ensuring the crackle naturally fades alongside the visual effect.
  - Replaced the arbitrary `isHardStop` with a clean exit relying on `(particles.length === 0 && meteors.length === 0 && lightningStrikes.length === 0)`.
- **Files Changed:** `components/DailyResonance.tsx`, `memory-bank/activeContext.md`, `memory-bank/progress.md`, `public/sounds/mixkit-firework-crackle.mp3`.
- **Verification:** Ran `./jules-verify.sh`, `pnpm run build`, and `pnpm test`. All verification phases passed (TypeScript, NextJS build, tests).
- **Final State:** The White Willow firework now plays a distinct crackle effect that naturally fades out synchronously with the particle visuals, and no cinematic effect is interrupted by premature timers.

| Exact source/path | Consulted | Useful | Used/Applied | Contribution |
| :--- | :--- | :--- | :--- | :--- |
| `AGENTS.md` | Yes | Yes | Yes | Provided governance over repository workflow, task routing, and boundaries. |
| `.jules/jules.md` | Yes | Yes | Yes | Explicitly required initialization and verification workflows. |
| `.jules/audio.md` | Yes | Yes | Yes | Confirmed `Howler.js` is the primary playback target and public MP3s must be licensed. |
| `/goldfire/howler.js` | Yes | Yes | Yes | Confirmed Howler usage syntax and standard implementation methods via local usage patterns. |
