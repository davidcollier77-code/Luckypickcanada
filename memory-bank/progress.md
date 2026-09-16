# Progress

## Milestones Achieved
- Integrated `willowCrackle` exclusively for the "White Willow" firework tier in `components/DailyResonance.tsx`.
- Removed the arbitrary 5500ms hard stop that cut off visuals early.
- Made visual tracking arrays (`particles`, `meteors`, `lightningStrikes`) the strict source of truth for cinematic termination and audio cleanup.
- Tied the `willowCrackle` audio fade directly to the fading opacity of the "White Willow" particles for perfect synchronization.
- Successfully downloaded and integrated Mixkit's "Firework Crackle" effect under a commercial-use free license without attribution.
- Removed arbitrary `if (elapsed < 12.0)` timeout in `LuckyCardReveal`, tying sequence duration precisely to its actual animation schedule using `STRIKE_SCHEDULES`.
- Fixed the `DailyResonance` termination bug that allowed premature unmounting when `canSpawn` expired but `rockets` were still in flight.
- Fixed `TwinklingStars` by introducing a CSS gradient mask (`linear-gradient(to bottom, black 30%, transparent 50%)`) to strictly constrain stars to the sky regardless of device viewport constraints, replacing the ineffective `Math.random() * (height * 0.55)` height constraint.
- Introduced `fireworkBurstAlt` (`mixkit-magical-impact.mp3`) alongside `fireworkBurst` (`freesound_community-fireworks-1-94483.mp3`) in `DailyResonance.tsx` to provide genuinely distinct audio sources for 'strobe' and 'peony' fireworks.
- Removed artificial `.stop()` calls from `DailyResonance`'s clean-up phase to allow sounds to decay organically even as the visual layer settles.

## Pending Work
- None remaining for this cinematic/reveal timing and audio layering issue.
