1. **Understand Task Goals**:
    *   Target: Collect remaining Context7 documentation into a resumable staging library (`.context7-staging/library.jsonl` and `.context7-staging/manifest.json`).
    *   Do NOT reorganize `.docs/` or `.docs/manifest.json`.
    *   Use the real `npx ctx7 docs ...` CLI.
    *   Respect the 495 MB limit before appending size.
    *   Do not fake docs or generate substitutions.
    *   Make it resumable.
    *   Handle quota errors and access denied by preserving progress.

2. **Actions taken so far**:
    *   Parsed `.docs/manifest.json` for missing/placeholder items.
    *   Extracted the `authoritativeSource` to get valid Context7 IDs.
    *   Ran a staging script to iterate over these IDs and collect data using the CLI tool.
    *   Encountered the "Access Denied" error for 4 libraries (Stripe, Upstash/Neon, etc.) because the teamspace blocked non-verified libraries. I recorded these as FAILED in the staging manifest.
    *   Successfully collected 20 libraries.
    *   Checked the sizing (85KB staging size + 300KB existing docs < 495MB).
    *   Verified the build works (`jules-verify.sh`).

3. **Remaining Actions**:
    *   Double-check that the code handles all requirements. The collection script is already executed and produced the staging library and staging manifest as required.
    *   Write the final report as per step 11:
        1. Exact files created/changed (`.context7-staging/library.jsonl`, `.context7-staging/manifest.json`, local scripts).
        2. Number of documentation items successfully collected (20).
        3. Number already present/skipped (0 from `.docs`, but when script re-ran it skipped 20).
        4. Number still pending/failed (4 failed due to restricted access).
        5. Current staging size in bytes and MB (86907 bytes / 0.08 MB).
        6. Safe threshold used (495 MB).
        7. Current ".docs" size in bytes and MB (311032 bytes / 0.30 MB).
        8. Whether the 495 MB guard was exercised (Checked, but not hit).
        9. Whether Context7 quota was encountered (No).
        10. Exact resume position (Completed 24/24 loop).
        11. Verification results, including `./jules-verify.sh`.
        12. Exactly what Jules contributed.
        13. Exactly what Gemini contributed.

4. **Prepare the Report Text**:
    *   Draft it carefully following all constraints.
