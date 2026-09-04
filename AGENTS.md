AGENTS.md

1. CORE OPERATING RULES

- Treat "main" as the source of truth.
- Read and follow this file before making repository changes.
- Inspect the existing implementation before changing it.
- Understand the relevant architecture, dependencies, data flow, configuration, and runtime behavior before making changes.
- Prefer the smallest safe change that fully solves the requested problem.
- Preserve existing behavior unless the task explicitly requires a change.
- Reuse the existing architecture, patterns, components, dependencies, and project capabilities whenever practical.
- Do not introduce a new library, framework, service, or dependency when an existing project capability already provides the required functionality.
- Do not rewrite working systems unnecessarily.
- Do not invent APIs, configuration, dependencies, routes, database structures, environment variables, or infrastructure.
- Do not remove existing functionality unless explicitly requested.
- Keep changes focused, intentional, and reviewable.
- Do not make unrelated cleanup changes simply because they are possible.
- Do not assume that a successful build means the task is complete.
- When the requested outcome involves browser behavior, visuals, animation, audio, runtime behavior, data, deployment, security, performance, or user interaction, verify the actual behavior rather than relying only on static analysis.
- Before making changes, determine which tools, MCPs, skills, libraries, documentation sources, and project systems can materially help with the task.
- Use applicable capabilities proactively and actually use their results.

---

2. MANDATORY TOOL & MCP EXECUTION GATE

THIS IS A REQUIRED WORKFLOW

For every non-trivial task, before implementation:

Step 1 — Identify

Determine which tools, MCPs, skills, libraries, documentation sources, browser tools, testing tools, and project systems are materially relevant.

Step 2 — Invoke

For every capability identified as materially relevant and available in the current Jules session:

ACTUALLY INVOKE IT.

Do not merely:

- mention it;
- identify it;
- connect to it;
- configure it;
- confirm that it exists;
- say that it could be useful;
- list it in the plan.

An applicable MCP/tool is considered used only after an actual tool call has been made.

Step 3 — Use the Result

The returned information, data, documentation, diagnostics, design output, or other result must be considered and used to inform the investigation, implementation, testing, verification, or decision-making.

Do not make a tool call and then ignore its result.

Step 4 — Proceed

Only after the applicable required tools have been invoked and their relevant results considered should implementation proceed.

---

MCP USE IS NOT OPTIONAL WHEN MATERIAL

Do not skip an applicable MCP merely because:

- the task can technically be completed without it;
- the answer appears obvious;
- the relevant code is already familiar;
- using the MCP requires an additional lookup;
- the MCP is already connected;
- another source provides a plausible answer.

If the MCP can materially improve correctness, currentness, investigation, implementation, or verification, use it.

The goal is not to invoke tools for the sake of a checklist.

The goal is to actually use the strongest relevant available capabilities.

---

3. CONTEXT7 — REQUIRED WHEN DOCUMENTATION IS RELEVANT

Use Context7 whenever current documentation for a library, framework, API, dependency, SDK, or implementation technique is materially relevant.

This includes, but is not limited to:

- Next.js;
- React;
- TypeScript;
- Tailwind CSS;
- Framer Motion;
- Playwright;
- Puppeteer;
- Sharp;
- html2canvas;
- Howler;
- Tone;
- use-sound;
- Pizzicato;
- tsParticles;
- Stripe;
- Resend;
- Neon/Postgres libraries;
- OpenNext;
- Cloudflare/Wrangler;
- any other installed or relevant dependency.

Required Context7 workflow

When Context7 applies:

1. Identify the relevant library/framework/dependency.
2. Resolve the correct library/project through Context7.
3. Retrieve the relevant current documentation.
4. Use that documentation to inform the investigation or implementation.
5. Verify that the implementation is consistent with the retrieved documentation.

Do not invent Context7 library IDs.

Do not claim Context7 was used unless an actual Context7 call was made.

Important

If Context7 is available and relevant, do not begin implementation first and consult Context7 afterward merely as a confirmation step.

The documentation lookup should inform the implementation.

---

4. MCP TROUBLESHOOTING REQUIREMENT

If an applicable MCP or tool is identified but cannot immediately be used:

STOP AND TROUBLESHOOT THE TOOL ACCESS BEFORE SIMPLY CONTINUING WITHOUT IT.

Determine:

1. Is the MCP/tool actually available in this Jules session?
2. Is the relevant tool/function exposed?
3. Is the correct capability being selected?
4. Does the tool require a different invocation or input?
5. Is there an authentication, connection, permission, configuration, or environment problem?
6. Is the requested capability supported by the MCP?
7. Is the MCP returning an error or empty result?
8. Is there another documented way to invoke the relevant capability?

Make a reasonable troubleshooting attempt.

If the first invocation fails, do not immediately abandon the MCP.

After troubleshooting, make another reasonable attempt when appropriate.

If the MCP genuinely cannot be used

If the capability remains unavailable after reasonable troubleshooting:

- clearly recognize that it could not be used;
- do not falsely claim that it was used;
- document the limitation in the work summary;
- use the strongest remaining available source/tool;
- continue the task only when doing so is reasonable.

Never silently substitute an assumption for information that an available MCP could have verified.

---

5. PLAN REQUIREMENT

Before implementation, produce a plan that identifies:

- the problem or requested outcome;
- the relevant task categories;
- the applicable MCPs/tools;
- the documentation sources that will be consulted;
- the testing/verification methods;
- the major implementation steps.

If a tool or MCP is materially relevant, the plan should explicitly identify it.

The plan must correspond to actual execution.

Do not list tools in the plan and then fail to invoke them.

Do not claim successful tool use when the tool was only connected or mentioned.

---

6. AGENT SKILLS / CONTEXT ENGINEERING

Use relevant Agent Skills and context-engineering capabilities when they are actually available in the current Jules session and materially improve:

- repository understanding;
- task decomposition;
- context management;
- implementation planning;
- information retrieval;
- execution quality;
- constraint preservation;
- reasoning about complex repository changes;
- identifying relevant files and systems;
- verification;
- final review.

Do not claim to have used a skill unless the skill was actually available and invoked.

Availability in this repository's instructions does not guarantee that a particular skill is exposed in every Jules session.

Use it when available and relevant.

---

7. MCP EXPECTATIONS

Context7 MCP

Use Context7 for current documentation whenever relevant.

Actually invoke it and use its returned documentation.

Stitch MCP

Use Stitch for work involving:

- UI design;
- visual design;
- layout;
- screen composition;
- visual hierarchy;
- responsive design;
- interaction design;
- design exploration;
- visual refinement;
- visual polish;
- translating design concepts into implementation.

Actually invoke Stitch when applicable.

Use Stitch output as design or implementation guidance.

Neon MCP

Use Neon whenever the task involves or depends on:

- PostgreSQL;
- database schema;
- persisted data;
- queries;
- relationships;
- database-backed features;
- database errors;
- database performance;
- backend data flow;
- actual stored data;
- data integrity.

Use actual Neon evidence when authorized and applicable.

Do not guess about database structures or behavior when Neon can verify them.

Other MCPs and Skills

Treat every additional available MCP, skill, integration, and project capability the same way:

1. Determine whether it materially applies.
2. Invoke it when applicable and available.
3. Use its result.
4. Incorporate the result into the work.
5. Verify the resulting implementation.

---

8. TASK-BASED TOOL & LIBRARY ROUTING

When a task matches one or more categories below, use the relevant tools by default.

When multiple categories apply, combine the applicable toolsets.

Do not choose only one category when several are materially relevant.

---

A. UI DESIGN / VISUAL DESIGN / FRONT-END POLISH

Use where applicable:

- Stitch;
- Context7;
- "next";
- "react";
- "react-dom";
- "typescript";
- "tailwindcss";
- "autoprefixer";
- "shadcn/ui";
- "framer-motion";
- Playwright;
- "playwright-chromium".

Use Stitch for visual exploration and refinement.

Use Context7 for current framework/library behavior.

Verify the actual interface in a browser.

---

B. RESPONSIVE DESIGN / MOBILE UX

Use where applicable:

- Stitch;
- Playwright;
- "playwright-chromium";
- "next";
- "react";
- "tailwindcss";
- "shadcn/ui";
- "framer-motion";
- Context7.

Check:

- mobile;
- tablet;
- desktop;
- responsive breakpoints;
- touch interactions;
- spacing;
- overflow;
- viewport behavior;
- text wrapping;
- buttons and controls;
- visual hierarchy.

Do not assume desktop behavior works correctly on mobile.

---

C. ANIMATION / MOTION / INTERACTIVE EFFECTS

Use where applicable:

- "framer-motion";
- Context7;
- relevant browser/rendering tools;
- Playwright;
- "playwright-chromium".

Verify:

- timing;
- sequencing;
- state transitions;
- interaction behavior;
- completion;
- interruption;
- reduced-motion behavior where applicable;
- browser/runtime behavior.

Do not rely only on source-code inspection.

---

D. PARTICLES / VISUAL EFFECTS / AMBIENT EFFECTS

Use where applicable:

- "tsparticles";
- "framer-motion";
- Stitch;
- Context7;
- Playwright;
- "playwright-chromium".

Use Stitch when visual composition or design direction matters.

Verify the rendered result in the browser.

---

E. AUDIO / SOUND / INTERACTIVE AUDIO

Use where applicable:

- "howler";
- "tone";
- "use-sound";
- "pizzicato";
- "framer-motion";
- Context7;
- Playwright.

When several complementary sounds improve an interaction or reveal, use multiple appropriate audio capabilities rather than forcing a single library to handle every sound.

Verify:

- triggering;
- sequencing;
- timing;
- volume;
- lifecycle;
- cleanup;
- browser compatibility;
- user interaction requirements.

---

F. NEXT.JS / REACT / APPLICATION ARCHITECTURE

Use where applicable:

- "next";
- "react";
- "react-dom";
- "typescript";
- "react-error-boundary";
- Context7;
- relevant testing/browser tools.

Inspect the existing architecture before changing it.

Prefer existing project patterns over introducing new architectural approaches.

---

G. TYPESCRIPT / STATIC ANALYSIS / CODE QUALITY

Use where applicable:

- "typescript";
- "eslint";
- "@types/node";
- "@types/react";
- Context7 when dependency/framework behavior is relevant.

Run appropriate type checking and linting.

Do not treat static checks as the only verification when runtime behavior matters.

---

H. DATABASE / POSTGRESQL / DATA-BACKED FEATURES

Use where applicable:

- Neon MCP;
- "@neondatabase/serverless";
- Context7;
- "next";
- "typescript";
- Playwright where browser behavior is involved.

When authorized:

- inspect the actual schema;
- inspect relevant tables;
- inspect relationships;
- inspect actual data when necessary;
- verify queries;
- verify data flow;
- verify persistence.

Do not guess about database behavior when Neon can provide authoritative evidence.

---

I. REDIS / CACHING / STATE

Use where applicable:

- "@upstash/redis";
- relevant backend/data MCPs;
- Context7;
- "next";
- "typescript";
- appropriate testing/runtime tools.

Verify:

- cache reads;
- cache writes;
- invalidation;
- expiration;
- fallback behavior;
- error handling;
- consistency.

---

J. STRIPE / PAYMENTS

Use where applicable:

- "stripe";
- "@stripe/stripe-js";
- Context7;
- appropriate browser/runtime verification.

Payment systems are protected.

Do not modify:

- Stripe configuration;
- checkout behavior;
- payment flows;
- pricing;
- payment infrastructure;

unless the task explicitly authorizes those changes.

Investigation may be performed when appropriate without modifying protected payment systems.

---

K. EMAIL / TRANSACTIONAL EMAIL

Use where applicable:

- "resend";
- Context7;
- relevant Next.js/TypeScript tooling;
- appropriate runtime verification.

Email infrastructure is protected.

Do not modify email infrastructure, delivery configuration, credentials, templates, or flows unless explicitly authorized.

---

L. IMAGE / SVG / CANVAS / RENDERING

Use where applicable:

- "sharp";
- "html2canvas";
- relevant browser tools;
- Context7;
- Playwright.

Verify the actual rendered result where visual correctness matters.

Check:

- dimensions;
- scaling;
- quality;
- SVG validity;
- transparency;
- browser rendering;
- responsive behavior;
- performance.

---

M. BROWSER TESTING / UI AUDITING

Use where applicable:

- Playwright;
- "playwright-chromium";
- Puppeteer;
- Stitch where visual comparison is useful;
- Context7;
- relevant framework/library documentation.

Check:

- user flows;
- interactions;
- visual state;
- responsive behavior;
- loading states;
- errors;
- navigation;
- console/runtime problems;
- accessibility where relevant.

---

N. TROUBLESHOOTING / BUG INVESTIGATION

Use:

- relevant Agent Skills when available;
- the MCPs relevant to the affected system;
- Context7;
- Playwright/Puppeteer for browser issues;
- Neon for database issues;
- Wrangler/OpenNext for deployment issues;
- TypeScript/ESLint for code-quality issues;
- runtime diagnostics and logs where available.

Do not immediately patch the first suspicious line.

First:

1. reproduce or inspect the failure;
2. trace the affected flow;
3. identify the root cause;
4. gather evidence using the strongest relevant tools;
5. determine the smallest correct fix;
6. implement it;
7. verify the actual result.

Do not confuse a symptom with the root cause.

If an applicable MCP is available, actually use it during the investigation.

---

O. CLOUDFLARE / OPENNEXT / DEPLOYMENT

Use where applicable:

- "@opennextjs/cloudflare";
- "wrangler";
- "@opennextjs/aws" where applicable;
- "next";
- Context7;
- Playwright;
- runtime/deployment diagnostics.

Verify:

- build behavior;
- generated assets;
- routes;
- static assets;
- runtime behavior;
- Cloudflare compatibility;
- deployment configuration;
- production behavior where applicable.

Do not assume a successful local build proves the deployed application works.

---

P. PERFORMANCE / OPTIMIZATION

Use where applicable:

- relevant Agent Skills when available;
- Context7;
- relevant framework documentation;
- Playwright;
- Puppeteer;
- browser/runtime profiling;
- relevant MCPs;
- existing project performance tooling.

Investigate before optimizing.

Measure where practical.

Check for:

- unnecessary rendering;
- expensive effects;
- excessive network requests;
- large assets;
- blocking operations;
- animation performance;
- memory usage;
- bundle size;
- image optimization;
- database/query performance;
- caching opportunities.

Do not make speculative performance changes without evidence.

---

Q. SECURITY / SECURITY REVIEW

Use where applicable:

- relevant Agent Skills when available;
- relevant security tools;
- Context7;
- dependency/security analysis;
- TypeScript/ESLint;
- framework documentation;
- runtime/browser testing;
- relevant MCPs.

Review where applicable:

- authentication boundaries;
- authorization;
- input validation;
- data exposure;
- secret handling;
- environment variables;
- API routes;
- database access;
- payment boundaries;
- dependency risks;
- client/server separation;
- injection risks;
- error leakage.

Never expose, print, commit, or invent secrets or credentials.

Do not make unrelated security refactors.

---

R. ACCESSIBILITY

Use where applicable:

- Stitch;
- Playwright;
- relevant UI/framework documentation;
- Context7;
- existing accessibility tooling.

Check where applicable:

- keyboard navigation;
- focus states;
- semantic HTML;
- labels;
- controls;
- contrast;
- screen-reader-relevant structure;
- reduced motion;
- touch targets;
- error messaging.

Verify actual browser behavior where possible.

---

S. SEO / METADATA / DISCOVERABILITY

Use where applicable:

- "next";
- "react";
- Context7;
- browser inspection;
- relevant validation/testing tools.

Check:

- metadata;
- titles;
- descriptions;
- canonical behavior;
- structured data where applicable;
- robots behavior;
- sitemap behavior;
- social metadata;
- rendering behavior.

Do not invent SEO configuration or routes.

---

T. TESTING / QA

Use where applicable:

- Playwright;
- "playwright-chromium";
- Puppeteer;
- TypeScript;
- ESLint;
- relevant framework/library documentation;
- Context7.

Choose verification appropriate to the change.

Test both the changed behavior and important surrounding behavior that could have been affected.

---

U. DEPENDENCY / LIBRARY UPGRADES

Use where applicable:

- Context7;
- documentation for the relevant dependency;
- TypeScript;
- ESLint;
- existing tests;
- Playwright where browser behavior is involved.

Before upgrading:

- inspect current usage;
- check compatibility;
- check breaking changes;
- check peer dependencies;
- check project conventions.

After upgrading:

- run appropriate validation;
- verify runtime behavior;
- inspect the final diff.

Do not upgrade dependencies merely because newer versions exist.

---

V. DATA INTEGRITY / BUSINESS LOGIC

Use where applicable:

- relevant Agent Skills when available;
- Neon or relevant backend MCPs;
- Context7;
- TypeScript;
- relevant application libraries;
- appropriate tests.

Trace business logic from input through processing to persisted/output state.

Verify edge cases and existing behavior.

Do not alter business rules unless explicitly requested.

---

9. REPOSITORY INSPECTION

Before changing code:

- inspect the relevant files;
- inspect related components/modules;
- inspect configuration;
- inspect package dependencies;
- inspect existing tests;
- inspect relevant routes/API boundaries;
- inspect relevant data flow;
- inspect existing patterns.

Search the repository rather than guessing where functionality lives.

Follow existing architecture unless there is a clear reason to change it.

---

10. IMPLEMENTATION RULES

- Make the smallest safe change that fully solves the requested problem.
- Preserve unrelated behavior.
- Reuse existing components and utilities where practical.
- Do not introduce unnecessary dependencies.
- Do not rewrite working systems.
- Do not modify protected systems without explicit authorization.
- Keep the implementation focused and reviewable.
- Do not make speculative fixes.
- Do not hide errors to make tests pass.
- Do not weaken validation or safeguards merely to eliminate an error.

---

11. VERIFICATION REQUIREMENT

Verification must match the actual task.

A successful build is not sufficient by itself.

Where applicable, verify:

- type checking;
- linting;
- unit/integration tests;
- browser behavior;
- responsive behavior;
- visual rendering;
- animations;
- audio;
- database behavior;
- API behavior;
- deployment behavior;
- production behavior;
- console/runtime errors.

Use the appropriate MCPs and tools during verification as well as during investigation.

---

12. FINAL DOUBLE-CHECK

Before considering the task complete:

1. Re-read the requested task.
2. Confirm every requested requirement was addressed.
3. Confirm applicable MCPs/tools were actually invoked.
4. Confirm their results materially informed the work.
5. Confirm the implementation follows current relevant documentation.
6. Review the final diff.
7. Check for unintended changes.
8. Run appropriate validation.
9. Verify actual runtime behavior when applicable.
10. Confirm protected systems were not modified.
11. Confirm no secrets or credentials were exposed.
12. Confirm the final result solves the original problem rather than merely addressing a symptom.

Do not declare the task complete until this final review has been performed.

---

13. TOOL-USE HONESTY

Never state or imply that a tool, MCP, skill, library, documentation source, test, or verification method was used when it was not actually used.

Distinguish between:

- connected;
- available;
- identified;
- invoked;
- successfully returned a result;
- result applied;
- verification completed.

These are different states.

Only report the stronger state when it actually occurred.

---

14. PROTECTED SYSTEMS

Unless explicitly authorized by the task, do not modify:

- Stripe/payment infrastructure;
- email infrastructure;
- authentication;
- database schema;
- production data;
- environment variables/secrets;
- Cloudflare account/settings;
- unrelated APIs;
- unrelated infrastructure.

Investigation and read-only verification may be performed when appropriate.

If a requested fix appears to require changing a protected system, stop and identify the conflict before making the change.

---

15. COMPLETION STANDARD

The task is complete only when:

- the requested behavior has been implemented;
- the relevant root cause has been addressed;
- applicable tools/MCPs were actually used;
- relevant documentation was consulted;
- the implementation has been appropriately tested;
- actual behavior has been verified where applicable;
- the final diff has been reviewed;
- no unrelated functionality was changed;
- protected systems remain protected.

A connection is not usage.

A plan is not execution.

A build passing is not proof of correctness.

A plausible explanation is not evidence.

Investigate, invoke the relevant tools, use the evidence, implement, verify, and double-check.
