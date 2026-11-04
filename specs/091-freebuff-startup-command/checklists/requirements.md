# Requirements Checklist: Freebuff Startup Command and pnpm Dependency Management

- [x] The problem is stated from verified evidence: gate command list, `pnpm --version`, frozen-install result, lockfile importer specifiers, and the lockfile `overrides:` block proving the top-level list was ignored.
- [x] Every functional requirement is verifiable by a command or a unit assertion (FR-001 to FR-010).
- [x] Success criteria are measurable and, where behavioural, technology-agnostic (SC-001 to SC-007).
- [x] Scope boundaries are explicit: no application code, visuals, image delivery, payments, email, database, deployment or second package manager.
- [x] Edge cases recorded: curated lockfile peer metadata, override/peer interaction, second-lockfile risk, wrong pnpm version, Node engine mismatch.
- [x] No new runtime dependency is introduced; the only new files are a shell bootstrap and a test.
- [x] Accessibility, responsive behaviour, `prefers-reduced-motion` and AVIF-first/WebP-fallback delivery are unaffected because no rendering file changes.
- [x] `.docs/` remains read-only and no governance file is modified.
- [x] Protected-file status (`package.json`, `pnpm-lock.yaml`) is recorded; the PR stays open for the owner's authorization gate.
- [x] Pending verification (PR-head CI) is labelled pending rather than claimed as passing.
