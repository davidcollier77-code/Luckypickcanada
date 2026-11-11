# Requirements Checklist: PR Checker Reliability and Governance Protection

- [x] Dedicated governance pull requests can change `AGENTS.md`.
- [x] Directly related governance tests and protection changes are allowed in that pull request.
- [x] `AGENTS.md` alongside unrelated code, dependencies, workflows or docs is refused and the files are named.
- [x] Deleting or renaming `AGENTS.md` away is refused.
- [x] The base-branch `AGENTS.md` is the approved baseline, so merged changes are not reported again.
- [x] A PR title or description cannot bypass the gate.
- [x] Missing or unreadable change data fails closed.
- [x] The human authorization environment is still required.
- [x] The protection workflow never checks out or runs the pull request head.
- [x] Every existing quality gate is retained: full Vitest, `freebuff-verify.sh`, TypeScript, production build, OpenNext/CSS/artifact validation, DevSkim suppression/replay/uploads, Spec Kit gate, build-size ceiling.
- [x] Playwright still executes the complete suite across the three existing projects, split into two required shards.
- [x] No Browserless configuration or dependency is added.
- [x] `AGENTS.md` wording is unchanged.
