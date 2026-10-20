# Credential Rotation and Owner Follow-up Checklist

## Neon Database Connection String
- **Service and purpose:** Neon PostgreSQL database connection string (used for application database access).
- **Affected path and historical exposure context:** Previously hardcoded in `QUICK_FIX_GUIDE.md` and `DATABASE_SETUP.md` as part of manual setup instructions.
- **Evidence:** Found a literal string matching `postgresql://neondb_owner:npg_...` in both files. The literal has now been removed from the repository source code and replaced with `$DATABASE_URL`.
- **Validity status:** UNKNOWN (A credential rotation was recorded in PR #1023 on September 11, 2026, but the current validity of the specific string remaining in these files cannot be safely tested without risk of exposure).
- **Priority:** HIGH
- **Recommended owner action:**
  1. Review the connection strings previously present in these files (see Git history if needed, but do not reproduce the string).
  2. If the password in those strings is still active or valid for *any* Neon database, immediately rotate the `neondb_owner` password in the Neon dashboard.
  3. Ensure the production environment variables (`DATABASE_URL`, `POSTGRES_URL`) are updated with the new, rotated credential if necessary.

## General Note
No other hardcoded credentials were found during the static analysis. Commit hashes in `.docs/manifest.json` and dependency hashes in `pnpm-lock.yaml` were verified as false positives. Public, restricted client-side API keys in the Google Developer documentation snapshots (`.docs/`) were also verified as false positives and belong to the documentation site, not Luckypickcanada.
