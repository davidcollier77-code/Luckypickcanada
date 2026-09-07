# Permanent Agent-Governance & Operating Rules

The following rules form the core, authoritative, and permanent governance system for all agents operating in this repository. They are mandatory and must be followed for all future tasks. There are no competing or secondary governance policies.

## 1. Mandatory AI Collaboration
Jules + Gemini are mandatory collaborators for EVERY repository task. This requirement applies regardless of task type, task group, difficulty, whether the task is routine or exceptional, whether it is classified as Miscellaneous / Cross-Cutting, or whether additional documentation or research is required. Task-group routing does not replace the Jules + Gemini requirement. They must genuinely participate in the work, and the final report must explicitly detail what each contributed. Never claim an AI or resource was used unless it was genuinely consulted.

## 2. Approved Resources Hierarchy
Existing approved libraries, Context7 resources, repository tooling, and capabilities are the default and preferred solutions. Before introducing anything new, agents must inspect and make reasonable use of what the repository already has. Follow this strict order:

1. Identify the appropriate existing task group.
2. Read the relevant repository instructions and existing local resources.
3. Read the relevant documentation already present in `.docs`.
4. Use existing project capabilities, libraries, scripts, APIs, tooling, workflows, and other already-approved resources.
5. Use Jules + Gemini as mandatory collaborators.
6. Use authoritative/current documentation when genuinely required and permitted.
7. Use Context7 only when a genuine information or capability gap remains after the approved resources above have been checked.
8. Consider a new dependency or external capability only as a true last resort, only when genuinely necessary, and only when authorized.

Do not add technology simply because it is newer, easier, or more convenient.

## 3. Task Group Routing
Before making any changes, determine which of the existing 8 task groups genuinely applies. You must not create a ninth permanent task group. The exactly 8 groups are:

1. Creation (`.jules/creation.md`)
2. Troubleshooting (`.jules/troubleshooting.md`)
3. Polishing (`.jules/polishing.md`)
4. Testing (`.jules/testing.md`)
5. Security (`.jules/security.md`)
6. Audio (`.jules/audio.md`)
7. Deep Dive / Investigation (`.jules/deep-dive.md`)
8. SEO (`.jules/seo.md`)

Preserve this exact group structure. The Context7 resource for Android Developers (`/android/developers`) belongs under the existing **Deep Dive / Investigation** group. Use it when relevant for platform, API, and tooling questions. Do not create an Android-specific task group.

## 4. Miscellaneous / Cross-Cutting Fallback
If, and ONLY if, a task genuinely does not fit any of the 8 existing groups, use the **Miscellaneous / Cross-Cutting** fallback.
- **This is a fallback mechanism only. It is NOT a ninth task group and NOT a general convenience category.**
- Do not use this to bypass normal task-group routing, required resources, security controls, protected systems, documentation requirements, or verification.
- **Jules + Gemini remain mandatory when using this fallback.**
- This fallback does not grant permission to use arbitrary tools, libraries, dependencies, MCP services, or external capabilities.
- The ONLY approved resources for this fallback are:
  - Jules Documentation ("jules.google/docs")
  - Jules API ("developers.google.com/jules/api")
  - Gemini CLI ("/google-gemini/gemini-cli")
  - Gemini API ("/websites/ai_google_dev_gemini-api")

## 5. Local `.docs` Documentation
The repository's `.docs` directory is a LOCAL DOCUMENTATION LIBRARY.
When an agent is told to read, consult, review, verify, or use documentation in `.docs`, this means **read the documentation files already present in the repository.**

It does **NOT** mean:
- Go to Cloudflare.
- Connect to Cloudflare.
- Go to Context7.
- Connect to Context7.
- Invoke Context7/MCP merely because the documentation concerns a library, framework, or service.
- Access an external service simply because its documentation is represented by a file in `.docs`.

A `.docs` entry is local documentation, not authorization to access the external service it describes.

## 6. Context7 — Last Resort Only
Context7 is an approved documentation and research resource, but it is a **LAST RESORT**.
It may be used only when the other approved and available resources have genuinely been exhausted and a specific information or capability gap remains.

Before relying on Context7, determine:
- exactly what information or capability is missing;
- what approved resources were already checked;
- why those resources were insufficient;
- what Context7 is expected to provide;
- the applicable task group.

If the required information already exists in `.docs` or another approved local repository resource, use the local resource instead of Context7.

Using Context7 does **NOT**:
- authorize installing a dependency;
- authorize changing the architecture;
- authorize adding an external capability;
- authorize MCP.

## 7. MCP Usage (Absolute Last Resort)
MCPs are an **ABSOLUTE LAST RESORT** and must never be treated as a normal documentation mechanism. You may only rely upon an MCP after ALL other resources in the Resource Hierarchy have been exhausted.

Do not connect to or invoke Context7, Cloudflare, Neon, Stitch, or other MCP services merely to read documentation that is already available locally. A connection or initialization event does not by itself constitute meaningful use of an external capability.

If an MCP is ever genuinely required, the reason must be identifiable, and the normal authorization/resource rules must still be followed.

## 8. New Dependencies & Adopted Libraries
Do not introduce a new package, library, service, tool, API, or dependency when an existing approved capability already satisfies the requirement. New dependencies and external capabilities remain an absolute last resort. Do not interpret documentation research as permission to introduce new technology.

If a new library is genuinely necessary and adopted:
- It must become part of the permanent system.
- It must be integrated into the existing approved library/resource system.
- It must be placed into the appropriate existing task group(s) in `.jules/`.
- The relevant documentation must be updated so future agents know it exists and why it was approved.

## 9. Protected Project Areas
Preserve the existing protections. Do not permit unrelated work to modify protected systems, including:
- **Stripe/payment functionality**: logic, products, or payment processing endpoints.
- **Database systems**: schema, state, and migrations.
- **Sensitive APIs**: routes handling payments, form submissions, emails, and the Gemini Oracle endpoint.
- **Authentication/Security systems**: authentication, authorization rules, access controls, Turnstile configuration, and security safeguards.
- **Secrets/Environment variables**.
- **Cloudflare deployment/configuration settings**: `wrangler.jsonc`, `open-next.config.ts`.
- **Resend email delivery**.
- **Other explicitly protected infrastructure**.

Any change involving payments, authorization, permissions, credentials, access control, or other privileged capabilities must explicitly identify what is required, why it is required, whether the task authorizes it, and use least privilege. Stop at an authorization boundary when required authority is unclear. Do not silently broaden permissions.

## 10. Application Audio Protection
Preserve application-audio protections exactly.
Howler.js is the preferred library for audio playback and layering, utilizing real audio assets located in the `public/sounds/` directory.
- **Do not remove, redesign, tune, replace, or refactor existing Lucky Meter, Lucky Card, Howler, or ZZFX application audio behavior as part of unrelated work.**
- Do not use governance cleanup as justification for changing application audio.
- Only obsolete infrastructure may be addressed when separately confirmed and genuinely necessary.

## 11. Required Operating Method (Implementation Philosophy)
For every development task, follow this required reasoning and implementation flow:

**Inspect → Identify → Understand → Verify → Choose → Research → Implement → Test → Double-check**

Do not treat successful compilation or build completion as sufficient proof when actual behavior can be verified. Verification must prove the requested behavior where practical (e.g., using browser/UI verification). Work surgically, make the smallest appropriate change, and do not make unrelated refactors.

## 12. Documentation Quality & Friday Refresh
Repository documentation must be genuine, useful, and verifiable. Do not create fabricated, placeholder, empty, or headings-only documentation, or misleading summaries presented as complete documentation.

**Friday Documentation Refresh:**
- The existing GitHub Actions workflow (`.github/workflows/refresh-docs.yml`) must run every Friday at 2:21 AM local time using `America/Halifax` (`cron: '21 2 * * 5'`, `timezone: 'America/Halifax'`). Do not replace this with UTC.
- A failed refresh must not overwrite the last-known-good result.
- A successful refresh must report `SUCCESS — [ISO 8601 timestamp with timezone] — VERIFIED`.
- A failed refresh must report `FAILED — [ISO 8601 timestamp with timezone] — VERIFICATION FAILED`.

## 13. Playwright CLI Artifact Rule
Playwright CLI generates temporary snapshots, traces, and debug artifacts inside the `.playwright-cli/` directory.
- These files are test/debug artifacts and must **NEVER** be committed to version control as repository content.
- Ensure `.playwright-cli/` remains ignored.

## 14. Local CI Verification
Before pushing code or opening a PR, verify changes pass CI locally using `act` when appropriate, or rely on `./jules-verify.sh`.
- Run the verification script: `bash scripts/act/run-act.sh "push -j <JOB_ID>"`
- **Mandatory Script Verification:** Run `./jules-verify.sh` to validate the build, linting, and types. You must not declare the task complete if this script fails.

## 15. Repository Architecture & Core Stack
* **Framework:** Next.js (App Router).
* **Styling:** Tailwind CSS.
* **Database:** PostgreSQL (accessed via Neon Serverless driver `@neondatabase/serverless`).
* **Deployment:** Cloudflare Pages/Workers (via OpenNext `opennextjs-cloudflare`).
* **Payments:** Stripe Checkout.
* **Email:** Resend.
* **Security:** Cloudflare Turnstile.
* **Audio:** Howler.js (layered audio/SFX using real assets).
* **Animations:** Framer Motion, HTML5 Canvas.

## 16. Development & Coding Conventions
* **React/Next.js:** Extract complex logic into custom hooks. Use Server Components where appropriate for data fetching. For client-side interactivity, mark components with `"use client"`.
* **Database Caching:** Do not apply global `fetchOptions: { next: { revalidate: X } }` to the shared `neon()` client instance, as it uses POST requests for all queries and risks caching writes. Use route-level ISR (`export const revalidate = ...`) instead.
* **On-Demand Revalidation:** Use `revalidatePath` or `revalidateTag` inside Server Actions or API routes when handling user submissions on statically regenerated pages to ensure instant updates.
* **Audio/Visual Timing:** Synchronize Web Audio directly to HTML5 Canvas visual spawn milestones (using `AudioContext.currentTime`) rather than relying on React state changes or `setTimeout`.
* **Performance:** Extract full-screen Canvas fill operations outside of particle rendering loops to prevent overdraw. Use `matchMedia('(prefers-reduced-motion: reduce)')` to respect reduced motion settings directly in the animation loop.
* **Gemini Oracle Integration:** The "Crystal Ball" feature (`functions/api/oracle.js`) calls the Gemini REST API directly (`generativelanguage.googleapis.com`) using `fetch`. Do not install the Gemini Node SDK; maintain the raw REST implementation. Always enforce strict prompt injection sanitization (stripping quotes, brackets, and newlines) before interpolating user input into the prompt.

## 17. Current Site Structure & Feature Map

This section provides a concise orientation map of the current LuckyPickCanada application so agents can quickly understand where major experiences, routes, and supporting code belong.

This is a living governance section. If an explicitly authorized application change materially changes the structure, routes, or relationships described here, this section MUST be updated as part of that same authorized change.


**Public Experience**

- "/" — Main homepage and primary LuckyPick experience, including the main number experience, daily lucky content, Lucky Day of the Week, Lucky Color, discovery/community entry points, Suggestion Box, and links to major experiences.
- "/lucky-meter" — Lucky Meter experience, including daily luck percentage, reveal animation, fortune, sharing, daily reset behavior, and countdown.
- Lucky Cards — Collectible card experience, including card selection, reveal, artwork, rarity/weighted selection, sharing, collection/binder functionality, and related card logic.
- "/lucky-map-of-canada" — Lucky Map of Canada experience, including the interactive map and community lucky stories.
- "/map" — Related map entry point into the Lucky Map experience.
- "/where-luck-has-been-found-in-canada" — Related map/discovery entry point into the Lucky Map experience.
- Crystal Ball / Oracle — The Gemini-powered Oracle experience and its supporting client/application areas.
- "/reveal/[revealId]" — Lucky Pick reveal/result experience.
- "/about" — About experience.

**Major Application Areas**

- "app/components" — Shared application components.
- "app/homepage" — Homepage-specific components and functionality.
- "app/lucky-meter-client" — Lucky Meter implementation and client-side functionality.
- "app/lucky-map-of-canada" — Lucky Map application area.
- "app/crystal-ball" — Crystal Ball/Oracle application area.
- "app/crystal-ball-client" — Crystal Ball client-side functionality.
- "app/developer-tools" — Developer tooling and supporting utilities.
- "app/api" — Application API routes and supporting API functionality.
- "app/admin" — Administrative functionality.

**Shared & Protected Systems**

Major shared or infrastructure systems include global theme/styling, shared layout/navigation, application assets and imagery, audio infrastructure, database/Neon services, APIs, Stripe/payment infrastructure, Resend, authentication/security, Cloudflare Turnstile, environment/secrets, and Cloudflare/OpenNext deployment configuration.

These systems remain subject to all existing protection and authorization rules in this file.

**Structural Change Rule**

When an explicitly authorized change materially alters the application's structure:

1. Identify the affected routes, components, and relationships.
2. Make only the smallest appropriate structural change.
3. Verify the resulting repository structure.
4. Update this Site Structure & Feature Map during the same authorized change.
5. Verify that the map accurately reflects the resulting repository.

This map is an orientation and governance aid. It does NOT grant permission to restructure or modify any feature.

If the actual repository structure conflicts with this section, do not guess or silently work around the discrepancy. Stop and verify the discrepancy. The verified repository state and explicitly authorized changes are authoritative, and this section must then be corrected to match reality.

## 18. Adopted Libraries & Project Resources

This section is a concise living inventory of the libraries, frameworks, services, development tools, and other permanent technical resources actually adopted by the LuckyPickCanada project.

It is an index, not a replacement for detailed documentation in ".docs".

**Inventory Maintenance Rule**

Whenever Jules introduces a new permanent dependency, library, framework, service, or other technical resource that is actually authorized and adopted by the project:

1. Confirm that it was genuinely necessary and authorized under the existing governance rules.
2. Add or update the appropriate documentation in ".docs" for the applicable task group.
3. Document the newly adopted resource here, including its purpose and approved role where useful.
4. Update this inventory in the SAME authorized change that adopts the resource.
5. Verify that the inventory matches the actual repository state.

When an adopted dependency or permanent resource is removed, this inventory and its corresponding documentation MUST also be updated.

**Current Adopted Resource Inventory**

*Core Application Stack*

- Next.js
- React
- TypeScript
- Tailwind CSS
- PostgreSQL / Neon Serverless
- OpenNext / "@opennextjs/cloudflare"
- Cloudflare Pages / Workers

*Application Libraries & Capabilities*

- Howler.js — application audio.
- Framer Motion — application animation/motion.
- HTML5 Canvas — graphics/visual rendering where used.
- Stripe — payment/checkout infrastructure.
- Resend — email infrastructure.
- Cloudflare Turnstile — bot/security protection.
- Gemini API via the project's approved REST integration — Oracle/AI functionality.

*Development & Verification Resources*

- Playwright — browser/application testing.
- Vitest — automated testing where configured and used.
- GitHub Actions — repository automation and CI.
- "act" — local GitHub Actions workflow verification where appropriate.
- Jules — required development/review collaborator.
- Gemini — required development/review collaborator.

**Resource Documentation**

- ".docs" is the project's detailed documentation library.
- Detailed documentation should remain organized according to the existing task-group structure and governance rules.
- This inventory is a concise index and MUST NOT be treated as a substitute for reading the relevant ".docs" material.

**Inventory Accuracy Rule**

The inventory must reflect verified reality.

If the repository contains a permanently adopted library, dependency, framework, service, or technical resource that is missing from this section, the inventory is out of date and must be corrected through an authorized change.

If an item listed here has been removed or was never actually adopted, it must not remain listed as an active adopted resource.

Do not add a resource merely because it was temporarily tested, mentioned in documentation, connected through an external service, or considered as an option.

The verified repository state and explicitly authorized project decisions are authoritative.

**Important Permission Rule**

The presence of a library or resource in this inventory does NOT automatically authorize its use for every task.

All existing task-group rules, protected-area rules, authorization requirements, resource hierarchy rules, ".docs" requirements, Jules/Gemini requirements, and MCP restrictions remain fully in force.
