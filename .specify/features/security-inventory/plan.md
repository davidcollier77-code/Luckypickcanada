# Security Inventory Plan

1. **Information Gathering**: Checked for `gh` CLI access and fallback API tokens. Determined that the full Code Scanning/Secret Scanning inventory is inaccessible due to "Bad credentials" and missing `gh` configuration.
2. **Analysis**:
   - `githubShas` in `.docs/manifest.json`: Verified as commit hashes.
   - `pnpm-lock.yaml`: Verified as standard dependency hashes.
   - `.docs` keys: Verified as public/client-side keys for third-party documentation.
   - Neon Strings: Identified hardcoded `postgresql://` string in `QUICK_FIX_GUIDE.md` and `DATABASE_SETUP.md`.
3. **Execution**:
   - Replace the literal connection string in `QUICK_FIX_GUIDE.md` and `DATABASE_SETUP.md` with `$DATABASE_URL`, as `DATABASE_URL` is defined in the prerequisites of the documentation.
   - Prepare the owner credential rotation checklist.
   - Create the PR Summary.
