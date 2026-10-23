# Restore Existing Lucky Stories Visibility

## Task Group
Troubleshooting

## Problem
The Lucky Map is showing the user none of their previous stories. The current production Neon database was inspected read-only and contains eight approved story records with locations that the application recognizes as Canadian provinces or territories. The visual-polish PR did not delete or alter those records.

## Scope
- Ensure the Lucky Map fetches current story data immediately after it mounts, rather than waiting for its first polling interval.
- Prevent the Lucky Stories GET API from reusing or advertising stale cached responses.
- Add regression coverage for no-store response headers and preservation of returned stories.

## Explicit Exclusions
- Do not insert, edit, delete, or approve database records.
- Do not invent replacement stories.
- Do not alter story wording, artwork, layout, navigation, security checks, the submission flow, or visual styling.

## Acceptance Criteria
- The map immediately requests current story data after opening.
- The API returns data with no-store headers for both configured and unavailable states.
- Existing database stories remain unchanged and are eligible to display.
- Regression tests cover response caching behavior and the story payload.
