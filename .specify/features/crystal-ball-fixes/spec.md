# Crystal Ball Fixes Specification

## Objective
Address three specific issues in the Crystal Ball component:
1. Strip raw Markdown emphasis (like `**`) from the fortune output text.
2. Present an "Ask Another Question" button (with the daily quota readout) after the typewriter animation completes, returning to the input view on click.
3. Remove redundant instructional text from the question input card.

## Requirements
- Use existing components and structure where applicable.
- Prevent raw Markdown tokens from showing character-by-character in the animation.
- Do not bypass the daily limit mechanisms.
- Do not refactor unrelated layouts, animations, or logic.
