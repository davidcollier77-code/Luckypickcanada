# Implementation Plan: Hardcoded Connection Strings in Documentation

**Branch**: `fix/security-inventory-hardcoded-strings` | **Date**: $(date +%Y-%m-%d) | **Spec**: [spec.md](./spec.md)

## Summary
The previous triage run in `.specify/features/security-inventory/` identified that `DATABASE_SETUP.md` contained dummy `postgresql://` string examples. Although these are placeholders (`username:password@hostname`), security scanners may flag them as potential exposed credentials. This task resolves the finding by swapping the literal connection string format with the generic `$DATABASE_URL` format.

## Technical Context
**Target File**: `DATABASE_SETUP.md`
**Constraints**: Do not alter `.docs/`, do not alter live configuration, make smallest safe change to resolve the scanner heuristic hit.

## Action Plan
1. Apply the replacement to `DATABASE_SETUP.md`.
2. Inspect `QUICK_FIX_GUIDE.md` to ensure it doesn't also contain the string (grep verified it doesn't contain the `postgresql://` string, only a reference to the PostgreSQL tables).
3. Run verification scripts (`./jules-verify.sh`).
4. Prepare PR Summary.
