# Research: Canonical Lucky Stories Province Selection

**Date**: 2026-11-13

## Existing Source of Truth

The canonical `storyProvinces` collection is currently embedded in the server-side `app/lucky-stories.js` module. That module also imports database and Cloudflare runtime code, so it must not be imported by the browser component. The province records will be extracted unchanged into a small, dependency-free shared module and re-exported by the existing server module to preserve current imports.


The existing `storyProvinces` collection in `app/lucky-stories.js` defines thirteen province/territory records. Each record has a two-letter region code and a canonical full English name. The map component maintains the same region code/name associations for its map controls.

The exact canonical display and submission names are:

1. Alberta
2. British Columbia
3. Manitoba
4. New Brunswick
5. Newfoundland and Labrador
6. Northwest Territories
7. Nova Scotia
8. Nunavut
9. Ontario
10. Prince Edward Island
11. Quebec
12. Saskatchewan
13. Yukon

## Findings

- The Community Stories modal currently renders `location` as an optional free-text input.
- The existing server validator currently permits arbitrary optional location text.
- The existing `getStoryProvince` resolver accepts canonical names as well as legacy codes, aliases and city-plus-region strings. This is used to read historical records and must not be narrowed.
- The public POST route already passes the submitted `location` value to `createLuckyStory`; the field name and request flow can remain unchanged.
- Existing Turnstile, duplicate/spam checks, name/story validation, redirects and map refresh behavior do not need to change.

## Decisions

- Reuse `storyProvinces` as the single authoritative option list rather than hard-coding a duplicate list in the UI.
- Use each record's full `name` as the HTML option value. The region code remains an internal map identifier and is not submitted as the location.
- Require the field in the browser and independently validate it on the server. The server stores the matched canonical name.
- Keep `getStoryProvince` and historical record handling unchanged.
- No schema, data migration, new dependency, external API contract or deployment configuration change is needed.
