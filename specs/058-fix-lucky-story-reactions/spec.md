# Spec: Fix Lucky Story Card Clipping and Implement Persistent Celebrate Tallies

## Objective
Correct the confirmed Lucky Story card overflow defect and replace the temporary client-side Celebrate counter with a persistent, database-backed reaction system.

## Requirements
1. **Fix Story-Card Clipping**:
   - Remove the `max-height: 36rem` restriction and `overflow: hidden` from `.map-province-details` in `themes/default/map.css`.
   - Preserve existing reveal effect.
   - Ensure all three controls remain reachable: "Share This Story", "Celebrate (count)", "← Back to Lucky Story Map".
   - Ensure a 600-character story displays fully without clipping.

2. **Implement Persistent Celebrate Tallies**:
   - Create a new `lucky_story_reactions` table in Neon PostgreSQL to store individual reactions.
   - Associate reactions with a story ID and an anonymous first-party browser identifier (hashed/protected IP).
   - Use server-side uniqueness constraint and atomic DB operations to prevent duplicate reactions from the same browser/device.
   - Create a new API endpoint (e.g., `POST /api/lucky-stories/react`) to handle reaction requests safely.
   - Return clear server responses indicating success or failure.
   - Update `getLuckyStoryMap` to return the total count of reactions for each story.
   - Show accurate count in the story interface, reflecting the persisted count.
   - Provide visual feedback for already-celebrated stories.
   - Ensure caching (`LUCKYPICK_KV`) handles reaction counts properly without becoming stale incorrectly (e.g., invalidate cache on reaction).

3. **Preserve Existing Design & Functionality**:
   - Do NOT redesign or add unnecessary animations.
   - Keep existing map artwork, Turnstile, spam protection, and responsive layouts.

4. **Correct Timeframe Statistics Inconsistency**:
   - Update the statistics mapping in `LuckyMapOfCanada` to ensure "Total lucky stories shared" and "Provinces with lucky moments" match the currently selected timeframe (all-time or last 24 hours), consistent with "Mapped story markers".

5. **Testing & Governance**:
   - Write/update regression tests for story card layout and persistent reaction API.
   - Verify visually via Playwright or manual checks.
   - Follow Spec Kit workflow and run `./jules-verify.sh`.
