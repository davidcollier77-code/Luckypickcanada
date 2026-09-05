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

## Context7 Reference Libraries
Use Context7 for current, version-specific library documentation. Do not create bloated library lists; use only these curated references when relevant:

* `jules.google/docs` — Jules workflows, capabilities, and agent behavior.
* `developers.google.com/jules/api` — Jules API capabilities and API usage.
* `/github/docs` — GitHub repositories, branches, pull requests, Actions, and workflows.
* `/vercel/next.js` — Next.js framework, App Router, rendering, routing, and server/client components.
* `/reactjs/react.dev` — React components, hooks, state, effects, and rendering.
* `/microsoft/typescript` — TypeScript language and compiler behavior.
* `/websites/tailwindcss` — Tailwind CSS utilities and responsive styling.
* `/opennextjs/opennextjs-cloudflare` — OpenNext deployment of Next.js to Cloudflare.
* `/opennextjs/docs` — OpenNext architecture and deployment concepts.
* `/cloudflare/workers-sdk` — Wrangler, Workers tooling, and Cloudflare runtime/deployment.
* `/neondatabase/neon` — Neon/Postgres serverless integration.
* `/upstash/docs` — Upstash and Redis.
* `/stripe/stripe-js` — Stripe client-side/payment integration.
* `/resend/resend-node` — Resend Node email integration.
* `/microsoft/playwright-cli` — Playwright CLI browser automation, UI testing, DOM/CSS inspection, and debugging.
* `/testing-library/react-testing-library` — React component testing.

*(Note: The GitHub MCP Server is explicitly prohibited for this workflow; use the native tools or Context7 GitHub Docs reference if needed).*

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
