# Tasks: Modernize Lucky Card Reveal

1. **Verify Baseline & Create Task Branch**: Confirm everything is operational before making any changes. (Already mostly done via reading, but will do visual verification conceptually).
2. **Update Typography & Layout in RevealClient**: Adjust `app/reveal/RevealClient.tsx` headings to have a more cinematic, polished look.
3. **Refine Buttons & Controls in lucky-card-reveal**:
   - Update the "Reveal Today's Luck" button for a premium look (better gradients, glow, hover states).
   - Update the "Return to Home" link styling to be a cohesive secondary action.
   - Refine the Quote container (glassmorphism, better typography).
4. **Refine Collection Binder Trigger**: Update the trigger button in `app/collection-binder.js` to match the premium aesthetic.
5. **Refine Share Button**: Update `app/lucky-card-share.js` and associated CSS (`themes/default/homepage.css`) to use premium button styles.
6. **Verify Audio/Visual Sync**: Test the reveal locally to ensure the card flip and particle effects remain perfectly in sync with the audio cues.
7. **Verify Tier Distinctions**: Ensure standard, premium, and flagship tiers still look distinctive and retain their unique effects.
8. **Final Build & Size Check**: Verify the build passes and stays under 495MB.
