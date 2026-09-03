LuckyPickCanada Agent Guide

This file is the permanent operating guide for AI coding agents working in this repository.

1. Core Reasoning

- Understand the user’s actual goal before changing code.
- Treat the current repository and working tree as the primary source of truth.
- Separate the requested outcome from the visible symptom.
- Investigate the root cause before proposing or implementing a fix.
- Do not treat the first plausible explanation as proven; look for evidence that could disprove it.
- For non-trivial work, consider the viable approaches and choose the one that is most correct, simple, maintainable, compatible, and appropriately scoped.
- Prefer the smallest correct change over broad rewrites.
- Preserve working architecture unless there is a demonstrated reason to change it.
- Never guess file paths, APIs, framework behavior, configuration, test results, deployment state, or tool capabilities.
- When uncertain, inspect the repository, run the relevant check, or use an authoritative connected source.

2. Investigation Before Implementation

Before modifying code:

- Inspect the relevant files, components, styles, configuration, and data flow.
- Trace the behavior from user action to rendered result.
- Identify the actual dependency chain causing the problem.
- Check existing implementations before creating new ones.
- Look for existing shared utilities, components, hooks, styles, and libraries that should be reused.
- Distinguish stale, unused, duplicated, and active code.
- For layout or UI problems, inspect actual DOM structure, computed styles, sizing, positioning, and render order instead of guessing from class names.
- For state, persistence, APIs, or database behavior, inspect the real source of truth.

Do not make cosmetic patches to hide a structural problem.

3. MCP / Connected Tool Usage

Use the appropriate connected tool whenever it can establish a fact more reliably than inference.

GitHub

Use GitHub for current repository truth:

- source files
- branches
- commits
- pull requests
- issues
- workflows
- GitHub configuration

Context7

Use Context7 when current, version-specific, or authoritative technical documentation matters, especially for:

- Next.js
- React
- Tailwind CSS
- browser APIs
- Web Audio
- animation libraries
- accessibility behavior
- Cloudflare
- Wrangler
- OpenNext
- third-party libraries and SDKs

Use the repository’s installed versions as the compatibility baseline. Do not rely on remembered or outdated APIs when authoritative documentation is available.

Neon

Use Neon when the task materially involves PostgreSQL or Neon:

- schema
- tables
- queries
- migrations
- indexes
- database configuration
- persistence
- data integrity
- branches
- connection behavior
- Neon-specific features

Use actual database state when it is relevant. Do not use Neon for unrelated frontend or documentation work.

General Tool Rule

- Prefer evidence from connected tools over assumptions.
- Use multiple sources when the task crosses repositories, libraries, or database boundaries.
- Do not invoke tools merely to appear thorough; use them when they improve factual accuracy or reduce uncertainty.

4. Implementation Discipline

- Make changes only within the authorized scope.
- Reuse existing architecture and dependencies whenever practical.
- Avoid unnecessary dependencies, abstractions, duplication, and rewrites.
- Keep unrelated systems untouched.
- Do not weaken security, validation, accessibility, or error handling to make a task appear complete.
- Preserve existing contracts unless the task explicitly requires changing them.
- Keep changes understandable and maintainable.
- Handle lifecycle, cleanup, repeated interaction, loading, error, and edge states where relevant.
- Do not solve positioning problems with negative margins, arbitrary transforms, absolute positioning, overflow tricks, or similar visual hacks when the real problem is structural.
- Do not replace working systems with static mocks merely to satisfy a visual or functional check.

5. Protected Systems

Do not modify these systems unless the user explicitly authorizes the change:

- Stripe and payment/checkout logic
- Gift/payment fulfillment
- Email delivery
- Authentication
- Cloudflare Turnstile/security controls
- Database access or data integrity
- Environment variables or secrets
- Cloudflare account/settings
- Wrangler configuration
- OpenNext deployment configuration

A task involving one of these systems requires deliberate inspection of the existing implementation and careful scope control.

6. LuckyPickCanada Product Guardrails

Preserve the product’s established identity and behavior unless the user explicitly asks for a change.

- Premium Canadian visual identity
- Northern Lights / Aurora atmosphere
- Maple leaf symbolism
- Starry-night / mystical aesthetic
- Gold, glass, glow, depth, and polished typography
- Purposeful animation and interaction
- Responsive and accessible behavior

Protect existing product rules and data, including:

- Lucky Pick generation and reveal behavior
- Lucky Card rarity, weighted selection, card IDs, artwork, and anti-repeat behavior
- Lucky Meter daily-use/reset behavior and reveal sequence
- Crystal Ball / Oracle API and result behavior
- Community/map/story relationships

Do not casually replace, merge, simplify, or restructure product data or selection logic.

7. Verification Is Part of the Work

A change is not complete merely because the code compiles.

Verify the behavior the user actually requested.

- Run the relevant tests, linting, type checks, or build checks when applicable.
- For UI work, inspect the rendered result and relevant responsive states.
- For CSS issues, verify the style is actually imported, built, delivered, and applied by the browser.
- For animation and audio, verify timing, sequencing, synchronization, cleanup, repeated triggering, lifecycle behavior, browser restrictions, and reduced-motion behavior where relevant.
- For database work, verify against the actual database when appropriate.
- For deployment-related work, verify the relevant generated output and configuration rather than assuming a successful build means a successful deployment.
- Never claim a check passed unless it was actually run and passed.
- Never game verification by weakening tests, deleting assertions, hiding errors, disabling validation, or changing the verification process instead of fixing the underlying problem.

8. Final Self-Review

Before declaring the task complete:

- Re-read the user’s request.
- Confirm every requested requirement was addressed.
- Review the final diff for unintended changes.
- Check for regressions and broken existing behavior.
- Remove unnecessary code or dependencies introduced during the work.
- Confirm protected systems were not changed without authorization.
- Report what was actually changed and what was actually verified.
- Clearly distinguish verified facts from remaining uncertainty.

When the evidence does not support a conclusion, say so and continue investigating rather than guessing.
