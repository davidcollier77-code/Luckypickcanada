# Security Alert Inventory Spec

## Feature Scope
This task focuses on performing a security alert inventory, analyzing hardcoded findings, and safely remediating exposed connection strings without deleting or modifying external credentials.

## Goals
- Audit existing GitHub security alerts using available access.
- Document and classify known leads (`githubShas` in `.docs/manifest.json`, dependencies in `pnpm-lock.yaml`, etc.).
- Remove the hardcoded Neon connection strings in `DATABASE_SETUP.md` and `QUICK_FIX_GUIDE.md`, replacing them with an existing environment variable reference without breaking the documented setup.
- Document the API access blocker and provide an owner follow-up checklist for credential rotation.
