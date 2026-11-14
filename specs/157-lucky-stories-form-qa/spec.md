# Feature Specification: Reliable Lucky Stories Form QA

**Feature Branch**: `freebuff/f73641c533daecd5ec53698a`

**Created**: 2026-11-14

**Status**: Implemented; CI verification pending

**Input**: Owner-authorized correction of the failing Visual QA test in PR #1895.

## User Scenarios & Testing

### User Story 1 - Identify and select the canonical province (Priority: P1)

A visitor opening the Community Stories form can identify the Province or territory control by its accessible name and select one of the 13 canonical Canadian provinces and territories.

**Why this priority**: The canonical location value is required for consistent province grouping and map display.

**Independent Test**: Open the form, locate the named province combobox, verify all 13 choices and check its native required-field validity before and after selecting a province.

**Acceptance Scenarios**:

1. **Given** the Community Stories dialog is open, **When** the province control is queried by its accessible role and name, **Then** the visible required combobox is found.
2. **Given** the placeholder remains selected, **When** native form validity is checked, **Then** the province control is invalid.
3. **Given** the visitor selects a canonical option, **When** native form validity is checked, **Then** the province control is valid and its value is the full canonical name.

### User Story 2 - Run the form validation test without external Turnstile configuration (Priority: P1)

The browser test verifies the province field's own required constraint without requiring a Turnstile challenge or submitting a real story.

**Why this priority**: CI must verify the field independently of external CAPTCHA configuration and must not weaken the actual submission safeguard.

**Independent Test**: Run the focused Playwright test with Turnstile unavailable and confirm it completes the native form-validity assertions without clicking the disabled submit button.

**Acceptance Scenarios**:

1. **Given** CI has no Turnstile site key, **When** the test evaluates native form validity, **Then** the test does not attempt to click the intentionally disabled submit button.
2. **Given** the test validates the province field, **When** it completes, **Then** it has not submitted a story or bypassed Turnstile.

## Edge Cases

- Turnstile is not configured in CI and the submit button is disabled.
- The province field is rendered but a label-based locator fails to resolve it.
- The placeholder is selected, or one of the 13 canonical values is selected.
- The form label or element identifier changes without updating the accessible relationship.

## Requirements

### Functional Requirements

- **FR-001**: The province selection control MUST have an explicit programmatic association with the visible “Province or territory” label.
- **FR-002**: The control MUST remain a required native dropdown containing exactly the 13 canonical full English names.
- **FR-003**: Browser coverage MUST locate the control by its accessible combobox role and exact accessible name.
- **FR-004**: Browser coverage MUST verify that an empty selection fails native required-field validation and a canonical selection passes it.
- **FR-005**: Browser coverage MUST NOT depend on a working Turnstile challenge or click a submit button that is disabled because Turnstile is unavailable.
- **FR-006**: The correction MUST NOT alter story submission, server-side validation, Turnstile protection, form appearance or any other map behavior.

## Success Criteria

### Measurable Outcomes

- **SC-001**: The form's visible province control is found by the accessible name “Province or territory”.
- **SC-002**: Exactly 13 canonical options are present and match the expected names.
- **SC-003**: The empty selection reports `valueMissing`; selecting “Nova Scotia” makes the province control valid.
- **SC-004**: The test does not require Turnstile to be configured and sends no story submission.

## Assumptions

- The existing 13-entry shared province list remains authoritative.
- This is a targeted form-accessibility and browser-test reliability correction, not a redesign or change to submission policy.
- Turnstile must continue to gate real submissions; the test only verifies native HTML validation.
