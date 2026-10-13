# Feature Specification: Lucky Stories Form Background

**Purpose**: Redesign the Lucky Stories submission popup to use the starry map background cleanly rather than relying on underlying transparency.

## Functional Requirements
- The Lucky Stories form popup must have its own background that uses the starry visual elements of the Lucky Map.
- It must not show through to the underlying page content.
- The visual presentation must maintain legibility, contrast, and standard responsive behavior.
- We must use a high-res webp version of the background image for clarity.
- The input fields must be styled to have a refined glass aesthetic with gold accents.

## Scope
- Restrict changes to the Lucky Map's `LuckyMapOfCanada` React component popup state logic and CSS.
