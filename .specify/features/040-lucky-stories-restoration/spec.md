# Restore Existing Lucky Stories Visibility

## Task Group
Troubleshooting

## Problem
The Lucky Map is showing the user none of their previous stories. The current production Neon database was inspected read-only and contains eight approved story records with locations that the application recognizes as Canadian provinces or territories. The visual-polish PR did not delete or alter those records.

## Scope
- Ensure the Lucky Map fetches current story data immediately after it mounts, rather than waiting for its first polling interval.
- Prevent the Lucky Stories GET API from reusing or advertising stale cached responses.
- Keep the refresh request URL stable; freshness must not depend on unique timestamp query parameters.
- Prevent overlapping API refresh requests when one poll remains pending beyond the 60-second interval.
- Add regression coverage for no-store response headers, returned stories, stable request URLs, and single-in-flight polling.

## Explicit Exclusions
- Do not insert, edit, delete, or approve database records.
- Do not invent replacement stories.
- Do not alter story wording, artwork, layout, navigation, security checks, the submission flow, or visual styling.

## Acceptance Criteria
- The map immediately requests current story data after opening.
- Every refresh uses the stable `/api/lucky-stories` URL with browser caching disabled.
- At most one refresh request is active; slow requests do not cause overlapping poll pile-ups.
- The API returns data with no-store headers for both configured and unavailable states.
- Existing database stories remain unchanged and are eligible to display.
- Regression tests cover response caching behavior and the story payload.
