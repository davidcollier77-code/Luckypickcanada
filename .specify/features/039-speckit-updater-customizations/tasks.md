# Tasks — Safe, Notified Spec Kit Updater

- [x] T001 Verify the root cause from the integration manifest, CLI error, and October 20 file history.
- [x] T002 Store the installed upstream baseline and Jules overlays for the two customized command files.
- [x] T003 Add the guarded updater and fail-closed three-way rebase helper.
- [x] T004 Add regression tests for preserving upstream additions and rejecting merge conflicts.
- [x] T005 Include Cloudflare source/slot metadata and allow an owner-requested manual Spec Kit run to bypass the daily-success guard.
- [x] T006 Notify the owner when either updater creates or refreshes an update PR, with source/slot and workflow URL.
- [x] T007 Verify the actual Spec Kit integration/extensions update, rebase tests, Worker tests, `./jules-verify.sh`, and Wrangler dry-run in the isolated PR CI checkout.
- [ ] T008 Verify the first real Cloudflare production dispatch, updater outcome, and owner notification after the Worker is deployed from main.
