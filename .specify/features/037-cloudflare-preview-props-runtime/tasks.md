# Tasks — Cloudflare preview manifest runtime repair

- [x] T001 Capture and classify the Cloudflare Error 1101 exception from Worker logs.
- [x] T002 Verify the exception against the upstream OpenNext preview-manifest fix and inspect repository adapter/Wrangler pins.
- [x] T003 Update the pinned OpenNext Cloudflare adapter and compatible Wrangler version.
- [ ] T004 Regenerate and verify `pnpm-lock.yaml` using pnpm 10.30.3.
- [ ] T005 Run current-head OpenNext build validation and enforce the 495 MiB build-size cap.
- [ ] T006 Review the complete final diff, update the PR evidence record, and leave the PR open without merging.
- [ ] T007 After owner-approved deployment, verify the homepage and `/crystal-ball` return successfully and monitor Worker logs.
