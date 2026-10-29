# Tasks

- [ ] 1. Fix Story Card Clipping
  - [ ] Modify `themes/default/map.css` `.map-province-details` rule.
  - [ ] Update `@keyframes province-details-reveal`.
- [ ] 2. Implement Database Persistence for Reactions
  - [ ] Update `create-database-schema.sql`.
  - [ ] Update `app/lib/db-init.js` to create `lucky_story_reactions` table.
  - [ ] Update `app/lucky-stories.js` to fetch reaction counts.
  - [ ] Add `addStoryReaction` function in `app/lucky-stories.js`.
- [ ] 3. Create Reaction API Endpoint
  - [ ] Create `app/api/lucky-stories/react/route.js`.
  - [ ] Integrate IP extraction and rate limiting.
- [ ] 4. Update Frontend React Component
  - [ ] Update `app/lucky-map-of-canada/lucky-map-of-canada.js` `reactToStory`.
  - [ ] Use `localStorage` for visual state.
  - [ ] Fix timeframe statistics inconsistency.
- [ ] 5. Write Tests and Verify
  - [ ] Run unit tests and playwright.
  - [ ] Run `./jules-verify.sh`.
