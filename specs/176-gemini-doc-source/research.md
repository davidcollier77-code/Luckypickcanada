# Research: Gemini API Documentation Source

## Finding

The configured source `https://ai.google.dev/gemini-api/docs.md.txt` failed in the November 17, 2026 refresh because it redirected across origins. The updater refused that redirect, correctly preserving its security boundary. The existing Gemini snapshot in the repository is a rendered HTML page rather than usable Markdown.

Google's current Gemini API documentation page now identifies Google AI Studio as the new home for the documentation. The official index at:

`https://aistudio.google.com/llms.txt`

identifies itself as the full documentation index for Google AI Studio, the Gemini API, and Google GenAI SDKs. It also states that individual documentation pages are available as clean Markdown by appending `.md` to their URLs.

The related `https://aistudio.google.com/docs.md` endpoint is the Markdown overview page, whereas `/llms.txt` is the full index. The full index is therefore the better source for this library entry.

## Decision

Change only the `url` value for `/websites/ai_google_dev_gemini-api` in `.docs/manifest.json` to `https://aistudio.google.com/llms.txt`.

Do not alter redirect handling, validation, HTML conversion, retry logic, existing snapshots, or other manifest entries.

## Evidence and Limitations

- The previous refresh report records the cross-origin redirect refusal for the old URL.
- The official Google AI Studio page and its `llms.txt` index were retrieved and inspected.
- The manifest was parsed and the corrected URL was checked structurally.
- The updater itself was not executed in ChatGPT. The local environment is Node.js 22, while the repository requires Node.js 26, and ChatGPT's repository rules prohibit executing repository shell scripts.
- End-to-end confirmation remains the normal documentation refresh after the PR is merged.
