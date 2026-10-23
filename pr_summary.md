### Restore Existing Lucky Stories Visibility

- **Task Group:** Troubleshooting.
- **Reason:** The user reported that previously saved Lucky Stories disappeared. The task is to identify and repair the current data-fetch/cache behavior without recreating or changing story records.
- **Baseline evidence:**
  - Read-only query against the connected Neon database found **8 total records, all 8 approved**, with non-empty locations. Records remain in storage.
  - Current stored location formats include `Quebec canada`, `Pei canada`, `British columbia canada`, `Nova Scotia`, `saskatchewan`, and `Ontario`; province resolution tests now explicitly cover these formats.
  - The merged visual-polish PR #1581 changed Lucky Map styling and scroll behavior, not the story database or data retrieval.
  - The current API response advertised `public, s-maxage=3600, stale-while-revalidate=86400`, and the client waited for its first 60-second polling interval before asking for fresh data. This is a **verified stale-data exposure**; exact live cache contents could not be inspected from this session.
- **Implementation:**
  - `app/api/lucky-stories/route.js`: mark GET dynamic and return `Cache-Control: no-store, max-age=0, must-revalidate` and `Cloudflare-CDN-Cache-Control: no-store`, including on unavailable-database responses.
  - `app/lucky-map-of-canada/lucky-map-of-canada.js`: refresh immediately on mount and use browser no-store plus a unique refresh query parameter during each existing poll to avoid an already cached empty API URL.
  - `__tests__/lucky-stories-refresh.test.js`: assert story payload and no-store headers for configured and unavailable states.
  - `__tests__/lucky-stories.test.js`: cover location formats present in the existing saved records.
  - No database writes, story content changes, visual redesign, or security-control changes.
- **Spec Kit:** `/speckit.specify`, `/speckit.plan`, and `/speckit.tasks` artifacts created sequentially via file-driven procedural execution in `.specify/features/040-lucky-stories-restoration/`; implementation changes follow `tasks.md`. Native slash-command dispatch and local shell execution were unavailable in this session.
- **Files changed:** `app/api/lucky-stories/route.js`, `app/lucky-map-of-canada/lucky-map-of-canada.js`, `__tests__/lucky-stories-refresh.test.js`, `__tests__/lucky-stories.test.js`, the three task-scoped Spec Kit artifacts, and this summary.
- **Verification status:** Automated tests, `./jules-verify.sh`, current-head OpenNext/Cloudflare build, build-size measurement and live browser confirmation are **pending CI/deployment**. This session could not run project commands because a local repository checkout was not available; no unrun check is reported as passing.
- **Remaining issue:** Confirm after deployment that all 8 saved records display on the map; if they do not, inspect the production API response/configuration before considering any database repair.
- **USEFUL RESULT:** NO — implementation is submitted for verification; live restoration has not yet been demonstrated.
