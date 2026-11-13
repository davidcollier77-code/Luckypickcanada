# Feature Specification: Canonical Lucky Stories Province Selection

**Feature Branch**: `feat/lucky-stories-province-dropdown`

**Created**: 2026-11-13

**Status**: Draft

**Input**: User description: "Replace the free-text Province or territory field in the Lucky Stories submission form with a required dropdown containing all thirteen Canadian provinces and territories, so visitors cannot misspell or enter inconsistent location names."

## User Scenarios & Testing

### User Story 1 - Select a valid province or territory when sharing a story (Priority: P1)

A visitor opening the Community Stories submission form can choose their province or territory from a fixed list of all thirteen Canadian provinces and territories. The visitor does not type the location manually.

**Why this priority**: Consistent location values allow community stories to be grouped and displayed under the correct province or territory.

**Independent Test**: Open the story submission form, inspect the available choices, select one, and submit a valid story.

**Acceptance Scenarios**:

1. **Given** the story submission form is open, **When** the visitor opens the Province or territory control, **Then** it offers exactly the thirteen Canadian provinces and territories using their full canonical English names.
2. **Given** no province or territory has been selected, **When** the visitor attempts to submit the form, **Then** the browser prevents submission and identifies the required selection.
3. **Given** the visitor selects a province or territory, **When** the story is submitted, **Then** the selected full name is sent as the location value and can be resolved to the matching map region.
4. **Given** a submission is sent directly without the form or with an unknown or misspelled location, **When** the server validates it, **Then** the submission is rejected and no story is created.
5. **Given** existing stories contain previously accepted location formats, **When** visitors browse the map, **Then** the existing records continue to be matched and displayed as before.

### Edge Cases

- The visitor leaves the placeholder selected and attempts to submit.
- A request bypasses browser validation and omits the location.
- A direct request supplies an abbreviation, misspelling, city name or other value rather than one of the thirteen canonical full names.
- A valid canonical value is submitted with different letter casing or surrounding whitespace; validation must not silently store a different value.
- Existing records that use legacy abbreviations or city-plus-province location strings must remain readable.

## Requirements

### Functional Requirements

- **FR-001**: The story form MUST present a fixed selection control for the Province or territory field instead of a free-text input.
- **FR-002**: The selection control MUST contain exactly thirteen choices, one for each Canadian province and territory, displayed using each full canonical English name.
- **FR-003**: The visitor MUST select a province or territory before the form can be submitted.
- **FR-004**: The submitted location MUST be validated against the same thirteen canonical province and territory names on the server; missing or unrecognized values MUST be rejected.
- **FR-005**: A valid submission MUST store the canonical full name corresponding to the selected option.
- **FR-006**: Existing story records, province matching, map filtering, display, submission spam protection and Turnstile verification MUST continue to work without unrelated changes.

## Success Criteria

### Measurable Outcomes

- **SC-001**: The form presents all thirteen canonical province and territory names, each exactly once, and no free-text location entry.
- **SC-002**: 100% of the thirteen canonical names pass server-side location validation and are stored in canonical form.
- **SC-003**: A blank selection and every non-canonical location value tested are rejected before a story is created.
- **SC-004**: Existing story location matching and map display tests continue to pass without changing stored records.

## Assumptions

- The form and its visitor-facing labels remain in English, matching the current site's province and territory names.
- The existing canonical list used by Lucky Stories is the authoritative source; the feature does not introduce a second set of names or codes.
- The location remains the existing form/API field named `location`; no database schema or migration is required.
- Existing legacy story locations remain supported for reading; the stricter rule applies to new submissions only.
