# Requirements Checklist: Consolidate duplicate map URLs onto `/map`

- [x] The feature addresses a verified finding (F-H1) with recorded evidence rather than an assumption.
- [x] Every requirement is testable by an observable redirect, test assertion or build measurement.
- [x] Scope is limited to routing configuration and a regression test; page content and visuals are excluded.
- [x] Protected systems (payments, authentication, database, secrets, deployment configuration) are untouched.
- [x] Existing behaviour that must not regress is named explicitly (FR-006, FR-007, FR-008).
- [x] Success criteria include an executed verification, not code inspection alone.
- [x] Query-string preservation is a stated requirement with its own success criterion.
- [x] Unavailable evidence (Search Console index state, Analytics traffic) is declared as unverified rather than assumed.
- [x] No keyword, link-building or ranking claims are attached to the change.
- [x] The change is reversible by removing two configuration entries.
