# Research: Documentation HTML Normalization

**Date**: 2026-11-16

## Findings

- The existing validator in `scripts/refresh-docs.js` checks structural readability but accepts raw HTML. The previous unit test explicitly treated a complete HTML page as valid documentation.
- `.docs/manifest.json` currently routes 64 source entries. A URL-shape review identifies 41 likely Markdown/plain-text sources (for example raw GitHub Markdown, `.txt` and `llms.txt` endpoints) and 23 HTML-oriented or ambiguous sources. This classification is based on URL shape, not a live Content-Type audit of all 64 endpoints.
- The configured Next.js source `https://nextjs.org/docs/app` was verified to return rendered HTML advertising `https://nextjs.org/docs/app.md` as `text/markdown`. The Markdown endpoint returns Markdown.
- The repository already includes `jsdom` 30.0.1 as a development dependency, installed by the documentation refresh workflow. No new package is required.
- The current refresh workflow has a manual `workflow_dispatch` trigger. Its schedules, retry interval, timezone and permissions are not required to change.

## Decisions

1. Inspect both Content-Type and response body because upstream servers can omit or mislabel MIME headers.
2. Prefer a declared same-origin HTTPS Markdown alternate. Refuse alternate URLs and redirects that change origin or downgrade from HTTPS.
3. Use the already-installed JSDOM parser to extract semantic documentation content where an alternate is unavailable. Do not execute page scripts or load remote resources.
4. Keep structural validation as the final acceptance gate; raw HTML that survives conversion is rejected before any write.
5. Bypass the unchanged-SHA shortcut only when the existing local snapshot is HTML, allowing the owner-triggered refresh to repair legacy snapshots.
6. Do not rewrite manifest sources, edit generated `.docs/` files manually, add dependencies, modify scheduling or touch Cloudflare resources.

## Limitations

The configured inventory was reviewed by source URL shape, but all 64 upstream endpoints were not individually fetched to establish their live Content-Type or alternate availability. The implementation is format-driven and handles HTML responses regardless of which configured source returns them. The full refresh remains an owner-triggered post-merge verification step.
