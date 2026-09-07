


## Permanent Agent-Governance & Operating Rules

The following rules form the core governance system for all agents operating in this repository. They are persistent, mandatory, and must be followed for all future tasks.

### 1. Mandatory AI Collaboration
Jules + Gemini are mandatory collaborators for EVERY repository task. This requirement applies regardless of task type, task group, difficulty, whether the task is routine or exceptional, whether it is classified as Miscellaneous / Cross-Cutting, or whether additional documentation or research is required. Task-group routing does not replace the Jules + Gemini requirement. There is no normal repository task for which Jules may simply decide not to use the required Jules + Gemini collaboration. They must genuinely participate in the work, and the final report must explicitly detail what each contributed. Never claim an AI or resource was used unless it was genuinely consulted.

### 2. Task Group Routing
Before making any changes, determine which of the existing 8 task groups genuinely applies. You must not create a ninth task group. The groups are:
1. Creation (`.jules/creation.md`)
2. Troubleshooting (`.jules/troubleshooting.md`)
3. Polishing (`.jules/polishing.md`)
4. Testing (`.jules/testing.md`)
5. Security (`.jules/security.md`)
6. Audio (`.jules/audio.md`)
7. Deep Dive / Investigation (`.jules/deep-dive.md`)
8. SEO (`.jules/seo.md`)

Preserve this existing group structure and its resource assignments.

### 3. Miscellaneous / Cross-Cutting Fallback
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

### 4. Approved Resources Hierarchy
Existing approved libraries, Context7 resources, repository tooling, and capabilities are the default and preferred solutions. Follow this strict order:
1. Identify the appropriate existing task group.
2. Consult its approved resources.
3. Consult the relevant Context7 documentation/library intelligence.
4. Use existing repository capabilities and tooling.
5. Use Jules.
6. Use Gemini.
7. Consult authoritative/current documentation where necessary.
8. Only after these resources are genuinely insufficient should a new dependency or external capability be considered.

Do not add technology simply because it is newer, easier, or more convenient.

### 5. New Dependencies (Absolute Last Resort)
Do not introduce a new package, library, service, or dependency unless there is a demonstrated capability gap. If one genuinely becomes necessary:
- Identify the exact capability gap.
- Explain why existing approved resources and repository capabilities cannot solve it.
- Choose the smallest appropriate addition.
- Integrate it into the permanent approved library/resource system and place it into the appropriate existing task group(s).
- Update the relevant documentation so future agents know it exists and why it was approved.
- Do not create a new task group for it.

### 5.1 Context7 — Last Resort Only
Context7 is an approved research resource, but it is a **LAST RESORT**.
It may be used only when the other approved and available resources have genuinely been exhausted and a specific information or capability gap remains.

Before relying on Context7, determine:
- exactly what information or capability is missing;
- what approved resources were already checked;
- why those resources were insufficient;
- why Context7 is actually necessary.

If Context7 is genuinely required, the decision must become part of the persistent project system when the resulting knowledge, capability, routing, or procedure is reusable. You must explain:
- what Context7 contributed;
- why it was necessary;
- which existing task group is appropriate;
- why that group was chosen;
- whether `.jules` and/or `.docs` should be updated so the knowledge becomes persistent.

Context7 use does NOT:
- authorize a new dependency;
- authorize installation of a library;
- authorize adoption of an external technology;
- override protected-system rules;
- override task routing;
- authorize MCP.

### 6. MCP Usage (Absolute Last Resort)
MCPs are completely separate from the Miscellaneous fallback and are the absolute last resort.
You may only rely upon an MCP after ALL of the following have been exhausted:
1. Appropriate existing task-group resources.
2. Approved Context7 resources.
3. Existing repository capabilities and tooling.
4. Jules.
5. Gemini.
6. Relevant authoritative/current documentation.
7. Any other already-approved capability available to the repository.

If an MCP is actually required, you must document:
- The exact capability gap.
- Why approved resources and existing repository capabilities could not accomplish it.
- Which MCP capability was required and exactly what it was used for.

Do not use an MCP merely because it is available or convenient. Simply connecting or having access to an MCP does NOT count as relying upon it.

### 7. Android Developers Documentation
The Context7 resource for Android Developers (`/android/developers`) belongs under the existing **Deep Dive / Investigation** group. Use it when relevant for platform, API, and tooling questions. Do not create an Android-specific task group.

### 8. Use Existing Project Capabilities
Before changing architecture or adding technology, inspect what the repository already has. Prefer existing libraries, utilities, components, scripts, workflows, testing infrastructure, documentation, deployment infrastructure, security mechanisms, audio infrastructure, and APIs. Do not recreate something that already exists unless there is a demonstrated reason to do so.

### 9. Protected Project Areas
Do not modify protected infrastructure unless the task explicitly requires it. Preserve existing:
- Stripe/payment functionality
- Database schema, state, and migrations
- Sensitive API routes
- Authentication and Turnstile
- Authorization rules and access controls
- Resend email delivery
- Environment variables and secrets
- Cloudflare deployment configuration (e.g., `wrangler.jsonc`, `open-next.config.ts`)
- Existing security safeguards
- Existing application audio behavior. **Do not remove, redesign, tune, replace, or refactor existing Howler/ZZFX application audio as part of unrelated work.**

### 9.1 Payment System Changes
Any task that requires changing, replacing, restructuring, migrating, or materially modifying the payment system must be treated as an exceptional cross-cutting change. Do not assume that technical necessity automatically grants authorization. Before implementation, determine:
- what payment capability must change;
- why it must change;
- what existing payment behavior could be affected;
- what protected systems are involved;
- what authorization is required;
- whether the task actually grants that authorization;
- how the resulting payment behavior will be verified.
Unrelated work must not modify the payment system. Existing payment functionality remains protected unless the task explicitly requires a payment-system change.

### 9.2 Authorization, Permissions, and Privileged Access
If a task requires creating, changing, expanding, or granting any specific authorization, permission, credential, access-control rule, repository permission, workflow permission, API permission, service authorization, or other privileged capability, identify that requirement explicitly.
Do not assume authorization. Do not silently broaden permissions to make a task easier.
Determine:
- what authorization is required;
- why it is required;
- what it provides access to;
- what scope it has;
- whether the scope can be minimized;
- whether the requested task explicitly authorizes the change.
Use least privilege. When authorization is not clearly granted, do not invent it or silently create it. Stop at the authorization boundary and require the appropriate authorization before proceeding.

### 10. Implementation Philosophy
Work surgically. Do not make speculative changes. Do not broaden the scope because another change looks interesting or cleaner.
Follow this flow:
**Inspect → Identify → Understand → Verify → Choose → Research → Implement → Test → Double-check**
If you discover an unrelated problem, document it rather than silently expanding the task, unless it is necessary to complete the requested work safely.

### 11. Verification Must Prove Behavior
Do not treat “the code looks correct” as verification. For anything involving dates, time zones, scheduling, environment variables, deployment, Cloudflare, OpenNext, assets, caching, authentication, security, APIs, build behavior, browser behavior, or platform-specific behavior:
- **Test the actual behavior where practical.**
- Use representative cases, edge cases, or environment-specific checks where appropriate.
- If another AI/reviewer proposes a fix, independently verify that it actually solves the problem (e.g., avoiding the PR #966 timestamp logic error issue).

### 12. Documentation & Library Usage Must Be Genuine
When approved documentation or library resources are relevant:
- Actually consult them.
- Identify the specific resource used and its task group.
- Use the information appropriately.
- Report which resources materially informed the implementation.
- **Never claim a resource was consulted when it was not. Context7 usage should be meaningful, not ceremonial.**

### 13. Documentation Cleanup & Friday Refresh
When updating governance documentation (like `AGENTS.md`), preserve all unique instructions, safeguards, project-specific requirements, the 8 existing groups, and their resource assignments. You may consolidate duplicate information if it improves clarity, but do not weaken or change the meaning of any instruction.
- **Friday Documentation Refresh:** The existing GitHub Actions workflow (`.github/workflows/refresh-docs.yml`) must run every Friday at 2:21 AM local time using `America/Halifax` (`cron: '21 2 * * 5'`, `timezone: 'America/Halifax'`). Do not replace this with UTC.
- **Verification Integrity:** A successful refresh may only report `SUCCESS — [ISO 8601 timestamp with timezone] — VERIFIED`. A failed refresh must report `FAILED — [ISO 8601 timestamp with timezone] — VERIFICATION FAILED` and must never overwrite the last successful refresh record. The timestamp must accurately represent "America/Halifax" with the correct daylight/standard-time offset.

### 14. Verification Requirements (Pre-Submission Checklist)
Before declaring a task complete, confirm:
- The original requirements were met.
- The correct task group was selected and its approved resources were actually consulted.
- Jules and Gemini participated.
- No unnecessary dependencies were introduced (and if genuinely required, they are permanently documented).
- Miscellaneous fallback and MCPs were only used if strictly necessary.
- Android Developers routes to Deep Dive.
- Existing safeguards and protected infrastructure (including audio) remain intact.
- Relevant tests, build/verification checks, and `./jules-verify.sh` were run.
- `git diff`, `git status`, and generated artifacts (no `tsconfig.tsbuildinfo` committed) were reviewed.
- Final implementation behaves as intended.
- Final governance instructions retain all unique requirements.

### 15. Judgment When Instructions Conflict
Do not blindly follow an instruction if doing so conflicts with the repository's architecture, an existing safeguard, or a technically necessary constraint. If you discover a conflict, architectural limitation, unsafe instruction, redundant governance, or a requirement that cannot safely be satisfied: stop before making a risky change. Explain the issue and use the safest solution that achieves the intended goal. Reliable compliance is the objective, not mechanically reproducing a prescribed patch.


## Routing and Task Groups

The approved architecture contains exactly these eight task groups. When starting a task, identify the task type, route to the corresponding specialist in `.jules/`, use the approved Context7 libraries, and consult the appropriate `.docs/` snapshots.

1. **Creation** (`.jules/creation.md`)
2. **Troubleshooting** (`.jules/troubleshooting.md`)
3. **Polishing** (`.jules/polishing.md`)
4. **Testing** (`.jules/testing.md`)
5. **Security** (`.jules/security.md`)
6. **Audio** (`.jules/audio.md`)
7. **Deep Dive / Investigation** (`.jules/deep-dive.md`)
8. **SEO** (`.jules/seo.md`)

# LuckyPickCanada Project Instructions

## Repository Architecture & Core Stack
* **Framework:** Next.js (App Router).
* **Styling:** Tailwind CSS.
* **Database:** PostgreSQL (accessed via Neon Serverless driver `@neondatabase/serverless`).
* **Deployment:** Cloudflare Pages/Workers (via OpenNext `opennextjs-cloudflare`).
* **Payments:** Stripe Checkout.
* **Email:** Resend.
* **Security:** Cloudflare Turnstile.
* **Audio:** Howler.js (layered audio/SFX using real assets).
* **Animations:** Framer Motion, HTML5 Canvas.

## Protected Areas
**DO NOT MODIFY** the following areas unless explicitly instructed by the user:
* Stripe checkout logic, products, or payment processing endpoints.
* Database schema, state, or migration scripts.
* API routes handling sensitive logic (e.g., payments, form submissions, emails, and the Gemini Oracle endpoint).
* Resend email delivery logic.
* Authentication and Turnstile configuration.
* Environment variables or secrets handling.
* Cloudflare deployment settings (`wrangler.jsonc`, `open-next.config.ts`).

## Development & Coding Conventions
* **React/Next.js:** Extract complex logic into custom hooks. Use Server Components where appropriate for data fetching. For client-side interactivity, mark components with `"use client"`.
* **Database Caching:** Do not apply global `fetchOptions: { next: { revalidate: X } }` to the shared `neon()` client instance, as it uses POST requests for all queries and risks caching writes. Use route-level ISR (`export const revalidate = ...`) instead.
* **On-Demand Revalidation:** Use `revalidatePath` or `revalidateTag` inside Server Actions or API routes when handling user submissions on statically regenerated pages to ensure instant updates.
* **Audio/Visual Timing:** Synchronize Web Audio directly to HTML5 Canvas visual spawn milestones (using `AudioContext.currentTime`) rather than relying on React state changes or `setTimeout`.
* **Performance:** Extract full-screen Canvas fill operations outside of particle rendering loops to prevent overdraw. Use `matchMedia('(prefers-reduced-motion: reduce)')` to respect reduced motion settings directly in the animation loop.
* **Gemini Oracle Integration:** The "Crystal Ball" feature (`functions/api/oracle.js`) calls the Gemini REST API directly (`generativelanguage.googleapis.com`) using `fetch`. Do not install the Gemini Node SDK; maintain the raw REST implementation. Always enforce strict prompt injection sanitization (stripping quotes, brackets, and newlines) before interpolating user input into the prompt.


## Playwright CLI Artifact Rule
Playwright CLI generates temporary snapshots, traces, and debug artifacts inside the `.playwright-cli/` directory.
* These files are test/debug artifacts and must **NEVER** be committed to version control.
* Ensure `.playwright-cli/` remains in `.gitignore`.
* **Mandatory:** Always check `git status` and the final Git diff before submitting changes to ensure no Playwright artifacts (or any other unintended files) are accidentally staged.




## Mandatory AI & Tooling Policy

**1. Gemini & Jules Are Mandatory**
Gemini and Jules must be explicitly included and used for EVERY repository task, regardless of task type. They are not optional suggestions. Use the existing approved Gemini and Jules resources already in the repository (e.g. `jules.google/docs`, `developers.google.com/jules/api`, `/google-gemini/gemini-cli`, `/websites/ai_google_dev_gemini-api`). Do not replace, recreate, bypass, remove, or substitute them.

**2. Existing Approved Capabilities Come First**
Before introducing anything new, agents must inspect and make reasonable use of what the repository already has: approved libraries, installed dependencies, existing frameworks, tools, APIs, Gemini/Jules resources, Context7, and the `.jules/` specialists. Do not introduce a new tool simply because it is newer, cleaner, easier, or faster.

**3. New Libraries/Dependencies Are an Absolute Last Resort**
A new library or dependency must NEVER become the default answer to a problem. Before adding one, the agent must identify:
- The exact missing capability.
- What existing resources were considered.
- Why the existing system cannot provide the capability.
- Why the new dependency is actually necessary.
- That it does not duplicate existing functionality.
- That it is compatible and functional.
Do not silently introduce new dependencies.

**4. Newly Adopted Libraries Must Be Integrated**
If a new library is genuinely necessary and adopted, it must become part of the permanent system. It must be added to the appropriate task group(s) in `AGENTS.md` and `.jules/` files, and documented using the repository's existing organization. Do not add a library merely because Context7 mentions it; Context7 provides intelligence, not authorization.

**5. MCPs Are a Genuine Absolute Last Resort**
The availability of an MCP does NOT authorize its use. Before using an MCP, genuinely exhaust the appropriate existing capabilities (approved libraries, repository tools, Gemini/Jules, Context7). An MCP may only be considered when there is a real capability gap the existing approved system cannot solve.

**6. Context7 Role**
Context7 remains an approved documentation resource. Use existing Context7 mappings for relevant technologies. It does not replace Gemini or Jules, does not authorize new libraries by itself, and does not override the approved-first policy.

---


Development Agent Instructions

Core Development Workflow

For every development task, follow this workflow before submitting any work:

Inspect → Identify → Understand → Verify → Choose → Research → Implement → Test → Double-check

Do not blindly begin coding based on assumptions or memory.
Agents must inspect the actual implementation before making assumptions. Agents must test their work and double-check the final result before submitting changes.

---

1. Inspect the Repository First

Before making implementation changes:

- Inspect the relevant repository files and existing implementation.
- Understand the current architecture and how the affected feature works.
- Check existing components, utilities, services, configuration, and dependencies that may already solve part of the task.
- Identify potential dependencies between the requested change and other parts of the application.
- Avoid changing unrelated functionality.

Do not assume how the application is structured. Verify it from the repository.

---

2. Check the Relevant Libraries, Frameworks, Packages, APIs, and Tools

Before deciding how to implement the task, check which libraries, frameworks, packages, APIs, MCPs, and development tools are relevant and available in the repository/environment.

Inspect package manifests and configuration files to determine:

- Which libraries are installed.
- Which versions are installed.
- Which frameworks are being used.
- Which APIs or platform integrations are involved.
- Which existing project utilities or components may already provide the required functionality.
- Which connected MCPs/tools are relevant to the task.

Do not assume a library or version based on memory, training knowledge, or habit.

---

3. Understand the Relevance of the Libraries Before Choosing Them

Do not simply identify available libraries. Understand what the relevant libraries and tools are designed to do and determine how relevant each one is to the specific task before deciding which ones to use.

For each reasonable technology choice, consider:

- What problem the library/tool is designed to solve.
- Whether it actually applies to the requested task.
- Whether the project already uses it.
- Whether another installed library is better suited.
- Whether introducing a new dependency is necessary.
- Compatibility with the project's existing architecture and versions.
- Performance, maintainability, and reliability implications.

The agent must determine which library, tool, API, or combination of technologies is best suited to the task before implementing it.

Prefer the technology already established in the project when it is appropriate.

Do not introduce unnecessary dependencies simply because another library exists.

---

4. Use Context7 for Library Intelligence

Use Context7 whenever the task involves a library, framework, package, API, or other documented technology.

Context7 should be used to understand the technology before implementation, not merely after coding or when something goes wrong.

Use this sequence:

Identify the library → verify the installed version → resolve it in Context7 → retrieve the relevant documentation → understand the correct APIs and implementation patterns → choose the appropriate approach → implement.

Whenever possible:

- Research the exact installed version.
- Use focused documentation relevant to the actual task.
- Check the specific APIs, methods, lifecycle behavior, configuration, timing behavior, performance considerations, or integration patterns involved.
- Use the retrieved documentation to inform actual implementation decisions.

Do not rely solely on remembered APIs or generic knowledge when current, version-appropriate documentation is available through Context7.

If Context7 cannot resolve the required library or technology, use its authoritative documentation/source instead and clearly account for that limitation.

---



## Available Libraries/Tools

The following tools and libraries are available for use in this project:

### Core Framework
* **Next.js**: Core framework (App Router).
* **React**: UI library.
* **TypeScript**: Type checking.
* **Tailwind CSS**: Styling.

### UI / Styling
* **framer-motion**: Animation library for React.
* **gsap**: Complex animations and timelines.
* **lucide-react**: Icon library.
* **sonner**: Toast notifications.
* **tailwind-merge / clsx-tailwind-merge**: Class name merging utilities.
* **cssnano**: CSS minifier.
* **stylelint**: CSS linter.

### Media / Interaction
* **howler**: Audio playback and sprite management.
* **zzfx**: Procedural sound effect generation.
* **canvas-confetti**: Confetti effects.
* **html2canvas**: Taking screenshots of DOM elements.

### Forms / Validation
* **react-hook-form**: Form state management.
* **zod**: Schema validation and type inference.
* **@hookform/resolvers**: Zod integration for react-hook-form.
* **zxcvbn**: Password strength estimation.
* **dompurify**: XSS sanitizer.

### Testing / Quality
* **vitest**: Unit testing framework.
* **@testing-library/react**: React component testing.
* **@playwright/test**: End-to-end browser testing.
* **eslint**: Linting, with plugins for React, hooks, Prettier, and accessibility (jsx-a11y).
* **prettier**: Code formatting.
* **husky & lint-staged**: Pre-commit hooks for code quality.
* **axe-core & @axe-core/react**: Accessibility auditing.
* **jsdom**: DOM implementation for tests.

### Utilities
* **lodash**: Utility functions.
* **date-fns**: Date manipulation.
* **dotenv**: Environment variable management.

### Backend / Infrastructure
* **@neondatabase/serverless**: Neon PostgreSQL driver.
* **@upstash/redis**: Redis client.
* **stripe / @stripe/stripe-js**: Payments processing.
* **resend**: Email sending API.
* **@sentry/nextjs**: Error tracking and performance monitoring.


### Curated Context7 Libraries

When interacting with Context7, you can use these verified library references for specific technologies:

* **Jules**: `jules.google/docs` - Jules workflows, capabilities, and agent behavior.
* **Jules API**: `developers.google.com/jules/api` - Jules API capabilities and API usage.
* **GitHub**: `/github/docs` - GitHub repositories, branches, pull requests, Actions, and workflows.
* **Next.js**: `/vercel/next.js` - Next.js framework, App Router, rendering, routing, and server/client components.
* **React**: `/reactjs/react.dev` - React components, hooks, state, effects, and rendering.
* **TypeScript**: `/microsoft/typescript` - TypeScript language and compiler behavior.
* **Tailwind CSS**: `/websites/tailwindcss` - Tailwind CSS utilities and responsive styling.
* **OpenNext Cloudflare**: `/opennextjs/opennextjs-cloudflare` - OpenNext deployment of Next.js to Cloudflare.
* **OpenNext Docs**: `/opennextjs/docs` - OpenNext architecture and deployment concepts.
* **Cloudflare Workers**: `/cloudflare/workers-sdk` - Wrangler, Workers tooling, and Cloudflare runtime/deployment.
* **Neon**: `/neondatabase/neon` - Neon/Postgres serverless integration.
* **Upstash**: `/upstash/docs` - Upstash and Redis.
* **Stripe**: `/stripe/stripe-js` - Stripe client-side/payment integration.
* **Resend**: `/resend/resend-node` - Resend Node email integration.
* **React Testing Library**: `/testing-library/react-testing-library` - React component testing.
* **Playwright**: `/microsoft/playwright-cli` - End-to-end browser testing.
* **Gemini CLI/Agent Tooling**: `/google-gemini/gemini-cli` - Useful for understanding Gemini AI workflows, agent capabilities, and CLI integrations.
* **Gemini API**: `/websites/ai_google_dev_gemini-api` - Useful for implementing Google's generative AI models for text, multimodal, and streaming features.
* **Zod**: `/colinhacks/zod` - Schema validation and type inference.
* **GSAP**: `/llmstxt/gsap_llms_txt` - Professional-grade JavaScript animation library.
* **Vitest**: `/vitest-dev/vitest` - Next-generation testing framework powered by Vite.

*(Note: The GitHub MCP Server is explicitly prohibited for this workflow; use the native tools or Context7 GitHub Docs reference if needed).*

5. Context7 Must Be Meaningful

Do not make a token Context7 call simply to satisfy a requirement.

The information retrieved through Context7 must actually influence the implementation or technology decision where applicable.

The agent should be able to explain, when useful:

- Which relevant libraries were identified.
- Which versions are installed.
- Which libraries were researched.
- What was learned from the documentation.
- Why the selected library/tool/approach was appropriate.

---

6. Use All Relevant MCPs and Tools Properly

All connected MCPs and development tools that are relevant to the task must be actually called and meaningfully used.

Do not:

- Merely connect an MCP.
- Mention an MCP without using it.
- Make a token call just to satisfy a requirement.
- Use the wrong MCP simply because it is available.

Each MCP/tool should be used for the work it is best suited to perform.

For example:

- Use Context7 for current, version-specific library/framework/API documentation and implementation guidance.
- Use database-specific tools for database inspection or database work.
- Use design/prototyping tools for relevant design or UI investigation.
- Use repository/code tools for repository inspection and code changes.
- Use testing/browser tools when they are relevant to validating the actual user experience.

Do not use Neon as a substitute for Context7 when the task is about understanding or researching a library, framework, package, API, or implementation pattern.

Use every relevant connected MCP for its actual purpose.

---

7. Current Sound Effects Library

Howler.js is the preferred library for audio playback and layering in this project, utilizing real audio assets located in the `public/sounds/` directory.

When a task requires sound effects, interactive audio, or reveal sounds, check the existing audio assets and implement them via Howler.js.

Before implementing sound-related functionality:

- Inspect the installed Howler package and its current API/documentation.
- Understand how Howler manages audio sprites, volume, fading, and layering.
- Synchronize sounds with the actual visual animation/events rather than relying on arbitrary timing delays.
- Test audio together with the visual animation to verify timing, volume, repetition, and overall user experience.
- Avoid excessive volume, harsh clipping, repetitive sounds, or audio that becomes irritating during repeated interactions.

---

8. Choose the Best Implementation Approach

After inspecting the repository, understanding the available technologies, verifying versions, and researching the relevant documentation:

Choose the best technology and implementation approach before writing the code.

The selected approach should:

- Fit the existing architecture.
- Use appropriate existing dependencies where possible.
- Match the installed versions.
- Follow current documented APIs.
- Avoid unnecessary complexity.
- Avoid unnecessary dependencies.
- Consider performance and maintainability.
- Solve the actual requested problem rather than merely masking symptoms.

If multiple approaches are viable, select the one that provides the best balance of correctness, maintainability, compatibility, and performance.

---

9. Implement the Requested Changes

Once the approach has been established:

- Implement the requested functionality.
- Keep changes focused on the actual task.
- Preserve existing working functionality.
- Follow the project's existing coding patterns where appropriate.
- Do not make unrelated refactors unless they are necessary to correctly complete the task.
- Use the libraries and tools selected during the investigation.
- Follow the relevant documentation researched through Context7.

For visual, interactive, animation, audio, or UX work, evaluate the complete user experience rather than checking only whether the code technically executes.

---

10. Test the Implementation

After implementation, test the affected functionality.

Depending on the task, this may include:

- Running the appropriate test suite.
- Running linting/type checks.
- Running a production build.
- Testing affected routes/components.
- Testing browser behavior.
- Testing responsive/mobile behavior.
- Testing performance.
- Testing animations and timing.
- Testing audio synchronization.
- Testing error and edge cases.
- Checking that existing functionality still works.

Do not consider the task complete merely because the code compiles.

---

11. Double-Check the Finished Work

Before submitting any fix or change, thoroughly double-check the completed implementation.

Verify:

- The requested problem was actually solved.
- The implementation matches the intended behavior.
- The selected libraries/tools were appropriate.
- The APIs used match the installed versions.
- Context7 guidance was followed where applicable.
- Relevant MCPs were actually used.
- No unnecessary dependencies were introduced.
- No unrelated functionality was broken.
- Tests/builds/checks pass where applicable.
- The final user experience matches the requested result.

**Mandatory Verification of Document/Library Usage**
As part of the final verification and submission, you must explicitly document your resource usage. You are required to:
- Consult the appropriate approved document/library resources when relevant.
- Identify the specific document/library/resource actually consulted.
- Identify the existing task group that resource belongs to.
- Verify and report which approved resource(s) informed the work.
- Never claim a resource was used unless it was actually consulted.
Make this verification part of the required task workflow/final verification, not optional narrative.

If the task involves UI, animation, audio, or interaction, inspect the finished result rather than relying solely on the source code or build output.

Fix problems discovered during this final verification before submitting.

---

12. Do Not Stop at the First Working Version

A technically functioning implementation is not automatically a finished implementation.

After the initial implementation, ask:

- Does it actually feel correct?
- Does it behave correctly under realistic conditions?
- Are timing and synchronization correct?
- Is the user experience polished?
- Is performance acceptable?
- Are there visual or audio artifacts?
- Are there unnecessary effects or regressions?
- Does the implementation make proper use of the selected technology?

Where appropriate, improve issues discovered during verification before submitting.

---

13. Universal Rule

These instructions apply to every development task, regardless of feature or technology.

They are not limited to a particular project, page, component, animation, or feature.

The fundamental rule is:

Never blindly code against a library or technology.

For every task:

Inspect the repository → Check the relevant libraries and tools → Understand their relevance → Verify installed versions → Research with Context7 → Determine the best technology/approach → Implement → Test → Thoroughly double-check → Submit.

The goal is not simply to produce code that works.

The goal is to produce the correct implementation using the right technology, the correct version-specific APIs, the appropriate connected tools, and a properly verified result.

---

14. Scientific Debugging & Verification Protocol

For all tasks involving debugging, troubleshooting, or modifying code, adhere strictly to this scientific protocol before finalizing any work:

1. **Investigate Before Changing:** Do not write code immediately. Trace the execution flow and read the relevant source files.
2. **Identify Symptoms vs. Root Causes:** Clearly separate the observed symptom (what is happening) from the suspected root cause (why it is happening).
3. **Consider Multiple Plausible Causes:** When appropriate, list multiple potential reasons for the failure before choosing one to test.
4. **Form a Testable Hypothesis:** State a clear hypothesis (e.g., "If I change X, then Y should happen because Z").
5. **Gather Evidence:** Use logs, tests, or MCP tools to support or disprove the hypothesis.
6. **Make the Smallest Appropriate Change:** Apply only the minimal change required to test the hypothesis. Do not refactor unrelated code.
7. **Test the Change:** Run tests and build checks.
8. **Change Course on Failure:** If evidence disproves the hypothesis, do not continue patching the symptom. Revert the change and form a new hypothesis based on the new evidence.
9. **Verify User-Facing Behavior:** Verify the actual user-facing behavior. Never treat a successful build alone as proof that a frontend, runtime, deployment, or user-facing problem is fixed.
10. **Use Browser/UI Verification:** When the task involves frontend behavior, use available Playwright/browser tooling to verify the visual outcome. Test work thoroughly.
11. **Check for Regressions:** Ensure related functionality remains intact.
12. **Perform a Final Self-Review:** Review the diff and ensure it aligns with the hypothesis and task requirements.
13. **Mandatory Script Verification:** Run `./jules-verify.sh` to validate the build, linting, and types. You must not declare the task complete if this script fails.

---

15. Local CI Verification

Before pushing code or opening a PR, verify changes pass CI locally using `act`.

### Prerequisites
- Docker must be running
- If `act` is not installed, run: `bash scripts/act/install-act.sh`

### How to Verify

1. Read `.github/workflows/` to find the CI workflow and identify the job ID
2. Run the verification script:
   ```bash
   bash scripts/act/run-act.sh "push -j <JOB_ID>"
   ```
   With matrix: `bash scripts/act/run-act.sh "push -j <JOB_ID> --matrix <KEY>:<VALUE>"`
3. If the run fails, read the log output, fix the code, and re-run
4. After verification, clean up:
   ```bash
   rm -f act_output.log
   git checkout <any unintended file changes>
   ```

### Configuration
- Timeout: `ACT_TIMEOUT=900 bash scripts/act/run-act.sh "..."`  (default: 600s)
- Poll interval: `ACT_POLL=15 bash scripts/act/run-act.sh "..."`  (default: 10s)
- Custom image: pass `-P ubuntu-latest=node:20-bookworm` in the arguments for faster pulls

### Environment Notes
* In this specific cloud sandbox environment, `act` container spinup may fail due to nested overlayfs limits (`failed to mount ... overlay`). If this occurs, rely on `bash jules-verify.sh` for build verification.
