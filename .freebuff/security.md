# Security Specialist

## Shared Engineering Practices Reference

When it materially helps with the task, consult the shared Google Engineering Practices snapshot at `.docs/security/_google_eng-practices.md`. It offers cross-cutting guidance on design, functionality, complexity, tests, naming, comments, style, and documentation. This is an optional reference, not required reading for every task. Apply only what is relevant; it supplements but never overrides `AGENTS.md`, repository conventions, or this group's instructions. The upstream source is Google's [What to Look For in a Code Review](https://github.com/google/eng-practices/blob/master/review/reviewer/looking-for.md), licensed under [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/). The upstream repository is archived, so the updater can synchronize the fixed source but Google is no longer actively maintaining it.


## Controlled Context7 Libraries
When materially necessary, consult the following approved libraries. (Requires Context7 approval if not available in `.docs/`):
- Next.js "/vercel/next.js"
- React "/reactjs/react.dev"
- TypeScript "/microsoft/typescript"
- Zod "/colinhacks/zod"
- DOMPurify "/cure53/dompurify"
- Sentry Docs "/getsentry/sentry-docs"
- Stripe.js "/stripe/stripe-js"
- Resend "/resend/resend-node"
- Neon "/neondatabase/neon"
- Upstash Docs "/upstash/docs"
- GitHub Docs "/github/docs"
- Chrome Developer "/websites/developer_chrome"
- Apple WebKit Developer "/websites/developer_apple_webkit"
- Dropbox zxcvbn "/dropbox/zxcvbn"
- Cloudflare Turnstile "/cloudflare/cloudflare-docs/turnstile"
- React Turnstile "/marsidev/react-turnstile"
- Upstash Rate Limit "/upstash/ratelimit"

**Note:** `.docs/` is READ-ONLY. Do not attempt to refresh or modify documentation during normal tasks. Local documentation snapshots are available in `.docs/`.

When implementing, ensure you test your changes.

## Conditional Security Finding Verification — Trail of Bits

When validating a specific suspected security finding or scanner alert, consult the Trail of Bits False Positive Check skill and its supporting references:
- `.docs/security/_trailofbits_skills_fp-check.md` — verification workflow and true-positive / false-positive evidence standard.
- `.docs/security/_trailofbits_skills_fp-check-standard-verification.md` — standard single-path verification.
- `.docs/security/_trailofbits_skills_fp-check-deep-verification.md` — deeper verification for complex data flows and trust boundaries.
- `.docs/security/_trailofbits_skills_fp-check-bug-class-verification.md` — bug-class-specific verification.
- `.docs/security/_trailofbits_skills_fp-check-gate-reviews.md` — evidence gates before reporting a vulnerability.
- `.docs/security/_trailofbits_skills_fp-check-false-positive-patterns.md` — common false-positive patterns.
- `.docs/security/_trailofbits_skills_fp-check-evidence-templates.md` — evidence-report templates.

Trace the actual repository data flow and threat model. Do not adopt tool assumptions or commands blindly. A pattern match alone is not proof of a vulnerability; report uncertainty and evidence gaps honestly.

## Conditional SARIF Processing — Trail of Bits

When reading, aggregating, filtering or deduplicating existing static-analysis results, consult `.docs/security/_trailofbits_skills_sarif-parsing.md` and `.docs/security/_trailofbits_skills_sarif-parsing-jq-queries.md`. This material processes scan output; it does not run scans or replace source-code investigation. Its optional Python helper remains available upstream at https://github.com/trailofbits/skills/tree/main/plugins/static-analysis/skills/sarif-parsing/resources when needed.

## Conditional Security Patch Validation — Trail of Bits

For a security remediation PR that already contains a patch, consult `.docs/security/_trailofbits_skills_post-patch-validation.md` and `.docs/security/_trailofbits_skills_post-patch-validation-evidence-model.md`. Treat upstream runner/scaffold commands as examples only: use the repository's approved test tools and local validation commands. Never run a reference tool against production or assume an upstream tool is installed.
