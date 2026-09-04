@jules Audit and repair the Lucky Card reveal — both the audio and visual experience — and bring the entire reveal to a polished, cinematic, premium level.

MCP REQUIREMENT — ALL THREE MUST ACTUALLY BE USED

You have three connected MCPs/tools available to you.

You MUST actually call and use ALL THREE during this task.

Do not merely connect them.
Do not merely mention them.
Do not make token calls just to satisfy the requirement.

Use each MCP meaningfully for the part of the investigation where it provides the most value.

For this task, Context7 should be the primary MCP for understanding and validating the code libraries involved in the reveal.

Use the MCPs intelligently according to their strengths:

- Context7: library/API/documentation intelligence and validation. This is especially important for the animation, timing, rendering, audio, and framework libraries used by the reveal.
- Stitch: visual/design inspection and validation of the cinematic reveal experience.
- The third connected MCP: use it for the part of the implementation it is actually best suited to. If it is Neon, use it only where backend/data verification is relevant rather than forcing Neon into the animation work.

At the end, explicitly verify that all three MCPs were actually called and used, and explain briefly what each contributed.

---

CONTEXT7 — LIBRARY INTELLIGENCE

Before modifying the reveal, inspect the actual implementation and determine every important library, package, API, and framework that materially controls the Lucky Card reveal.

Do not rely on remembered APIs or assumptions.

Use Context7 to understand the actual libraries being used.

First identify the installed versions from the repository/package configuration.

Then, for each important library involved:

1. Resolve the correct library in Context7.
2. Prefer the exact installed version when version-specific documentation is available.
3. Retrieve focused documentation for the specific functionality being used.
4. Use that documentation to validate the implementation before changing it.

Do not use Context7 generically.

Ask targeted questions based on the actual implementation, including where appropriate:

- How should this animation sequence be synchronized?
- What is the correct animation-control/sequencing API for this installed version?
- What is the correct React lifecycle and cleanup pattern?
- What is the correct Web Audio API scheduling approach?
- How should "AudioContext.currentTime" be coordinated with animation timing?
- What is the correct "requestAnimationFrame" timing behavior?
- What cleanup is required when the component unmounts or the reveal is interrupted?
- Are there performance considerations for the Canvas/rendering approach being used?
- Are there version-specific APIs or changes that affect the current implementation?

If Context7 cannot resolve a particular library, do not pretend it did. Use the library's authoritative documentation/source instead and clearly note that Context7 did not have a suitable entry.

The goal is to quickly build an accurate understanding of the actual libraries and versions used by this project before repairing the reveal.

At the end, identify:

- important libraries discovered
- installed versions
- which libraries were resolved through Context7
- which documentation was retrieved
- what implementation decisions were influenced by that documentation

---

VISUAL REVEAL AUDIT

Audit the entire Lucky Card reveal from the moment it starts through the completed card flip/reveal.

Make the experience feel:

- cinematic
- magical
- premium
- exciting
- polished
- intentional

Pay particular attention to:

- card movement
- card shake
- pulse/strike impacts
- energy beams
- aura/bloom
- particles
- lighting
- buildup
- escalation
- timing
- final strike
- card flip
- reveal transition
- post-reveal shimmer

The card must visibly react when the energy strikes hit it.

It should NOT feel static or barely move.

The strikes should feel like they are physically impacting the card.

The sequence should progressively build anticipation toward the final strike.

The final strike should clearly be the strongest visual moment before the card flips.

Do not allow effects to overwhelm the actual card.

---

AUDIO + VISUAL SYNCHRONIZATION

This is extremely important.

The audio and visual reveal must behave as one synchronized event.

Every meaningful visual pulse/strike that actually hits the card must have a corresponding audio impact.

Do NOT create visual strikes without corresponding sounds.

For every pulse/strike, add a short, subtle explosion-like magical impact sound precisely when the strike hits the card.

Think:

energy impact + tiny magical burst + physical hit

—not a huge repetitive explosion.

The sound should make the card feel like it was physically struck by magical energy.

Use the sound resources/libraries that are actually available to the project.

Inspect the repository and existing dependencies/assets to determine what audio resources are already available before introducing anything unnecessary.

Where appropriate, layer complementary sounds such as:

- sharp impact/transient
- magical burst
- subtle energy crack
- restrained low-end/sub-bass hit
- short whoosh

Do not simply play the exact same sound identically for every strike.

Subtly vary or scale the impacts so the sequence builds naturally.

The intensity should increase as the reveal progresses.

The final strike should have the strongest and most satisfying audio impact.

The audio should never feel disconnected from what the viewer sees.

---

TIMING

Audit the complete reveal timeline.

Make sure:

- every visual strike has its corresponding audio impact
- impacts occur at the exact visual hit
- strike spacing feels intentional
- the buildup progressively increases
- the final strike is the climax
- the strongest impact happens immediately before the flip
- pre-flip sounds stop/transition cleanly
- audio does not bleed improperly into the card flip
- post-flip shimmer/reveal audio is separated appropriately
- the reveal cannot drift out of synchronization

Pay special attention to differences between:

"requestAnimationFrame" timestamps

and

"AudioContext.currentTime"

Make sure the implementation does not mix milliseconds and seconds incorrectly.

Use Context7 to validate the correct timing/scheduling approach for the actual libraries/APIs used.

---

CINEMATIC SEQUENCE

The finished reveal should feel like:

Strike → card reacts → magical impact sound → energy builds → stronger strike → stronger impact → escalating tension → final massive strike → clean card flip → reveal

Every part should support the next.

There should be a clear sense of escalation rather than a collection of unrelated effects.

---

TIERS

Review Standard, Premium, and Flagship behavior.

Make sure the tiers still feel meaningfully different while preserving the synchronized strike/audio system.

The higher tiers should be able to feel more spectacular without creating unnecessary performance problems.

---

MOBILE + PERFORMANCE

Audit mobile behavior carefully.

Optimize intelligently for:

- Canvas rendering
- particle counts
- aura sizes
- animation complexity
- audio processing
- overdraw
- memory usage
- frame rate

Do not destroy the cinematic quality simply to optimize.

Preserve the intended visual impact while eliminating unnecessary performance costs.

---

EXISTING FUNCTIONALITY

Preserve anything that is already working correctly.

Do not introduce unrelated changes.

Do NOT modify:

- Stripe/payments
- database functionality unless genuinely required for verification
- unrelated APIs
- email
- authentication
- environment variables
- Cloudflare configuration
- unrelated site functionality

Keep the repair focused on the Lucky Card reveal.

---

FINAL VERIFICATION

After making the repairs, thoroughly double-check the finished implementation.

Re-audit:

- visual timing
- card movement
- card shake
- strike sequence
- beams
- aura
- particles
- audio timing
- impact sounds
- audio/visual synchronization
- final strike
- card flip
- post-flip transition
- mobile performance
- cleanup
- library/API correctness

Most importantly, verify that every visual strike that hits the card has a corresponding synchronized audio impact.

Also verify that ALL THREE MCPs were actually called and meaningfully used.

Do not simply report that they were available.

Actually use them, then confirm what each one contributed.

Before submitting the finished work, thoroughly double-check the implementation for regressions, timing problems, synchronization issues, and unnecessary changes.
