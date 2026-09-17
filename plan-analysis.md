A — VERIFIED ANALYSIS

1.  **Verified Facts:**
    *   **Button Latency:** `soundsRef.current.uiClick.play()` triggers immediately on button press, but the cinematic `buildup` sound is delayed by exactly `150ms`. The visual percentage buildup starts at 1.5s into the timeline. The "pause after the click" is governed by this `150ms` delay on the `buildup` audio and the `1.5s` delay before the percentage climb starts (`tl.to(proxy, ... 1.5)`).
    *   **"impactMeteor" Reuse:** The `impactMeteor` sound currently points to `/sounds/mixkit-cinematic-whoosh.mp3`. It is only used in the `Meteor Shower` tier logic (`spawnMeteor` loops). Previous fixes mapped fireworks to `fireworkLaunch`, so `impactMeteor` is no longer reused for fireworks in this file. (Verified by grepping for `impactMeteor` and `fireworkLaunch`).
    *   **Meteor Timing:** Current meteor spawn timings are `200ms`, `800ms`, `1600ms`, `2200ms`, `3200ms`. The first meteor at `200ms` is very close to the reveal transition (which happens at `0ms` relative to the canvas loop start). The spacing is tight and could cause audio mud with a heavier sound.
    *   **Meteor Audio Asset:** The current asset (`mixkit-cinematic-whoosh.mp3`) is described as a "generic whoosh" by the prompt and needs replacing with a heavier atmospheric entry sound. I need authorization to source/fetch this asset or use an existing one if provided. Looking at existing files, there isn't a dedicated "atmospheric tearing" sound. I will need to procure one from a CC0 source (like Pixabay/Freesound) using bash, but I will await confirmation.

2.  **Assumptions vs. Facts:**
    *   *Assumption:* The `150ms` delay is the cause of the perceived latency.
    *   *Fact:* While 150ms is a delay, the visual "generator/rev" (aurora phase 'awaken') starts immediately at `0ms` on the timeline. If the click feels separated from the rev, it's because the click is instant but the rev sound is 150ms late. Reducing this to ~50-80ms will tighten the feeling without overlapping transients.
    *   *Fact:* `tierAudioKey` is set but never actually used to play sound in the GSAP timeline. All impact sounds are triggered directly inside the `requestAnimationFrame` loop (`animateCanvas`).

B — BOUNDARIES AND PLAN

1.  **Approved Scope:**
    *   Reduce the `buildup` audio delay from `150ms` to `75ms` to tighten the separation between the physical click and the generator rev, making it "very, very brief" without layering them simultaneously.
    *   Procure and replace the meteor sound with a heavy atmospheric entry sound (e.g., from Pixabay/Freesound CC0). I will use `wget` to pull a specific CC0 "meteor strike / atmospheric tearing" sound into `public/sounds/` and update `DailyResonance.tsx` to use it. (e.g., `meteor-atmospheric-entry.mp3`).
    *   Adjust meteor spawn timings in `DailyResonance.tsx` to: `400ms`, `1400ms`, `2600ms`, `3600ms`, `4800ms`. This pushes the first meteor back slightly to follow the reveal transition naturally and adds deliberate breathing room between subsequent meteors.
    *   Use Howler's instance manipulation (already present: `soundObj.rate()`, `soundObj.volume()`) combined with the new asset to ensure controlled decay.
    *   Remove unused `tierAudioKey` logic from the GSAP setup, as audio is now handled entirely in the canvas render loop.

2.  **Protected Areas:**
    *   Do not touch Lightning or Fireworks timing/assets.
    *   Do not change the 3-tier percentage thresholds (`<=35`, `<=74`, `>74`).
    *   Preserve existing GSAP visual timing (`1.5s` gather, `1.5s` climb, `4.5s` hover, `7.5s` reveal).

🔴 STOP HERE AND WAIT FOR MY EXPLICIT APPROVAL BEFORE EXECUTING THE PLAN.
