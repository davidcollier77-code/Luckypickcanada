1. **Explore & Analyze**: Verify `.docs` contents, `.docs/manifest.json`, the duplicate files, and the current state.
2. **Execute**: Modify `scripts/refresh-docs.js` to implement GitHub SHA checking before Context7 fetches.
   - Add `https` module.
   - Add `getUpstreamSha` to check GitHub API for repositories.
   - Load `githubShas` from `manifest.json`.
   - Before downloading docs with `ctx7`, check if the upstream SHA matches the last downloaded SHA.
   - If it matches, skip the download, update stats.skipped, and continue.
   - On successful fetch, update `githubShas` in the manifest.
   - Report the number of skipped libraries.
3. **Verification**: After applying the changes, run `jules-verify.sh`, and `node scripts/refresh-docs.js` to ensure the logic works without errors.
4. **Completion Step**: Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.
5. **Submit**: Create `FINAL_REPORT.md` matching the instructions and submit the branch.
