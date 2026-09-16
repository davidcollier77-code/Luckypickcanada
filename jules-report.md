A — VERIFIED ANALYSIS

1.  **Verified Facts:**
    *   `app/lucky-card-reveal.js` enforced a strict 12.0s maximum lifetime `if (elapsed < 12.0)` on `requestAnimationFrame`, causing the canvas to abruptly unmount before the `flagship` tier (which takes 8.0s to finish striking and ~2s to fade) could organically complete.
    *   `components/DailyResonance.tsx` enforced termination of the cinematic when `particles.length === 0 && meteors.length === 0 && lightningStrikes.length === 0`. However, it did not check for active `rockets` in flight, which caused the loop to exit and cleanly cut off before the White Willow could develop.
    *   `components/DailyResonance.tsx` reused a single `impactFireworks` audio file for all initial bursts, manipulating only the rate and volume. It also explicitly called `.stop()` on all audio instances during cleanup, killing valid sound tails.
    *   `components/TwinklingStars.tsx` attempted to restrain stars to the sky using a hardcoded `Math.random() * (height * 0.55)`. Since aspect ratios vary heavily between desktop and mobile, this caused stars to occasionally paint over the horizon.

2.  **Assumptions vs. Facts:**
    *   *Assumption:* The White Willow firework was already completely finished when the `DailyResonance.tsx` sequence ended.
    *   *Fact:* The sequence aborted midway while `rockets` were still flying because `rockets` weren't included in the termination clause.

B — BOUNDARIES AND PLAN

1.  **Approved Scope:**
    *   Correct the overall completion/termination condition for both `DailyResonance.tsx` and `app/lucky-card-reveal.js` to rely on actual effect completion.
    *   Differentiate the audio of standard fireworks by incorporating a separate existing asset `mixkit-magical-impact.mp3`.
    *   Allow audio instances (including `willowCrackle`) to decay organically without artificial `.stop()` calls during unmount.
    *   Enforce a CSS mask to strictly confine `TwinklingStars` to the upper sky above the horizon.

2.  **Protected Areas:**
    *   No structural component refactors or CSS redesigns. All core `gsap` sequencing and core Framer Motion timings remained identical. No state logic altered except what directly controls cinematic tail rendering.

C — EXECUTION, VERIFICATION, AND FINAL STATE

1.  **Execution & Changed Files:**
    *   `components/DailyResonance.tsx`: Appended `&& rockets.length === 0` to the frame loop termination check to prevent premature visual halting.
    *   `components/DailyResonance.tsx`: Integrated `fireworkBurstAlt` (`mixkit-magical-impact.mp3`) as a discrete Howl instance. It now triggers distinct playback (via `soundObj.play()` ID references) for 'strobe' fireworks, while 'peony' utilizes the original `fireworkBurst`.
    *   `components/DailyResonance.tsx`: Eliminated explicit `.stop()` calls during canvas cleanup, permitting Howler.js to manage natural decay and organic overlap.
    *   `app/lucky-card-reveal.js`: Dropped the rigid `12.0s` timeout. Adopted a dynamic `maxLifetime` derived directly from `STRIKE_SCHEDULES` (final strike time + 3.0s decay buffer).
    *   `components/TwinklingStars.tsx`: Altered the y-generation logic to utilize full height, and applied a robust CSS `maskImage: linear-gradient(to bottom, black 30%, transparent 50%)` to smoothly and accurately truncate stars before the landscape horizon.
    *   `memory-bank/activeContext.md`, `memory-bank/progress.md`: Updated to mirror milestones.

2.  **Verification:**
    *   Ran `./jules-verify.sh`.
    *   Type checking passed (`pnpm build`).
    *   Documentation tests passed (`17 passed, 0 failed`).
    *   Git diff review confirmed changes remained exactly within the specified functional bounds.

Exact source/path| Consulted| Useful| Used/Applied| Contribution
--|--|--|--|--
AGENTS.md| Yes| Yes| Yes| Followed instructions mapping repository facts, respecting constraints and verification procedures.
.jules/jules.md| Yes| Yes| Yes| Used for standard behavioral guidelines and structure.
memory-bank/*| Yes| Yes| Yes| Ensured no historical drift and properly updated `activeContext.md` and `progress.md`.
