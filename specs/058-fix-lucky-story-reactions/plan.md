# Plan: Fix Lucky Story Card Clipping and Implement Persistent Celebrate Tallies

1. **Fix Story Card Clipping (`themes/default/map.css`)**
   - Locate `.map-province-details`.
   - Remove `max-height: 36rem` and `overflow: hidden`.
   - Update `@keyframes province-details-reveal` to animate appropriately without relying on a fixed `max-height` (e.g., animate `opacity` and `transform: translateY`).

2. **Database Schema (`create-database-schema.sql` and `app/lib/db-init.js`)**
   - Add `lucky_story_reactions` table creation.
   - Columns: `id`, `story_id`, `client_hash`, `created_at`.
   - Unique constraint on `(story_id, client_hash)` to prevent duplicate reactions from the same identifier.
   - Add foreign key `story_id` referencing `lucky_stories(id)` with `ON DELETE CASCADE`.

3. **Backend API Logic (`app/lucky-stories.js`)**
   - Create `reactToStory(storyId, clientIp)` function to insert into `lucky_story_reactions` and invalidate the map cache.
   - Hash `clientIp` (e.g., using `crypto.createHash('sha256')`) for privacy.
   - Update `getLuckyStoryMap()` query to LEFT JOIN `lucky_story_reactions` and group by story to get a `reaction_count`. Alternatively, do a correlated subquery for count.
   - Also return an array or map indicating if the current user (if IP available) has already reacted to specific stories (optional, but requested visual indication is needed). Note: Next.js server actions / API routes can handle IP. Wait, the `getLuckyStoryMap` is called server-side and client-side (via API route). We can just return total counts, and maybe check client-side via local storage for the *immediate* visual feedback of "already celebrated", OR we pass the IP hash to `getLuckyStoryMap` to return a `hasReacted` boolean per story. Passing the IP hash is more robust.

4. **API Route for Reactions (`app/api/lucky-stories/react/route.js`)**
   - Create a POST route handling `{ storyId }`.
   - Extract client IP via `getClientIp(request)`.
   - Call `reactToStory`.
   - Handle rate limiting and spam protection using existing utilities in `app/spam-protection.js` (`checkApiRateLimit`).

5. **Update API Route `GET` (`app/api/lucky-stories/route.js`)**
   - Pass client IP hash to `getLuckyStoryMap` if we decide to include `hasReacted` from the server.
   - Wait, `getLuckyStoryMap` is cached globally via KV (`LUCKYPICK_KV`). We shouldn't cache per-user IP in KV.
   - Best approach: KV caches the total `reaction_count` per story.
   - The client uses `localStorage` to track which stories it has celebrated to provide the visual indication ("Already celebrated"), matching standard anonymous interaction patterns without destroying global cacheability.

6. **Frontend Changes (`app/lucky-map-of-canada/lucky-map-of-canada.js`)**
   - Update `reactToStory` function to send a `POST` to `/api/lucky-stories/react`.
   - Upon success, update the local reaction state.
   - Read from `localStorage` on mount to initialize the `reactedStories` state for visual indication.
   - Update the UI button: disabled if already celebrated, show "Celebrated" text/icon, update count.
   - Fix the statistic inconsistency: Update `totalStories` and `provincesWithStories` passed to the statistic cards to be based on `stories.length` (the filtered list) when `timeframeFilter` is '24h', or accurately label them as "Total (All-time)". The request says: "Either accurately label the first two statistics as all-time totals or make the statistics use the same selected timeframe. Choose the smallest change that avoids misleading visitors." We'll update the labels to clarify they are "All-Time" totals, which is the smallest, most truthful change.

7. **Testing (`tests/lucky-stories.test.js` or similar)**
   - Add unit/integration tests for the new DB schema, `reactToStory` DB function, and the route.
   - Verify layout visually using Playwright if possible, or verify CSS structurally.
