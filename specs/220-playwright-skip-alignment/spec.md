# Feature Specification: Playwright Alignment and Authorized QA Skips

**Feature Branch**: `220-playwright-skip-alignment`

**Created**: 2026-11-26

**Status**: Implemented

**Input**: User description: "Remove unnecessary Playwright version-management complexity and hardcoded version restrictions so Freebuff and every applicable checker automatically use the newest repository-approved Playwright and its matching browser, and make explicitly justified, inapplicable QA skips report `SKIPPED — NOT APPLICABLE` while yielding a green overall PR check."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A Playwright update needs no follow-up edits (Priority: P1)

The owner or Dependabot updates the three Playwright packages and the lockfile. Freebuff's startup command, the local CLI
wrapper and Visual QA then use that installed version and the Chromium revision it records, without any script,
document, test or workflow being edited, and without silently running the previous installation.

**Why this priority**: A version that is declared in several places drifts. The observable failure is a stale
`node_modules` tree or a cached browser from another release, which fails at launch instead of failing clearly at setup.

**Independent Test**: With the lockfile changed and `node_modules` stale, the CLI wrapper reinstalls; with a stale
Chromium cache, the agent setup downloads the pinned revision; Visual QA installs Chromium from the installed
Playwright rather than validating a revision by hand.

**Acceptance Scenarios**:

1. **Given** `node_modules/.pnpm/lock.yaml` differs from `pnpm-lock.yaml`, **When** either the CLI wrapper or
   `setup-playwright-agent.sh` runs, **Then** the wrapper performs a frozen install and the setup fails closed with the
   exact repair command until the tree matches.
2. **Given** the three Playwright packages resolve to different installed versions, **When**
   `setup-playwright-agent.sh` runs, **Then** it fails with the mismatched package versions.
3. **Given** a Playwright update, **When** Visual QA runs, **Then** it provisions Chromium with one unconditional
   `playwright install --with-deps chromium`, keyed by the installed version, with no hardcoded revision.
4. **Given** the operational documentation, **When** a reader looks for the browser revision, **Then** it points to
   `playwright-core/browsers.json` and the installed version instead of a literal revision.

---

### User Story 2 - An authorized skip is labelled, not passed (Priority: P1)

A check that a trusted authority proves cannot apply is shown as `SKIPPED — NOT APPLICABLE` with its reason. The
individual item is never shown as `PASSED`, but the category and the GitHub PR check report success when every other
applicable requirement passed.

**Why this priority**: Today the same state is either a failure (missing human declaration on a bot PR) or a pass with
a contradictory label (`NOT RUN — not applicable` counted as verified). Both hide the truth.

**Independent Test**: Feed the report a bot-authored PR whose supporting checks all pass: the attestation row shows
`SKIPPED — NOT APPLICABLE`, the QA Checker category is `PASSED`, and the overall report is `PASSED`. Feed it a failed
shard with the same skip: the category and the overall report are `FAILED`.

**Acceptance Scenarios**:

1. **Given** the trusted classifier proves the build or browser check cannot apply, **When** all other applicable
   checks pass, **Then** the item is labelled `SKIPPED — NOT APPLICABLE`, the category is `PASSED`, and the audit is
   `VERIFIED` with no blocking reason.
2. **Given** a check that actually ran and failed, **When** an inapplicability claim also exists, **Then** the observed
   failure wins and the category is `FAILED`.
3. **Given** an `applicable: false` record with no documented authority or no specific reason, **When** the report is
   built, **Then** Verification Integrity is `FAILED` and the overall report is never green.
4. **Given** an automation-authored pull request, **When** the human pre-submission attestation is missing, **Then**
   it is an `actor-inapplicable` skip and the supporting automated results decide the category.
5. **Given** a GitHub conclusion of `skipped`, `neutral`, `cancelled` or `stale` on a conditional check with no
   trusted inapplicability, **When** the audit runs, **Then** the check blocks and the overall status is
   `NOT VERIFIED`.
6. **Given** a conditional check that did not run and whose applicability is unknown, **When** the report is built,
   **Then** Verification Integrity is `WARNING`, never `PASSED`.

---

### User Story 3 - The Dependabot exemption is narrow and verified (Priority: P2)

A verified Dependabot dependency update cannot write a QA scope declaration, Spec Kit reporting or a human
protected-file declaration. Those three declarations are skipped for it; every other requirement, including the
environment-protected human authorization gate, stays mandatory.

**Why this priority**: Without it every Dependabot PR is red for a declaration it cannot make. With a loose exemption,
a mixed or forged update could bypass scope and governance.

**Independent Test**: A Dependabot PR touching only `package.json`, `pnpm-lock.yaml`, `.github/dependabot.yml` or
workflow YAML, with every commit authored by Dependabot and committed by GitHub, reports those three items as skipped
and otherwise passes. A human PR, a mixed commit list or an application-code path does not.

**Acceptance Scenarios**:

1. **Given** a verified Dependabot update with no QA declaration markers, **When** PR Scope Verification runs, **Then**
   it reports `PASS` with `SKIPPED — NOT APPLICABLE` and exits 0.
2. **Given** a description with duplicated or malformed QA declaration markers, **When** the scope checker runs,
   **Then** it fails; only an entirely absent declaration is eligible.
3. **Given** a verified Dependabot update, **When** the protected-file declaration is absent but the human gate
   passed, **Then** the declaration is skipped and the category is `PASSED`; a failed gate still fails.
4. **Given** a human-authored PR, **When** any declaration is missing, **Then** the existing failure behaviour is
   unchanged.

---

### Edge Cases

- A head commit carrying `[skip ci]` or `skip-checks: true` remains a failure; a skip never rescues a head whose
  workflows did not run.
- A required check with no run on the current head remains `NOT RUN`/blocking.
- A missing conditional check with unknown applicability is a `WARNING`, not a skip and not a pass.
- `visual_impact.required=false` on a path-classified visual change remains a reviewer `WARNING`.
- An observed failed run always outranks a claimed inapplicability, including an authorized one.
- A malformed commit list, file list or authority makes the exemption unverified; it fails closed.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The repository-local dependency tree and lockfile MUST be the only source of truth for the Playwright
  version and its Chromium revision. No operational script, test, workflow or document may pin either.
- **FR-002**: The CLI wrapper MUST reinstall when `node_modules/.bin/playwright` is missing or when
  `node_modules/.pnpm/lock.yaml` is missing or differs from `pnpm-lock.yaml`.
- **FR-003**: `setup-playwright-agent.sh` MUST fail closed on a stale dependency tree and MUST fail when the three
  Playwright packages do not resolve to one installed version.
- **FR-004**: Visual QA MUST provision Chromium with one unconditional
  `pnpm exec playwright install --with-deps chromium`, keep the installed-version cache key, and keep no
  `restore-keys`.
- **FR-005**: The custom Playwright cache validator MUST be removed; Playwright's own revision check is authoritative.
- **FR-006**: The install-timing reporter MUST take the Chromium cache outcome from the restore log lines and report
  `n/a` only for a job with no restore step.
- **FR-007**: One shared contract MUST define the exact per-item label `SKIPPED — NOT APPLICABLE`, a closed set of
  trusted authorities, a required specific reason, and an authorization predicate.
- **FR-008**: The trusted authorities MUST be exactly: the trusted applicability classifier for any PR; an
  `actor-inapplicable` human attestation on an automation-authored PR; and a verified Dependabot maintenance update
  for the three declarations it cannot make.
- **FR-009**: An authorized skip MUST be rendered on the individual item only. Category statuses MUST remain
  `PASSED`, `FAILED`, `WARNING` and `NOT RUN`; a category MUST be `PASSED` when every other applicable requirement
  passed.
- **FR-010**: An observed failure MUST outrank any claimed inapplicability.
- **FR-011**: An `applicable: false` record without a documented authority and reason MUST fail Verification
  Integrity. An unexplained conditional skip on the head MUST block the audit.
- **FR-012**: A missing conditional check with unknown applicability MUST produce a `WARNING`, never `PASSED`.
- **FR-013**: Dependabot verification MUST require the bot author, every commit authored by Dependabot with the
  allowed email and committed by `noreply@github.com`, and every changed path limited to `package.json`, a lockfile,
  `.github/dependabot.yml` or `.github/workflows/*.yml`.
- **FR-014**: The exemption MUST cover only the QA scope declaration, Spec Kit/Library/Memory Bank reporting and the
  submitter protected-file declaration. The environment-protected human authorization gate MUST never be skipped.
- **FR-015**: PR Scope Verification MUST distinguish a totally absent declaration (eligible) from a malformed or
  duplicated one (a failure), and MUST receive commit evidence.
- **FR-016**: The PR verification report workflow and PR scope workflow MUST fetch the pull request commits and pass
  them to the checker with `--commits`.
- **FR-017**: `PR_SUBMISSION.md`, the PR template, `README.md` and the Playwright skill reference MUST describe the
  per-item skip label, the four category statuses, and the dynamic revision rule.

### Non-Functional Requirements

- **NFR-001**: No Playwright version bump and no new version-management service or script; Dependabot and the owner
  keep handling updates.
- **NFR-002**: No protected file other than `package.json`/`pnpm-lock.yaml` (unchanged) is modified; no deployment,
  secret, dependency upgrade or scanner configuration changes.
- **NFR-003**: The production build remains strictly below 495 MiB; this change set is classifier-exempt from the
  build, and the measurement is recorded as such rather than claimed.
- **NFR-004**: Failed checks, warnings and unavailable evidence stay visible; no checker is weakened to make this
  feature pass.

### Key Entities

- **Skip record**: authority, specific reason, exact label. Only a record satisfying the shared contract is
  authorized.
- **Check record**: name, status, applicability, blocking flag, optional skip record.
- **Category report**: id, fixed name, one of four statuses, summary, details, attention, skipped entries.
- **Dependabot verification**: author, commit authors/committers, changed-path allowlist.

## Success Criteria *(mandatory)*

- **SC-001**: A Playwright lockfile update requires edits to no script, workflow, test or operational document.
- **SC-002**: A stale dependency tree is detected and repaired (wrapper) or refused clearly (setup) instead of
  launching the previous Playwright.
- **SC-003**: An authorized skip yields the exact item label `SKIPPED — NOT APPLICABLE`, a `PASSED` category and a
  green overall check when all other applicable results pass.
- **SC-004**: A failed run, unauthorized skip or unexplained conditional skip can never produce a green check.
- **SC-005**: A verified Dependabot update is green for the three declarations it cannot make without weakening the
  human authorization gate.
- **SC-006**: All existing Python checker suites, Vitest suites, the TypeScript check and `./freebuff-verify.sh` pass.
