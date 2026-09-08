1. **Explore & Analyze**: Verify `.docs` contents, `.docs/manifest.json`, the duplicate files, and the current state.
2. **Reconciliation Tooling**: Create python scripts to precisely identify every copy's hash, mtime, and size in `.docs` per the instructions.
3. **Execution Tooling**: Create a python script to implement relative symlinking. The most recent / comprehensive manually updated version must be preserved. Every other physical copy of the same resource ID becomes a relative symlink back to this authoritative copy.
4. **Verification**: After reconciliation, check total size with `du -sh .docs`, run `./jules-verify.sh`, and confirm total manifest file-paths equals 125, while 89 duplicates were symlinked.
5. **Completion Step**: Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.
6. **Submit**: Create FINAL_REPORT.md matching the instructions and submit the branch.
