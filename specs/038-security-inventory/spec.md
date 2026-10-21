# Spec: Remediation of Hardcoded Strings in Documentation

**Task**: Clean up hardcoded `postgresql://` string in `DATABASE_SETUP.md` as discovered during security triage.

## Scope
- Replace the dummy `postgresql://` connection strings with the environment variable placeholder `$DATABASE_URL`.
- Ensure the result remains technically correct documentation.
- Maintain existing valid code scanning triage states.

## Out of Scope
- Modifying actual `.env` files or application secrets.
- Modifying the read-only `.docs/` directory.
- Suppressing rules in the scanner configuration.
