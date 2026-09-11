1.  **Analyze Request**:
    - The task is to update the Lucky Card Reveal audio with a dedicated, cinematic sound palette using real audio assets instead of ZZFX or synthetic ones.
    - We MUST NOT modify the Lucky Meter in any way.
    - We have to use CC0/public domain sounds (Mixkit).

2.  **Implementation Steps**:
    - Download 4 cinematic sounds from Mixkit (buildup, whoosh/impact, magical impact, sparkles) into `public/sounds`.
    - Update `components/LuckyGenerator.tsx` to reference these new audio files (`METEOR_SOUNDS`, `LIGHTNING_SOUNDS`, `FIREWORKS_SOUNDS`, `BUILDUP_SOUND`).
    - Update `app/lucky-card-reveal.js` to reference the same new audio files.
    - Verify that `components/DailyResonance.tsx` (the Lucky Meter) has not been changed (retains original Howler paths).

3.  **Testing/Verification**:
    - Build the project (`pnpm run build`).
    - Verify that the Lucky Card Reveal component references the new audio files, while the Lucky Meter retains the old ones.

4.  **Pre-commit steps**:
    - Complete pre commit steps to make sure proper testing, verifications, reviews and reflections are done.
