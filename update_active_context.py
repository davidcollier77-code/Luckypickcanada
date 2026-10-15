import re

with open('memory-bank/activeContext.md', 'r') as f:
    content = f.read()

new_context = """- **Goal:** Synchronize the Crystal Ball fortune reveal interactions (scroll, lighting, and text animation).
- **Verified root cause:** The `scrollIntoView` fired synchronously but wasn't padded with any delay for the UI to actually settle before the text started streaming. The text animation rendered entire words at a time via a fixed speed index that raced past readers. The "loading glow" explicitly decoupled from the text rendering portion, ending early. The golden leaf position was hardcoded through a timed CSS animation track rather than following the text dynamically.
- **Current branch:** `task-branch`
- **Current implementation:** Updated the `CrystalBall.tsx` component to initialize smooth scroll immediately. Bound the loading glow to span BOTH the loading API state and the text revealing state, falling back to a pulse only after typing completes. Converted the words index arrays to a character map queue, calculating natural punctuation/space breaks and writing speed organically. Removed absolute positioned CSS for the golden leaf and instead mounted it inline as part of the React node iteration for the most recent un-typed character span.
- **Verification:** Ran E2E Playwright `tests/visual/crystal-ball-interactions.spec.ts` with updated timeouts for the slower character typing speed. Size output tests under 495MB via `.next/`. `jules-verify.sh` verified Spec Kit files are populated."""

content = content.replace("- **Goal:** Fix the Cloudflare compile failure in `app/components/CrystalBall/CrystalBall.tsx` reported at the `fortuneWords.map` JSX.", new_context)

with open('memory-bank/activeContext.md', 'w') as f:
    f.write(content)
