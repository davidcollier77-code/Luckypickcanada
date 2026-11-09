# Feature Specification: Lucky Stories Paged Province Feed

**Feature Branch**: `freebuff/40867abcd68f1e53d3356b9f`

**Created**: 2026-11-08

**Status**: Draft

**Input**: Improve the Lucky Stories page loading, province filtering, story counts, and existing demonstration-story author presentation.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Read a province's stories a few at a time (Priority: P1)

A visitor opens Lucky Stories and immediately sees three stories from the selected province. When the visitor scrolls near the end of that list, the next three stories load automatically, and this continues until the province's stories are exhausted.

**Why this priority**: The page currently downloads the whole published story collection to show one province. Progressive loading is the core request and keeps the page responsive as the collection grows.

**Independent Test**: Open the map with a province that has more than three stories and verify three story cards render, then scroll to the end of the list and verify the next three append without a full page reload.

**Acceptance Scenarios**:

1. **Given** a selected province with at least seven published stories, **when** the page first renders, **then** exactly three story cards from that province are shown.
2. **Given** those three stories are visible and more exist, **when** the visitor scrolls near the bottom of the story list, **then** the next three stories for the same province are appended.
3. **Given** every story for the selected province is now visible, **when** the visitor scrolls to the end, **then** no further request is made and no duplicate story appears.
4. **Given** the page is loading more stories, **when** the visitor switches province, **then** the older pending response never adds stories from the previous province.

### User Story 2 - Start on the busiest province and return to my choice (Priority: P1)

A first-time visitor sees the province with the most published stories selected. A returning visitor sees the province they last chose themselves; that choice survives reloads and return visits.

**Why this priority**: The page currently selects the province of the newest story, which is unstable and can show an empty or arbitrary region. Remembering the visitor's own choice makes the page predictable.

**Independent Test**: Clear site storage, load the page and verify the highest-count province is selected; manually choose another province, reload, and verify that province is restored.

**Acceptance Scenarios**:

1. **Given** no saved province and published stories in several provinces, **when** the page loads, **then** the province with the highest published story count is selected.
2. **Given** a visitor manually selects a different province, **when** they reload or return later, **then** that province is selected again.
3. **Given** a saved province no longer has published stories, **when** the page loads, **then** the highest-count province is selected and the stale saved value no longer overrides it.
4. **Given** the visitor never selected a province manually, **when** the page loads repeatedly, **then** the automatic highest-count selection is recomputed rather than stored as a manual choice.

### User Story 3 - Trust the province filter and counts (Priority: P1)

A visitor only ever sees stories that belong to the selected province, and the story count beside the province name is the full published total for that province, independent of how many stories have loaded so far.

**Why this priority**: Mixed-province feeds and counts that change while scrolling make the map misleading. Filtering must be enforced where the data is read, not by discarding already-downloaded rows.

**Independent Test**: Select a province with a known total, verify the heading shows that total while only three cards are loaded, then switch to another province and verify no story from the first province remains.

**Acceptance Scenarios**:

1. **Given** a selected province, **when** its stories are read, **then** only stories whose recorded location resolves to that province are returned.
2. **Given** the selected province has more stories than the current page, **when** the first page is displayed, **then** the heading and province controls show the full published count for that province.
3. **Given** a new story is published, **when** the page next refreshes its counts, **then** the province total and the overall total reflect it without requiring a reload.
4. **Given** the visitor switches province, **when** the new stories render, **then** no card, marker count or recent item from the previous province remains in the province view.

### User Story 4 - Present demonstration stories naturally (Priority: P1)

A visitor reading the existing demonstration stories sees natural first-name-only authors instead of developer-style labels. Only the leading demo seed marker may be removed from positively identified demonstration stories; the remaining story wording, dates, creation dates and province assignments stay unchanged.

**Why this priority**: Developer identifiers are visible on the public page today and undermine the community presentation. The records are demonstration content, not real contributor submissions.

**Independent Test**: Inspect the published records identified as demonstration stories and verify only their author display names and leading [dev-seed] markers changed; verify genuine contributor records and every other field are unchanged.

**Acceptance Scenarios**:

1. **Given** the demonstration records with developer-style author names, **when** their author presentation is corrected, **then** each shows a natural, fictional, first-name-only display name.
2. **Given** a demonstration record, **when** it is corrected, **then** only the leading [dev-seed] marker is removed from its story text; the remaining wording, creation date, published date and province assignment are unchanged and it is still visible.
3. **Given** a genuine contributor record, **when** the demonstration authors are corrected, **then** that record is untouched.
4. **Given** a record that cannot be positively identified as demonstration content, **when** the correction is applied, **then** the record is left unchanged and reported instead of rewritten.

### Edge Cases

- A province with zero published stories still selects cleanly and shows the existing empty-state message.
- The published total for a province is below the page size; the feed shows them all with no further requests.
- The database connection is unavailable or the table is missing; the existing "database needs to be available" message remains and the page does not crash.
- A story's location does not resolve to a Canadian province; it is excluded from province feeds and province counts, as today.
- A shared story link points at a story outside the first page; the linked story still opens in its province without loading the whole collection.
- The Last 24 Hours filter has fewer than three matching stories, including the empty case; markers, counts, the feed and the empty state stay consistent.
- Two visitors in different provinces page independently; one visitor's loaded pages never leak into another's view.
- The same province is selected again; the feed resets to its first page rather than showing stale rows.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The page MUST request and render a first page of exactly three published stories for the selected province.
- **FR-002**: The page MUST automatically request and append the next three stories when the visitor scrolls near the bottom of the story list, until the province has no more stories.
- **FR-003**: The page MUST NOT download the full published story collection in order to display a province feed.
- **FR-004**: Province filtering MUST be applied where stories are read from the database, using the same province resolution rules as the existing map grouping.
- **FR-005**: Switching province MUST replace the feed with that province's first page; stories from another province MUST NOT be rendered in the province view.
- **FR-006**: The selected province's heading MUST show the full published story count for that province, independent of how many story cards are loaded.
- **FR-007**: Province controls and map markers MUST use the full published counts, not the counts of currently loaded cards.
- **FR-008**: Counts MUST refresh while the page remains open so newly published stories are reflected without a reload.
- **FR-009**: With no stored choice, the page MUST select the province with the highest published story count; ties MUST resolve deterministically.
- **FR-010**: A province chosen manually by the visitor MUST be stored locally and restored on later visits, and MUST be ignored if it is not a valid region or no longer has published stories.
- **FR-011**: The automatic default selection MUST NOT be stored as if it were a manual choice.
- **FR-012**: The existing All-Time and Last 24 Hours filter MUST continue to scope the feed, the marker counts and recent activity consistently.
- **FR-013**: Shared story links MUST continue to open the referenced story, its province and its full text.
- **FR-014**: The existing card, panel, marker, province-control, modal, celebration, sharing, submission and navigation presentation MUST remain unchanged in design and behaviour.
- **FR-015**: Demonstration story authors identified positively by developer-style display names and seed markers MUST be changed to natural fictional first names without surnames or developer wording; only their display name and leading [dev-seed] marker may change.
- **FR-016**: Every existing story MUST be preserved; no story may be deleted, replaced, recreated or lost. For positively identified demo rows only, the leading [dev-seed] marker may be removed; the remaining story wording, dates and province assignment MUST remain unchanged.
- **FR-017**: Recent Canadian Activity MUST display up to three newest published stories for each province or territory in the active time window, with a maximum of 39 entries across all 13 regions.
- **FR-017**: Genuine contributor records and any uncertain record MUST NOT be modified.

### Key Entities *(include if feature involves data)*

- **Community Story**: A published visitor story with an identifier, author display name, location text, story text, approval state and creation timestamp.
- **Province Group**: One of the thirteen Canadian provinces and territories, derived from a story's recorded location, used for filtering, counts and map markers.
- **Story Page**: A bounded, ordered slice of one province's published stories.
- **Province Summary**: Published counts per province, the overall total, and the highest-count province used for the automatic selection.
- **Saved Province Preference**: The visitor's last manually selected region, stored locally in the browser.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A first visit renders exactly three story cards for the selected province, regardless of the province's total.
- **SC-002**: Scrolling to the end of a seven-story province shows three, then six, then seven distinct cards, and then stops requesting.
- **SC-003**: The count displayed for the selected province equals its published total while as few as three cards are loaded.
- **SC-004**: Switching provinces produces zero story cards from any other province.
- **SC-005**: A fresh visit selects the province with the highest published count; a visit after a manual choice restores that choice.
- **SC-006**: The set of published story identifiers, narrative wording after removal of only the leading demo marker, creation timestamps and province assignments is identical before and after the author-presentation correction.
- **SC-007**: Recent Canadian Activity displays no more than three stories per province or territory, never exceeds 39 entries, and respects the selected All-Time or Last 24 Hours window.
- **SC-007**: No genuine contributor author name changes.
- **SC-008**: The existing Lucky Stories page layout, controls and unrelated behaviour show no visible change.

## Assumptions

- The existing `lucky_stories` table and its approved/published flag remain the source of truth; no schema change is required.
- "Published" means the existing approved state, which the page already treats as public.
- The existing location-to-province resolver remains the authority for province membership.
- The demonstration records are the rows whose author display names begin with the developer prefix `Dev` and whose story text carries the seed marker; the genuine contributors are the remaining rows. This identification was checked against the live published story feed on 2026-11-08.
- Only the leading [dev-seed] marker was removed from the owner-identified demo rows as part of the reported cleanup; the remaining narrative wording, dates, approval state and province assignments were preserved. No further story text changes are authorized.
- This workspace cannot reach the Neon SQL endpoint with write credentials, so the author-presentation data correction may require an owner-run statement; that limitation is tracked rather than simulated in application code.
- The 495 MB production build ceiling and all existing verification gates remain in force.

## Follow-up: Approved homepage responsive visual QA

The existing homepage hero composition is an approved design and must remain intact. This follow-up verifies that the same composition remains usable on narrow phones, standard phones, tablets and desktop widths. It is not a redesign request: preserve the existing artwork, wording, navigation destinations, animation, reduced-motion behavior and page content.

### Additional acceptance scenarios

1. Given a visitor opens the homepage on a narrow phone, standard phone, tablet or desktop, when the first screen renders, then the primary navigation, hero artwork, welcome panel and Explore interaction remain within the viewport without horizontal page overflow or clipped text.
2. Given the visitor changes orientation or uses a different supported viewport width, when the responsive layout reflows, then navigation links remain visible and usable and the welcome text wraps naturally.
3. Given a visitor uses keyboard navigation or reduced-motion preferences, when they reach the hero interaction, then the existing focus indicator and reduced-motion behavior remain available.

### Additional measurable success criteria

- **SC-009**: The homepage first-screen responsive checks pass at 320, 360, 390, 412, 768, 820, 1024, 1180 and 1440 CSS pixels with no horizontal page overflow, clipped hero text or navigation links outside their navigation surface.
- **SC-010**: The approved 1440x900, 390x844 and 412x915 Playwright screenshot baselines match the current approved rendering after regeneration from the actual browser output.
