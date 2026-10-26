# Tasks: Smooth Jules Governance Workflow

**Input**: `.specify/features/058-jules-governance-smoothing/spec.md`
**Prerequisites**: `plan.md`, `spec.md`

- [x] T001 Read and compare Jules Master Work Request #1, `AGENTS.md`, and `.jules/jules.md`; inspect standing Gemini requirements.
- [x] T002 Simplify `AGENTS.md` while preserving required approvals, Spec Kit, verification, build-size, security, and no-merge safeguards.
- [x] T003 Shorten `.jules/jules.md` so it points to the single authoritative governance file.
- [x] T004 Remove the Gemini CLI standing requirement from all eight task-group specialists and Sentinel; retain Gemini API and Jules documentation/API requirements.
- [x] T005 Align PR-summary requirements and publishing recovery guidance with the master request.
- [x] T007 Add conditional Gemini CLI snapshot guidance to Creation, Troubleshooting, and Deep-dive only.
- [x] T008 Update `.docs/manifest.json` to route Gemini CLI snapshot refreshes only to Creation, Troubleshooting, and Deep-dive; inspect the refresh workflow/script to confirm it does not rewrite `.jules/*.md`.
- [ ] T006 Run `./jules-verify.sh` and required CI checks; report actual results before declaring completion.
