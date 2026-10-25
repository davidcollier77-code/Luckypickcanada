# Active Context

## Performance Optimization — $(date +%Y-%m-%d)
- **Goal:** Improve performance for mobile loading/LCP scores.
- **Changes Implemented:**
  1. Extracted `Math.sin()` logic out of `requestAnimationFrame` loop conditionally to optimize rendering inside `HomePage.js` star animation.
  2. Extracted `ctx.globalAlpha = 1.0; ctx.globalCompositeOperation = 'source-over';` into simpler if-else conditional flows inside `HomePage.js`.
  3. Removed unused `import Image from 'next/image'` across `HomePage.js`, `lucky-map-of-canada.js`, `lucky-card-reveal.js`, and `share-lucky-pick-button.js`.
  4. Converted `<Image />` component tags in `app/lucky-map-of-canada/lucky-map-of-canada.js` and `app/homepage/HomePage.js` that were improperly mixing with `unoptimized: true` to standard `<img>` tags inside `<picture>` elements.
  5. Removed unnecessary `mix-blend-screen` from `app/homepage/HomePage.js` overlay image.
- **Validation:** Build completes successfully within the 495 MB cap. Tests and verification passing.

## Fix CI: DevSkim Python Test Syntax Errors — $(date +%Y-%m-%d)
- **Goal:** Resolve Python `SyntaxError` (unterminated string literal) crashing `.github/scripts/test_suppress_devskim_false_positives.py` in the GitHub CI pipeline during the `DevSkim scan and Security upload` step.
- **Changes Implemented:**
  1. Fixed two missing double-quotes on line endings in `(root / "pnpm-lock.yaml").write_text(...)` expressions inside `test_suppress_devskim_false_positives.py`.
  2. Fixed `test_speckit_file_checksum_is_suppressed_with_devskim_offset` failing test by adding `+ 1` to `startColumn` (simulating the 1-based SARIF offset on the quotation mark) to correct the region span calculation boundary checks.
- **Validation:** `python3 -m unittest discover -s .github/scripts -p 'test_suppress_devskim_false_positives.py'` runs and passes successfully.
