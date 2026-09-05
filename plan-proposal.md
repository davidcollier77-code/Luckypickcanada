Here is the complete $0 cost SFX integration plan for BOTH the Lucky Card Reveal and Lucky Meter. All sounds come from the preferred Kenney CC0 libraries, ensuring high-quality, royalty-free audio suitable for commercial use.

### 1. Recommended Sounds & Integration

#### Lucky Card Reveal (`app/lucky-card-reveal.js`)
*   **Initial Button Interaction:** `ui-audio/Audio/click1.ogg` (Crisp, premium interface click)
*   **Suspense/Build-up:** `digital-audio/Audio/powerUp2.ogg` (Mystical rising energy tone)
*   **Card Flip/Reveal Impact:** `digital-audio/Audio/phaseJump1.ogg` (Energetic, magical whoosh/impact)
*   **Magical Energy/Shimmer (Looping during reveal):** `digital-audio/Audio/tone1.ogg` (Subtle, hovering digital resonance)
*   **Special/Rare/High-Luck Celebration:** `digital-audio/Audio/powerUp1.ogg` (Rewarding, casino-inspired magical chime)

#### Lucky Meter (`components/LuckyGenerator.tsx` & `components/LuckyMeterButton.tsx`)
*   **Button Activation:** `interface-sounds/Audio/click_002.ogg` (Solid, satisfying mechanical click)
*   **Meter Activation & Vortex Buildup:** `digital-audio/Audio/phaserUp4.ogg` (Building, cosmic energy charge)
*   **Percentage Progression/LED Flickers:** `ui-audio/Audio/switch15.ogg` (Rapid, subtle digital ticking/switching)
*   **Final Percentage Reveal / Impact:** `interface-sounds/Audio/confirmation_002.ogg` (Solid, rewarding confirmation chime)
*   **High-Luck Result / Aurora Energy:** `digital-audio/Audio/powerUp12.ogg` (Ethereal, magical success tone)

### 2. Sources & Licensing
*   **Source:** Kenney (kenney.nl) - `ui-audio`, `interface-sounds`, `digital-audio`
*   **License:** Creative Commons Zero (CC0)
*   **Cost:** $0
*   **Attribution:** CC0 does not require attribution, but I will create a `public/sounds/CREDITS.md` file to document the sources and licenses for good repository hygiene.

### 3. Repository Location
All selected `.ogg` files will be copied to `public/sounds/` with clear, descriptive filenames (e.g., `public/sounds/card-flip.ogg`, `public/sounds/meter-buildup.ogg`). I will ensure no unused or duplicate audio files are left in the repository.

### 4. Required Code Changes
*   **`app/lucky-card-reveal.js`:** Update the existing audio loading state and playback helpers to use the new local files instead of the current placeholders. Ensure the timing of `playAudio()` calls aligns with the visual `tReveal` and `impact` milestones.
*   **`components/LuckyGenerator.tsx` (DailyResonance/Lucky Meter):** Replace the current external URLs (`/dragon-studio-whoosh...`, etc.) with the new local paths. Update the Web Audio API buffer loading and playback logic.
*   **`components/LuckyMeterButton.tsx`:** Replace the silent base64 fallback and external URL with the local button activation sound.
*   **General:** Add robust error handling for audio context resumption (requiring user interaction) to ensure mobile/Safari compatibility.

### 5. Potential Concerns & Mitigations
*   **Browser Compatibility (.ogg vs .mp3/.wav):** `.ogg` is widely supported in modern browsers, but if we need absolute maximum compatibility (e.g., older Safari), I can use FFmpeg (if available in the environment) to convert these CC0 `.ogg` files to `.mp3` or `.m4a` before finalizing. *I recommend proceeding with `.ogg` first as it's standard for Web Audio API.*
*   **Audio Spacing/Annoyance:** I will ensure rapid events (like the percentage ticking) are low volume and don't overwhelm the user.

**WAITING FOR APPROVAL:** Please review this plan. Let me know if you approve these sound selections and the integration approach, or if you'd like me to select different types of sounds for specific events. Once approved, I will immediately execute the file copies and code changes.
