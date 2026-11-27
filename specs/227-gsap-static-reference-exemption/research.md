# Research: Static GSAP AI Reference Exclusion

Date: 2026-11-27. Findings were checked against the live `main` branch.

## Manifest evidence

- The manifest has one GSAP identifier: `/llmstxt/gsap_llms_txt`.
- It is routed once in `groups.polishing`, appears in `inventory`, and retains one `sources` record pointing to `https://gsap.com/docs/v3/GSAP/Timeline`.
- It is not a second independently routed GSAP document.
- The current snapshot path is `.docs/polishing/_llmstxt_gsap_llms_txt.md`.

## Updater design evidence

- `collectRoutedLibraries` produces the routed ID/group map.
- `reconcileManifestIndexes` preserves IDs that remain routed; `removeStaleSnapshots` removes only unrouted snapshots.
- The final consistency audit checks routed snapshots after fetching completes.
- The refresh queue is built after manifest reconciliation and before source SHA/download processing.
- Therefore the smallest safe exclusion is at queue construction: record the allowlisted ID as static and do not enqueue it. Do not remove it from routing or from manifest indexes; doing so would trigger pruning and lose the reference from agent discovery.
- Reporting static references separately avoids misclassifying the exclusion as a successful unchanged upstream check.

## Snapshot state

The prior checked-in snapshot contained only the Cloudflare verification response, `Please wait while your request is being verified...`, rather than technical GSAP documentation. On 2026-11-27, the exact configured upstream URL was retrieved through Browserless. The response was the official GSAP Timeline documentation page (HTML, not a challenge); the article content was converted into a readable Markdown snapshot. The recovered file records the canonical source URL and retrieval date. The updater exclusion remains in place, so future scheduled refreshes will not overwrite the recovered content.

The historical reason the previous updater run accepted the challenge response is not proven by the current evidence. The current updater has explicit challenge/HTML rejection logic; this recovery does not alter that validation logic or the manifest source URL.

## QA evidence and constraints

- `scripts/test-refresh-docs.js` already runs the full updater unit suite and launches `scripts/test-refresh-docs-e2e.js` as an isolated end-to-end test.
- The e2e fixture copies the real `.docs` tree to a temporary directory and uses a mocked HTTPS transport, making it suitable to assert the static URL is not requested and the snapshot hash remains unchanged.
- The script path `scripts/refresh-docs.js` is explicitly protected by `.github/workflows/protected-files.yml`; the PR must carry the required authorization declaration and the separate protected-file GitHub Environment approval remains a pre-merge gate.
- `scripts/` is not excluded by the current build and visual classifiers, so the existing build validation and Visual QA remain required. No checker or workflow is being changed.
- The repository requires Node.js 26.x and pnpm 10.30.3. ChatGPT startup reports Node.js 22.x; Node-based unit/e2e tests and build operations are not run under the incompatible runtime.

## Decision

Keep one hard-coded, auditable static reference ID in the existing updater, retain report visibility and regression coverage, and restore only the existing `.docs` snapshot from the exact official source URL. Leave manifest routing, source URL and workflows unchanged.
