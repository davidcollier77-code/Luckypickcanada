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
- Before making changes, identify the tools, MCPs, skills, libraries, documentation sources, and project systems that can materially help with the task.
- Use applicable capabilities proactively.

---

2. TOOL, MCP, SKILL & LIBRARY POLICY

DEFAULT RULE

Use applicable MCPs, skills, libraries, documentation, browser tools, testing tools, and project capabilities by default.

Do not treat an applicable capability as optional merely because the code could be changed without it.

For every task:

1. Determine which tools, MCPs, skills, libraries, documentation sources, and project systems apply.
2. Use the applicable capabilities during investigation, planning, implementation, testing, verification, or optimization.
3. When multiple task categories apply, combine the applicable toolsets rather than choosing only one.
4. Use the strongest relevant combination of tools available to you.
5. Only skip a capability when:
   - it genuinely provides no useful value for the specific task;
   - the capability is unavailable in the current Jules session;
   - or David explicitly says not to use it.
6. Do not skip an applicable capability simply because using it requires additional investigation.
7. Do not substitute personal assumptions for information that an available MCP, documentation source, diagnostic tool, or repository inspection can verify.

ACTUAL USE IS REQUIRED

A tool requirement is not satisfied by:

- mentioning the tool;
- identifying the tool;
- knowing that the tool exists;
- connecting to the tool;
- configuring the tool;
- reading its name from this file;
- saying that the tool would be useful.

When an applicable tool, MCP, skill, or documentation source is available, actually invoke it and use the result.

The result must materially inform the investigation, implementation, testing, verification, or decision-making.

Do not claim a tool, MCP, skill, library, or documentation source was used unless it was actually used.

PLAN REQUIREMENT

Before implementation, the plan should identify the major task categories involved and the corresponding tools, MCPs, skills, libraries, and verification methods that will be used.

If the task involves multiple categories, the plan must account for all materially relevant categories.

Do not silently omit an applicable toolset from the plan and then proceed as though it was unnecessary.

JUDGMENT STILL MATTERS

Use the routing rules below as defaults, not as a reason to invoke irrelevant tools.

The requirement is to use the tools that materially improve the task.

Do not invoke unrelated tools merely to satisfy a checklist.

---

3. AGENT SKILLS FOR CONTEXT ENGINEERING — DEFAULT

Use the Agent Skills for Context Engineering capability for every non-trivial engineering task.

Use it to improve:

- repository understanding;
- task decomposition;
- context management;
- implementation planning;
- information retrieval;
- execution quality;
- constraint preservation;
- reducing context loss;
- reasoning about complex repository changes;
- identifying relevant files and systems;
- maintaining task focus;
- verification;
- final review.

This is a default capability for non-trivial engineering work.

Do not skip it merely because the task initially appears straightforward if it can improve understanding, planning, execution, or verification.

---

4. MCP EXPECTATIONS

Context7 MCP

Use Context7 whenever current library, framework, API, dependency, or implementation documentation is relevant.

- Consult current documentation rather than relying on memory or assumptions.
- Use the correct project mapping in Section 7.
- When multiple libraries are involved, consult the relevant documentation for each materially relevant library.
- Apply retrieved documentation to implementation and verification.
- Do not invent Context7 library IDs or mappings.

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

1. Identify whether it applies.
2. Invoke it when it provides material value.
3. Use its result.
4. Incorporate the result into the work.
5. Verify the outcome.

This applies even when the capability is not explicitly named in this file.

---

5. TASK-BASED TOOL & LIBRARY ROUTING

When a task matches a category below, use that category's tools by default.

If multiple categories apply, combine them. Do not choose only one category when several are relevant.

---

A. UI DESIGN / VISUAL DESIGN / FRONT-END POLISH

Use:

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
- "playwright-chromium" where applicable.

Use Stitch for visual exploration and refinement.

Use Context7 for current framework and library behavior.

Verify the actual interface in a browser.

---

B. RESPONSIVE DESIGN / MOBILE UX

Use:

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

Use:

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

Use:

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

Use:

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

Use:

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

Use:

- "typescript";
- "eslint";
- "@types/node";
- "@types/react";
- Context7 when dependency or framework behavior is relevant.

Run appropriate type checking and linting.

Do not treat static checks as the only verification when runtime behavior matters.

---

H. DATABASE / POSTGRESQL / DATA-BACKED FEATURES

Use:

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

Use:

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

Use:

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

Use:

- "resend";
- Context7;
- relevant Next.js/TypeScript tooling;
- appropriate runtime verification.

Email infrastructure is protected.

Do not modify email infrastructure, delivery configuration, credentials, templates, or flows unless explicitly authorized.

---

L. IMAGE / SVG / CANVAS / RENDERING

Use:

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

Use:

- Playwright;
- "playwright-chromium";
- Puppeteer;
- Stitch where visual comparison is useful;
- relevant framework/library documentation;
- Context7.

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

- Agent Skills for Context Engineering;
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
4. gather evidence;
5. determine the smallest correct fix;
6. implement it;
7. verify the actual result.

Do not confuse a symptom with the root cause.

---

O. CLOUDFLARE / OPENNEXT / DEPLOYMENT

Use:

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

Use:

- Agent Skills for Context Engineering;
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

Use:

- Agent Skills for Context Engineering;
- relevant security tools available in the environment;
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

Use:

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

Use:

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

Use:

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

Use:

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

Use:

- Agent Skills for Context Engineering;
- Neon or relevant backend MCPs;
- Context7;
- TypeScript;
- relevant application libraries;
- appropriate tests;
- Playwright where user behavior is involved.

Trace the complete flow.

Verify:

- inputs;
- calculations;
- state;
- persistence;
- retrieval;
- edge cases;
- error handling;
- user-visible results.

Do not assume business logic is correct merely because the code compiles.

---

W. FULL AUDITS / DEEP INVESTIGATION

For a broad audit or deep investigation:

- use Agent Skills for Context Engineering;
- inspect the complete relevant implementation;
- trace the user flow end to end;
- inspect relevant dependencies and configuration;
- use every materially relevant MCP;
- use Context7 for applicable documentation;
- use Stitch for applicable design/UI investigation;
- use Neon for applicable database/data investigation;
- use browser/runtime verification where applicable;
- inspect logs and diagnostics where applicable;
- identify the root cause rather than stopping at symptoms;
- use evidence to inform the implementation plan.

Do not perform a pointless audit-only exercise when the actual objective is to understand and fix a problem.

The investigation should produce evidence that informs the implementation.

---

6. PROJECT LIBRARIES & CAPABILITIES

Use existing project libraries whenever applicable.

Core Framework & Language

- "next" — Next.js application framework, routing, rendering, and framework behavior.
- "react" — UI components, state, lifecycle, and rendering.
- "react-dom" — browser and DOM rendering.
- "typescript" — type safety and static typing.
- "react-error-boundary" — React error boundaries and failure handling.

Edge / Deployment / OpenNext

- "@opennextjs/cloudflare" — Next.js deployment adapter for Cloudflare.
- "wrangler" — Cloudflare Workers and deployment tooling.
- "@opennextjs/aws" — OpenNext AWS integration.

Styling / UI / Motion

- "tailwindcss" — utility-based CSS styling.
- "autoprefixer" — CSS vendor prefixing.
- "shadcn/ui" — reusable UI component system.
- "framer-motion" — UI animation and motion.

Graphics / Particles / Rendering

- "tsparticles" — particle systems and ambient visual effects.
- "sharp" — image processing and optimization.
- "html2canvas" — DOM-to-canvas rendering.

Audio

- "howler" — audio playback and lifecycle management.
- "tone" — synthesized audio and Web Audio effects.
- "use-sound" — React sound-trigger hooks.
- "pizzicato" — audio effects processing.

Data / Backend / Services

- "@neondatabase/serverless" — Neon serverless PostgreSQL client.
- "@upstash/redis" — Redis caching and state.
- "stripe" — Stripe server-side payments integration.
- "@stripe/stripe-js" — Stripe browser-side payments integration.
- "resend" — transactional email delivery.

Testing / Browser / Auditing

- "playwright" — end-to-end browser testing and UI verification.
- "playwright-chromium" — Chromium runtime for Playwright testing.
- "puppeteer" — headless browser automation, runtime inspection, and auditing.

Quality / Types

- "eslint" — code quality and static analysis.
- "@types/node" — Node.js type definitions.
- "@types/react" — React type definitions.

Context7 / MCP Integration

- "@upstash/context7-mcp" — Context7 MCP integration.
- "ctx7" — Context7/MCP integration and tooling.

---

7. CONTEXT7 PROJECT REGISTRY

Use these project mappings when consulting Context7.

Core Framework & Language

- "next" — Next.js Core Framework
- "react" — React Library
- "react-dom" — React DOM Renderer
- "typescript" — TypeScript Language Support
- "react-error-boundary" — React Error Boundary Utility

Edge / Deployment / OpenNext

- "@opennextjs/cloudflare" — OpenNext Cloudflare Adapter
- "wrangler" — Cloudflare Workers CLI & Tooling
- "@opennextjs/aws" — OpenNext AWS Adapter

Styling / UI / Motion

- "tailwindcss" — Tailwind CSS Styling Engine
- "autoprefixer" — CSS Vendor Prefixer
- "shadcn/ui" — UI Component System
- "framer-motion" — Motion & Animation Engine

Graphics / Particles / Rendering

- "tsparticles" — Particle and Ambient Visual System
- "sharp" — Node Image Processing Engine
- "html2canvas" — DOM-to-Canvas Rendering Utility

Audio

- "howler" — Howler.js Audio Lifecycle Manager
- "tone" — Tone.js Audio Synthesis Engine
- "use-sound" — React Hook for Sound Triggers
- "pizzicato" — Pizzicato.js Audio Effects Library

Data / Backend / Services

- "@neondatabase/serverless" — Neon Serverless PostgreSQL Client
- "@upstash/redis" — Upstash Redis Client
- "stripe" — Stripe Server SDK
- "@stripe/stripe-js" — Stripe Frontend Client SDK
- "resend" — Transactional Email Delivery SDK

Testing / Auditing

- "playwright" — End-to-End Browser Testing and UI Verification
- "playwright-chromium" — Chromium Runtime for Playwright Browser Testing
- "puppeteer" — Headless Browser Automation and Auditing

Quality / Types

- "eslint" — Static Code Analysis & Linting
- "@types/node" — Node.js Type Definitions
- "@types/react" — React Type Definitions

Context7 / MCP Integration

- "@upstash/context7-mcp" — Context7 MCP Integration
- "ctx7" — Context7 MCP/Codex Integration

Do not invent Context7 mappings or IDs.

---

8. MANDATORY DEVELOPMENT WORKFLOW

Step 1 — Understand the task

Identify:

- what is being requested;
- existing behavior that must be preserved;
- systems involved;
- potential risks;
- applicable task categories;
- applicable tools, MCPs, skills, libraries, and documentation.

Step 2 — Inspect the implementation

Review relevant:

- source code;
- components;
- routes;
- styles;
- configuration;
- dependencies;
- tests;
- data flow;
- runtime behavior;
- browser behavior;
- deployment configuration.

Verify assumptions whenever the repository or available tools can provide evidence.

Step 3 — Build the plan

The plan should identify the materially relevant:

- task categories;
- MCPs;
- skills;
- libraries;
- documentation;
- testing/verification methods.

When multiple categories apply, include the corresponding combined toolset.

Step 4 — Use the toolbox

Actually invoke applicable:

- Agent Skills;
- MCPs;
- Context7;
- Stitch;
- Neon;
- libraries;
- documentation;
- browser tooling;
- testing infrastructure;
- repository tooling;
- runtime diagnostics.

Use the results in the work.

Step 5 — Determine the root cause or correct approach

Use evidence to:

- identify root cause;
- determine correct implementation;
- avoid unsupported assumptions;
- preserve compatibility;
- respect project constraints;
- choose the smallest safe solution.

Step 6 — Implement

Use existing architecture and dependencies wherever practical.

Avoid:

- unnecessary rewrites;
- unnecessary dependencies;
- unrelated refactors;
- speculative changes;
- changes outside the requested scope.

Step 7 — Verify

Perform verification appropriate to the task.

This may include:

- type checking;
- linting;
- unit tests;
- integration tests;
- end-to-end tests;
- build checks;
- browser testing;
- visual inspection;
- responsive testing;
- animation timing verification;
- audio verification;
- runtime verification;
- data verification;
- security checks;
- performance checks;
- deployment verification.

Step 8 — Double-check before submission

Review the final implementation and diff.

Confirm:

- the requested outcome is actually achieved;
- applicable MCPs/tools were actually used;
- Agent Skills were used for non-trivial work;
- documentation was consulted when relevant;
- retrieved guidance was applied;
- existing behavior was preserved;
- protected systems were not changed without authorization;
- no unrelated files or functionality were changed;
- no known errors remain;
- relevant runtime behavior is correct;
- design and UX match the requested outcome;
- appropriate tests and verification were completed.

---

9. PROJECT SAFETY BOUNDARIES

Unless explicitly authorized by the task, do not modify:

- Stripe/payment configuration or payment flows;
- payment pricing or checkout behavior;
- database schema;
- database migrations;
- email infrastructure;
- authentication systems;
- authentication configuration;
- environment variables;
- secrets;
- Cloudflare account/settings/infrastructure configuration;
- unrelated production infrastructure.

Investigation of protected systems may be performed when necessary, but protected systems must not be modified without explicit authorization.

Never:

- expose secrets;
- print credentials;
- commit credentials;
- invent credentials;
- invent environment variables;
- invent APIs;
- invent database structures;
- invent infrastructure configuration.

When the requested change conflicts with these boundaries, do not make the protected change without authorization.

---

10. CHANGE DISCIPLINE

- Make the smallest safe change that fully solves the requested problem.
- Preserve working behavior.
- Reuse existing components and utilities.
- Reuse existing dependencies.
- Avoid unnecessary abstractions.
- Avoid speculative refactoring.
- Avoid unrelated cleanup.
- Avoid changing irrelevant files.
- Keep the final diff focused and reviewable.
- Do not remove functionality simply because it could be implemented differently.
- Do not replace a working implementation without evidence that replacement is necessary.
- Do not assume a rewrite is better than a focused fix.

---

11. VERIFICATION STANDARD

Verification must match the risk of the task.

- Code-only changes may require type checking and linting.
- UI changes should normally include browser verification.
- Animation changes should include actual animation verification.
- Audio changes should include actual audio/interaction verification where practical.
- Database changes should include database verification when authorized.
- Deployment changes should include build and runtime/deployment verification.
- Security changes should include security-oriented validation.
- Performance changes should include evidence or measurement where practical.
- Broad audits should use the appropriate combination of repository inspection, MCPs, documentation, browser/runtime tools, data inspection, and testing.

Do not declare completion solely because:

- the code compiles;
- the build passes;
- a test passes;
- a file changed;
- a tool returned successfully.

The requested behavior must actually work.

---

12. FINAL SUBMISSION CHECKLIST

Before submitting:

- [ ] The requested outcome was understood.
- [ ] The existing implementation was inspected.
- [ ] Applicable task categories were identified.
- [ ] Agent Skills for Context Engineering was used for non-trivial work.
- [ ] Relevant MCPs were identified.
- [ ] Applicable MCPs were actually invoked and used.
- [ ] Context7 was consulted when relevant.
- [ ] Stitch was used when visual/design work warranted it.
- [ ] Neon was used when database/data work warranted it.
- [ ] Relevant project libraries were used appropriately.
- [ ] Browser verification was performed when browser behavior mattered.
- [ ] Runtime behavior was verified when runtime behavior mattered.
- [ ] Security/performance/accessibility checks were performed when relevant.
- [ ] Appropriate tests/checks were performed.
- [ ] The root cause was addressed rather than only the symptom.
- [ ] Existing behavior was preserved unless intentionally changed.
- [ ] Protected systems were not modified without authorization.
- [ ] No unrelated changes were introduced.
- [ ] The final diff was reviewed.
- [ ] No known errors remain.
- [ ] The requested outcome was actually verified.
