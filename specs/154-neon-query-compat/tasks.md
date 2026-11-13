# Tasks: Restore Lucky Stories Database Reads

**Input**: Design documents in `specs/154-neon-query-compat/`

**Prerequisites**: `spec.md`, `plan.md`, `research.md`

**Tests**: Regression coverage is required for the four manually parameterized reads.

## Phase 1: Setup

**Purpose**: Confirm the affected call sites and current dependency baseline.

- [x] T001 Inspect the Neon client call sites in `app/lucky-stories.js` and confirm the installed driver version in `package.json`.

---

## Phase 2: Foundational

**Purpose**: Make the test double accurately enforce the supported Neon client API.

- [x] T002 Update the strict Neon HTTP client mock in `__tests__/lucky-stories-pagination.test.js` so the callable client accepts tagged templates only and exposes a separate `.query` method.

---

## Phase 3: User Story 1 - Browse published Canadian community stories (Priority: P1)

**Goal**: Restore the map summary, recent activity, province pages and linked-story reads.

**Independent Test**: Exercise `getLuckyStoryMap` with summary, page and linked-story data. Confirm every manually parameterized statement uses the Neon 1.x `.query` method and all existing result assertions pass.

- [x] T003 [US1] Change the four parameterized reads in `app/lucky-stories.js` to call `database.query(sqlText, params)`, preserving their SQL and parameters.
- [x] T004 [US1] Add regression coverage in `__tests__/lucky-stories-pagination.test.js` for the province-count, recent-story, page and linked-story query paths.

---

## Phase 4: Polish and Review

**Purpose**: Confirm the task diff is limited to the compatibility repair.

- [x] T005 Review the complete diff for `app/lucky-stories.js` and `__tests__/lucky-stories-pagination.test.js`; confirm no schema, record, secret, connection-setting or visual changes.

## Dependencies

```text
T001 → T002 → T003 → T004 → T005
```

## Parallel Execution

No implementation tasks are parallelized: the strict test contract is established before
the query implementation and its regression assertions are completed.

## Implementation Strategy

Complete the single P1 story in one increment. No schema migration, runtime dependency
change, deployment edit or database write is part of this task.
