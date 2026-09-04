**What:**
Fixed the four blocking issues in the recent Lucky Card Reveal implementation identified in PR #894.

**Why:**
To ensure the cinematic sequence remains highly robust and deterministic while successfully delivering the premium user experience.
1. **Audio Integration:** Replaced out-of-sync DOM timeout-based hooks with synchronized `Howler` tracking.
2. **Deterministic Arrays:** Overrode stochastic `Math.random` properties inside `particlesOptions` (`random: false`).
3. **Null-Safety:** Adjusted `outModes` on tsParticles to use `{ default: "out" }` mitigating potential undefined parameter crashes.
4. **Framer Motion Selectors:** Replaced mutable refs inside the choreography sequence (`sequence.push([cardRef.current...])`) with guaranteed robust selector strings (`sequence.push([".card-container"...])`).

**Impact:**
- No visual or UX degradation.
- Builds correctly via Next/Webpack.
- Resolves all blockers directly targeting the PR #894 request.
