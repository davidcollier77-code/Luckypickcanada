# Safe, Notified Spec Kit Updater

## Purpose
Make the Cloudflare-triggered Spec Kit updater reliable while preserving the repository's intentional Jules-specific command behavior.

## User stories
- **P1 — Automatic upgrades:** Cloudflare-triggered runs update the Spec Kit integration and extensions without stopping on the two tracked Jules command customizations.
- **P1 — Preserve customization:** Jules instructions survive upstream changes; non-conflicting upstream additions are retained; unrecognized edits and true three-way conflicts stop safely.
- **P1 — On-demand run:** An owner-triggered workflow dispatch starts immediately rather than being blocked by the daily-success guard.
- **P1 — Clear notification:** Creating or refreshing an update PR triggers an explicit owner mention that identifies the source and links to the Actions run.
- **P2 — Independent schedules:** Existing Spec Kit and documentation updater times remain unchanged.

## Acceptance criteria
1. The safe-upgrade script validates that current Jules command files match their recorded overlays before changing either file.
2. It temporarily restores the exact installed upstream baseline, runs the normal non-forced integration upgrade, and captures the newly generated templates.
3. A three-way merge retains Jules instructions and non-conflicting upstream additions; conflicts fail before stored base/overlay/current files are rewritten.
4. Both workflows accept source/slot inputs from Cloudflare. Owner-requested manual Spec Kit runs bypass the daily guard; Cloudflare retry dispatches still honor it.
5. Both workflows issue a deduplicated owner notification when an update PR is created or refreshed.
6. Existing cron expressions and the approved Worker slot map remain unchanged.
