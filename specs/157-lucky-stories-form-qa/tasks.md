# Tasks: Reliable Lucky Stories Form QA

**Input**: Design documents from `specs/157-lucky-stories-form-qa/`

**Prerequisites**: plan.md and spec.md

## Phase 1: Form accessibility and regression test

**Purpose**: Make the province control's label association explicit and keep browser validation independent of Turnstile availability.

- [X] T001 [US1] Add an explicit `htmlFor`/ `id` association to the existing Province or territory label and select in `app/lucky-map-of-canada/lucky-map-of-canada.js`, retaining the same nested structure and styles.
- [X] T002 [US1] Use the accessible combobox role/name in `tests/visual/lucky-stories-pagination.spec.ts` and retain assertions for visibility, required state, empty value and all 13 canonical options.
- [X] T003 [US2] Replace the Turnstile-dependent submit-button click with direct native `valueMissing` and `form.checkValidity()` assertions; confirm a canonical selection makes the form valid without submitting it.

## Dependencies & Execution Order

- T001 and T002 establish the accessible association and reliable locator.
- T003 completes the independent native-validation test after T001 and T002.

## Implementation Strategy

Apply the component and test changes together as one focused follow-up commit on the owner-specified PR branch. Preserve the existing security policy and submission protections.
