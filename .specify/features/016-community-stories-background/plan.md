# Feature Plan: Lucky Stories Form Background

## Architecture & Implementation
- We created a high resolution webp version of the background image `public/assets/lucky-map-sky.webp`.
- Ensure `map.css` specifies an isolated layout for `.story-modal`. Added backdrop-filter blur and semi-transparent backgrounds to the modal and its backdrop.
- Removed the `homepage-sky-backdrop` class and replaced it with an inline style for the high-res image, accompanied by a softened overlay.
- Styled input fields and textareas to be glassy and semi-transparent.

## Test Strategy
- Ensure UI retains layout correctly on mobile and desktop via local tests and responsive design checks.
- Verify that image formats and bounds are within limits (webp under 500kb).
