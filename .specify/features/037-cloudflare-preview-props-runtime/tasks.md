# Tasks — Cloudflare preview manifest runtime repair

- [x] T001 Capture and classify the Cloudflare Error 1101 exception from Worker logs.
- [x] T002 Verify the exception against the upstream OpenNext preview-manifest fix and inspect repository adapter/Wrangler pins.
- [x] T003 Upgrade the pinned OpenNext Cloudflare adapter and compatible Wrangler version; add the narrow minimatch 9/brace-expansion compatibility override discovered during validation.
- [x] T004 Regenerate `pnpm-lock.yaml` using pnpm 10.30.3 and verify it with a frozen install.
- [x] T005 Run the current-head Next.js build, enforce the 495 MiB build-size cap, and pass OpenNext plus Wrangler dry-run validation.
- [x] T006 Review the final diff and update the PR evidence record; leave the PR open, draft, and unmerged.
- [ ] T007 After owner-approved production deployment, verify the homepage and `/crystal-ball` return successfully and monitor Worker logs.
