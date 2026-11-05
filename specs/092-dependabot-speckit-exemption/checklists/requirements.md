# Requirements Checklist: Dependabot Maintenance Exemption for Spec Kit Governance

- [x] The feature describes one problem: legitimate Dependabot maintenance PRs fail the Spec Kit artifact gate.
- [x] The requirement is stated as observable behaviour with explicit signals, not as an implementation detail.
- [x] Every eligibility signal is independent of the pull request title and branch name.
- [x] Mixed-scope and ordinary feature PRs cannot qualify (path allowlist, commit provenance, artifact precedence).
- [x] Normal feature PRs keep requiring complete `spec.md`, `plan.md` and `tasks.md`.
- [x] No security check, unit test, TypeScript check, Visual QA, Playwright regression, build check or deployment
      safety check is removed, weakened or skipped.
- [x] A passing governance step is followed by the remaining verification instead of skipping it.
- [x] Deterministic tests cover legitimate maintenance, normal features and non-qualifying changes.
- [x] The change is centrally scoped to the existing verifier plus the two workflows that invoke it.
- [x] No dependency version, lockfile, application, visual, payment, email, database, secret or deployment change.
- [x] `.docs/` and `AGENTS.md` remain untouched.
- [ ] PR-head CI observation of the six Dependabot PRs (pending; never reported as passed before it is observed).
