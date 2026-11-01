# Testing Specialist

## Shared Engineering Practices Reference

When it materially helps with the task, consult the shared Google Engineering Practices snapshot at `.docs/testing/_google_eng-practices.md`. It offers cross-cutting guidance on design, functionality, complexity, tests, naming, comments, style, and documentation. This is an optional reference, not required reading for every task. Apply only what is relevant; it supplements but never overrides `AGENTS.md`, repository conventions, or this group's instructions. The upstream source is Google's [What to Look For in a Code Review](https://github.com/google/eng-practices/blob/master/review/reviewer/looking-for.md), licensed under [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/). The upstream repository is archived, so the updater can synchronize the fixed source but Google is no longer actively maintaining it.


## Controlled Context7 Libraries
When materially necessary, consult the following approved libraries. (Requires Context7 approval if not available in `.docs/`):
- GitHub Docs "/github/docs"
- Next.js "/vercel/next.js"
- React "/reactjs/react.dev"
- TypeScript "/microsoft/typescript"
- React Testing Library "/testing-library/react-testing-library"
- Playwright "/microsoft/playwright"
- Vitest "/vitest-dev/vitest"
- Zod "/colinhacks/zod"
- Sentry Docs "/getsentry/sentry-docs"
- Chrome Developer "/websites/developer_chrome"
- Apple WebKit Developer "/websites/developer_apple_webkit"
- axe-core "/dequelabs/axe-core"

**Note:** `.docs/` is READ-ONLY. Do not attempt to refresh or modify documentation during normal tasks. Local documentation snapshots are available in `.docs/`.

Testing must require real execution/verification where practical, not code inspection alone.
