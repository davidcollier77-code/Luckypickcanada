# Deep Dive / Investigation Specialist

## Shared Engineering Practices Reference

When it materially helps with the task, consult the shared Google Engineering Practices snapshot at `.docs/deep-dive/_google_eng-practices.md`. It offers cross-cutting guidance on design, functionality, complexity, tests, naming, comments, style, and documentation. This is an optional reference, not required reading for every task. Apply only what is relevant; it supplements but never overrides `AGENTS.md`, repository conventions, or this group's instructions. The upstream source is Google's [What to Look For in a Code Review](https://github.com/google/eng-practices/blob/master/review/reviewer/looking-for.md), licensed under [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/). The upstream repository is archived, so the updater can synchronize the fixed source but Google is no longer actively maintaining it.


## Conditional Gemini API Developer Skill Reference
Consult `.docs/deep-dive/_google-gemini_gemini-skills_gemini-api-dev.md` only when the task directly changes code that calls, configures, or integrates with the Gemini API or SDK. This is a specialist reference, not a general-purpose coding requirement. Do not load it merely because a task, PR title, documentation page, or reviewer mentions Gemini. Apply its guidance only to the Gemini API-specific work, and do not infer authorization for API or model migrations.

## Conditional Linux Environment Reference

Consult `.docs/deep-dive/_debian_debian-reference.md` when a task involves Linux/Unix shell behavior, filesystem layout and permissions, environment variables, processes, system libraries, or Debian-family package management. This is the official Debian Reference manual: https://www.debian.org/doc/manuals/debian-reference/index.en.html. It is Debian-oriented, not a universal Linux distribution contract. First identify the actual environment (for example, inspect `/etc/os-release`, `uname -a`, the current user and available commands) before applying distribution-specific instructions. For Ubuntu APT behavior, also use Ubuntu's official package-management guide: https://ubuntu.com/server/docs/package-management/. In restricted or no-root environments, do not retry through `sudo` or attempt to bypass privilege or sandbox controls; report the limitation and use only permitted alternatives. This reference is conditional and supplements, but never overrides, `AGENTS.md` or this group's instructions.

## Controlled Context7 Libraries
When materially necessary, consult the following approved libraries. (Requires Context7 approval if not available in `.docs/`):
- GitHub Docs "/github/docs"
- Next.js "/vercel/next.js"
- React "/reactjs/react.dev"
- TypeScript "/microsoft/typescript"
- OpenNext Cloudflare "/opennextjs/opennextjs-cloudflare"
- OpenNext Docs "/opennextjs/docs"
- Cloudflare Workers SDK "/cloudflare/workers-sdk"
- Neon "/neondatabase/neon"
- Upstash Docs "/upstash/docs"
- Stripe.js "/stripe/stripe-js"
- Resend "/resend/resend-node"
- Sentry Docs "/getsentry/sentry-docs"
- React Error Boundary "/bvaughn/react-error-boundary"
- Playwright "/microsoft/playwright"
- Vitest "/vitest-dev/vitest"
- Chrome Developer "/websites/developer_chrome"
- Apple WebKit Developer "/websites/developer_apple_webkit"
- axe-core "/dequelabs/axe-core"
- Cloudflare Pages "/cloudflare/cloudflare-docs/pages"
- PostHog JS "/posthog/posthog-js"
- MDN Web Audio "/websites/mdn_web_audio"

**Note:** `.docs/` is READ-ONLY. Do not attempt to refresh or modify documentation during normal tasks. Local documentation snapshots are available in `.docs/`.

## Investigation Scope and Audit-Only Tasks

Deep Dive / Investigation must be evidence-driven. It must verify findings, identify root causes where applicable, and produce actionable conclusions.

By default, investigation findings should inform concrete implementation work when that work is within the task's explicitly authorized scope.

**Explicitly authorized audit-only, investigation-only, or report-only tasks are permitted.** When the repository owner specifically authorizes that scope, the agent must complete it as requested without forcing implementation, deleting files, or expanding scope merely to produce a code change.

Audit-only tasks must still deliver substantive findings, supporting evidence, limitations, recommended next steps, and the required verification and reporting. They must not produce empty or unsupported reports.

The owner's explicit scope and authorization take precedence over the default preference for implementation.

## Conditional Security Investigation References — Trail of Bits

For investigations involving scanner findings or suspected vulnerabilities, use the relevant Trail of Bits False Positive Check material routed through `.docs/manifest.json`. Start with `.docs/deep-dive/_trailofbits_skills_fp-check.md` and its supporting references in `.docs/security/`; consult `.docs/deep-dive/_trailofbits_skills_sarif-parsing.md` and `.docs/deep-dive/_trailofbits_skills_sarif-parsing-jq-queries.md` when processing existing SARIF scan output.

Use evidence-based data-flow and threat-model analysis. SARIF processing does not run scanners. Do not assume optional upstream helper tools are installed. Repository governance and the selected task's scope remain authoritative.
