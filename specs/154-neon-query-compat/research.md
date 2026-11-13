# Research: Neon 1.x Parameterized Query Compatibility

## Finding

The repository upgraded `@neondatabase/serverless` from 0.10.4 to 1.2.0 in PR #1883.
The Lucky Stories data module still used the pre-1.0 conventional call form
`database(sqlText, params)` in four read helpers:

- `fetchProvinceCounts`
- `fetchRecentStories`
- `fetchStoryPage`
- `fetchLinkedStory`

Neon's 1.0.0 changelog states that the HTTP query function can now only be called as a
tagged-template function. A manually parameterized query must use
`sql.query(sqlText, params)`. The tagged-template calls used for table setup and story
insertion remain supported.

## Decision

Change only those four operations to `database.query(sqlText, params)`. Preserve the
SQL text, numbered placeholders, parameter arrays, filters, result mapping and error
handling. Keep `@neondatabase/serverless` 1.2.0; do not roll back the dependency.

Update the existing pagination test mock so the callable client only accepts real tagged
templates and exposes `.query` separately. Exercise all four read paths in a regression
test. This makes the old conventional-call pattern fail the test.

## Sources

- Neon serverless driver changelog: https://github.com/neondatabase/serverless/blob/main/CHANGELOG.md
- Neon driver configuration: https://github.com/neondatabase/serverless/blob/main/CONFIG.md
- Neon serverless driver documentation: https://neon.com/docs/serverless/serverless-driver
- PR #1883 in this repository: https://github.com/davidcollier77-code/Luckypickcanada/pull/1883

## Alternatives Rejected

- **Downgrade Neon**: Rejected. The installed 1.2.0 API is supported and the incompatible
  call sites can be updated without undoing the dependency upgrade.
- **Change Cloudflare secrets or connection strings**: Rejected. Production has the
  expected `DATABASE_URL` and `POSTGRES_URL` secrets; the failure is the query call API.
- **Change database/schema or recreate records**: Rejected. The 21 approved records remain
  present; this is an application-driver compatibility defect.
