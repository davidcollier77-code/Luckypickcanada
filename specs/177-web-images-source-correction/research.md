# Research: web.dev Images Source Mapping

**Date**: 2026-11-17

## Finding

The manifest entry `/websites/web_dev_images` was configured with `https://web.dev/learn/images`. That URL is the Learn Images course overview, not the individual lesson represented by the saved Markdown snapshot.

## Source Verification

- `https://web.dev/learn/images` — serves the overall Learn Images course index.
- `https://web.dev/learn/images/site-generators` — returns HTTP 404 and is not a valid replacement.
- `https://web.dev/learn/images/cms` — returns HTTP 200 and the page title **Site Generators, frameworks, and CMSs**.
- The live `/cms` lesson includes the same substantive introduction and the same three main sections as the current snapshot: Static Site Generators, Frameworks, and Content Management Systems.

## Updater Impact

`scripts/refresh-docs.js` consumes the source URL configured in `manifest.sources`. It does not infer the intended lesson or automatically repair an incorrect source mapping. The manifest is therefore the correct place to fix this mismatch.

## Decision

Change only the URL value for `/websites/web_dev_images` to `https://web.dev/learn/images/cms`. Preserve the snapshot and all updater logic; allow the next normal post-merge refresh to process the corrected source.
