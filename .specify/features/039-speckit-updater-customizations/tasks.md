# Tasks — Safe, Notified Spec Kit Updater

- [x] T001 Verify the root cause from the integration manifest, CLI error, and October 20 file history.
- [x] T002 Store the installed upstream baseline and Jules overlays for the two customized command files.
- [x] T003 Add a guarded updater and fail-closed three-way rebase helper.
- [x] T004 Add regression tests for preserving upstream additions and rejecting merge conflicts.
- [x] T005 Include source/slot metadata in Cloudflare workflow dispatches and bypass the daily-success guard for manual Spec Kit runs.
- [x] T006 Notify the owner when either updater creates or refreshes an update PR.
- [ ] T007 Verify current-head CI, `./jules-verify.sh`, Worker tests, Wrangler dry-run, actual Spec Kit update, and the first real Cloudflare dispatch.
