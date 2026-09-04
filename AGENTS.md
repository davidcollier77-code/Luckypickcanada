AGENTS.md

1. Core Operating Rules & Boundaries

- Treat "main" as the source of truth.
- Read and follow this file before making repository changes.
- Inspect the existing implementation before changing it.
- Understand the relevant architecture, dependencies, data flow, and runtime behavior before making changes.
- Prefer the smallest safe change that fully solves the requested problem.
- Preserve existing behavior unless the task explicitly requires a change.
- Use the existing architecture, patterns, components, dependencies, and project capabilities whenever practical.
- Do not introduce a new library, framework, service, or dependency when an existing project capability already provides the required functionality.
- Do not rewrite working systems unnecessarily.
- Do not invent APIs, configuration, dependencies, routes, database structures, environment variables, or infrastructure.
- Do not remove existing functionality unless explicitly requested.
- Keep changes focused, intentional, and reviewable.
- Do not make unrelated cleanup changes simply because they are possible.
- Do not assume that a successful build means the task is complete.
- When the requested outcome involves browser behavior, visuals, animation, audio, runtime behavior, data, deployment, or user interaction, verify the actual behavior rather than relying only on static analysis.
- Before making changes, identify the tools, MCPs, skills, libraries, documentation sources, and project systems that can materially help with the task.
- Use those capabilities proactively rather than waiting until a problem occurs.

---

2. MCP, SKILL, LIBRARY & TOOL USAGE — DEFAULT EXPECTATION

The project has been given MCPs, skills, libraries, documentation tools, and other capabilities for a reason.

DEFAULT RULE

Use the available MCPs, skills, libraries, and project tooling by default.

Do not treat them as optional conveniences.

For every task:

1. Identify the available MCPs, skills, libraries, and project tools that apply.
2. Actively use the applicable ones during investigation, planning, implementation, testing, verification, or optimization.
3. Prefer using multiple relevant tools together when doing so improves the result.
4. Do not restrict yourself to the minimum number of tools needed to make the code compile.
5. If a tool can materially improve correctness, quality, reliability, design, performance, browser behavior, data integrity, deployment safety, or user experience, use it.
6. Only skip an applicable tool when it genuinely provides no useful value for the specific task, or David explicitly says not to use it.
7. Never merely connect/configure/acknowledge a tool and then ignore it.

ACTUAL USE IS REQUIRED

Connecting to an MCP does not count as using it.

Using a library does not mean merely knowing that it exists.

When an applicable MCP, skill, documentation source, or project tool is identified:

- actually call or invoke it;
- retrieve the relevant information, data, guidance, design output, diagnostics, or other result;
- apply that information to the work;
- use the resulting evidence to guide the implementation or verification.

Do not claim an MCP, skill, library, or documentation source was used unless it was actually used.

USE MULTIPLE TOOLS WHEN THEY WORK TOGETHER

Do not artificially choose only one tool when several are relevant.

Examples:

- A UI animation task may require Stitch + Context7 + Framer Motion + Playwright.
- A database-backed feature may require Neon + Context7 + Next.js + TypeScript + Playwright.
- An audio reveal may require Context7 + Howler/Tone/use-sound/Pizzicato + Framer Motion + Playwright.
- A Cloudflare deployment issue may require Context7 + Next.js + OpenNext + Wrangler + Playwright.
- An image/rendering issue may require Sharp + html2canvas + Playwright.
- A broader investigation may require several MCPs and libraries at the same time.

The goal is not to minimize tool calls.

The goal is to use the available toolbox to produce the best correct result.

---

3. MCP & SKILL EXPECTATIONS

Context7 MCP

Use Context7 by default when current library, framework, API, dependency, or implementation documentation is relevant.

- Consult the relevant project/library documentation rather than relying on memory or assumptions.
- Use the correct library mapping from the registry in Section 6.
- When multiple libraries are involved, consult the documentation for the relevant libraries rather than assuming one library's behavior.
- Use the retrieved documentation to guide implementation and verification.
- Do not invent Context7 library IDs.

Stitch MCP

Use Stitch by default for work involving:

- UI design;
- visual design;
- page layout;
- screen composition;
- design exploration;
- visual hierarchy;
- responsive design;
- interaction design;
- visual refinement;
- translating design concepts into implementation;
- improving an existing interface where a visual/design reference can materially improve the result.

Actually call Stitch when it is applicable.

Use Stitch output as implementation/design guidance rather than merely acknowledging it.

When Stitch and Context7 are both relevant, use both.

Neon MCP

Use Neon by default whenever the task involves or depends on:

- PostgreSQL;
- database schema or structure;
- persisted data;
- queries;
- data relationships;
- database-backed features;
- caching or data retrieval behavior;
- database errors;
- database performance;
- backend data flow;
- verifying assumptions about actual stored data.

Use the actual Neon project/database evidence when authorized and applicable.

Do not guess about database structure or behavior when Neon can provide authoritative information.

Agent Skills for Context Engineering

Use the Agent Skills for Context Engineering capability when it can improve:

- task decomposition;
- context management;
- repository understanding;
- implementation planning;
- information retrieval;
- agent execution quality;
- maintaining important constraints;
- reducing context loss;
- reasoning about complex repository changes.

Actually use the skill when applicable and incorporate its guidance.

Other MCPs and Skills

Any additional MCP, skill, integration, or project capability available to the agent should be treated the same way:

- identify it;
- determine whether it can provide value;
- use it when applicable;
- incorporate its output;
- verify the final result.

This requirement applies even when the tool is not specifically listed in this file.

---

4. LIBRARY & PROJECT CAPABILITY USAGE

Use the project's existing libraries and capabilities whenever they are applicable.

Core Framework & Language

- "next" — Next.js application framework, routing, rendering, and framework behavior.
- "react" — UI components, state, lifecycle, and rendering.
- "react-dom" — browser and DOM rendering.
- "typescript" — type safety and static typing.
- "react-error-boundary" — React error boundary and failure handling.

Edge / Deployment / OpenNext

- "@opennextjs/cloudflare" — Next.js deployment adapter for Cloudflare.
- "wrangler" — Cloudflare Workers and deployment tooling.
- "@opennextjs/aws" — OpenNext AWS integration.

Styling / UI / Motion

- "tailwindcss" — utility-based CSS styling.
- "autoprefixer" — CSS vendor prefixing.
- "shadcn/ui" — reusable Radix-based UI components.
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

Use complementary audio libraries when appropriate rather than forcing a single library to handle every sound requirement.

Data / Backend / Services

- "@neondatabase/serverless" — Neon serverless PostgreSQL client.
- "@upstash/redis" — Redis caching and state.
- "stripe" — Stripe server-side payments integration.
- "@stripe/stripe-js" — Stripe browser-side payments integration.
- "resend" — transactional email delivery.

Testing / Browser / Auditing

- "playwright" — end-to-end browser testing and UI verification.
- "playwright-chromium" — Chromium runtime for Playwright browser testing.
- "puppeteer" — headless browser automation, runtime inspection, and auditing.

Quality / Types

- "eslint" — code-quality and static analysis.
- "@types/node" — Node.js type definitions.
- "@types/react" — React type definitions.

Context7 / MCP Integration

- "@upstash/context7-mcp" — Context7 MCP integration.
- "ctx7" — Context7/MCP integration and tooling.

---

5. MANDATORY TOOL & MCP WORKFLOW

For any task where documentation, API behavior, dependency behavior, implementation details, design quality, data behavior, browser behavior, or deployment behavior matters:

Step 1 — Understand the task

Identify:

- what is being requested;
- what existing behavior must be preserved;
- which systems are involved;
- what could break;
- what tools and libraries can help.

Step 2 — Inspect the existing implementation

Review the relevant:

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

Do not make assumptions that can be verified.

Step 3 — Use the available toolbox

Actively use the applicable:

- MCPs;
- Context7;
- Stitch;
- Neon;
- Agent Skills;
- libraries;
- documentation;
- browser tooling;
- repository tooling;
- test infrastructure;
- runtime diagnostics.

When several are relevant, use several.

Step 4 — Apply what was learned

Use the retrieved information and evidence to:

- understand the problem;
- determine the root cause;
- choose the correct implementation;
- avoid unsupported assumptions;
- preserve compatibility;
- improve the quality of the result.

Step 5 — Implement the focused solution

Use existing project architecture and dependencies wherever practical.

Avoid:

- unnecessary rewrites;
- new dependencies without justification;
- unrelated refactors;
- speculative changes;
- changes outside the requested scope.

Step 6 — Verify the actual result

Perform the appropriate verification for the task.

This may include:

- type checking;
- linting;
- unit tests;
- integration tests;
- build checks;
- browser testing;
- visual inspection;
- responsive testing;
- animation timing verification;
- audio verification;
- runtime verification;
- data verification;
- deployment verification.

Step 7 — Double-check before submission

Review the final implementation and diff.

Confirm:

- the requested outcome is actually achieved;
- relevant MCPs/tools were actually used;
- documentation was actually consulted when applicable;
- retrieved guidance was actually applied;
- existing behavior was preserved;
- no protected systems were changed without authorization;
- no unrelated files or functionality were changed;
- no known errors remain;
- the final implementation behaves correctly in the relevant runtime;
- the final result matches the requested design and UX.

---

6. CONTEXT7 LIBRARY REGISTRY — CANONICAL PROJECT MAPPINGS

Use these exact project mappings when consulting Context7 or related MCP tooling.

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
- "shadcn/ui" — Radix-backed Component System
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

- "@upstash/context7-mcp" — Context7 MCP Integration Suite
- "ctx7" — Context7 MCP/Codex Integration

---

7. TASK-TO-DOCUMENTATION ROUTING

Use the relevant documentation and tools for the technologies involved.

A. Audio / Sound

Use:

- "howler";
- "tone";
- "use-sound";
- "pizzicato";
- "framer-motion" when animation timing interacts with audio.

When a reveal or interaction benefits from multiple complementary sounds, use multiple appropriate audio capabilities rather than limiting the implementation to one effect.

B. Animation / Motion

Use:

- "framer-motion";
- relevant rendering/browser tools;
- Context7 documentation.

C. Particles / Visual Effects

Use:

- "tsparticles";
- "framer-motion";
- Stitch when visual/design exploration can improve the result;
- browser verification.

D. Next.js / React

Use:

- "next";
- "react";
- "react-dom";
- "typescript";
- "react-error-boundary";
- Context7.

E. TypeScript / Static Analysis

Use:

- "typescript";
- "eslint";
- "@types/node";
- "@types/react";
- Context7 when library behavior or current guidance matters.

F. Styling / UI / Design

Use:

- "tailwindcss";
- "autoprefixer";
- "shadcn/ui";
- "react";
- "framer-motion";
- Stitch for visual/design work;
- browser verification.

G. Cloudflare / OpenNext

Use:

- "@opennextjs/cloudflare";
- "wrangler";
- "@opennextjs/aws" when applicable;
- "next";
- Context7;
- browser/runtime verification where relevant.

H. Database / PostgreSQL

Use:

- "@neondatabase/serverless";
- Neon MCP tooling;
- Context7 when library behavior or API usage matters.

When authorized, inspect actual database structures and data rather than guessing.

I. Redis / Caching

Use:

- "@upstash/redis";
- relevant data/backend MCPs;
- Context7.

J. Stripe / Payments

Use:

- "stripe";
- "@stripe/stripe-js";
- Context7.

Do not modify payment systems unless the task explicitly authorizes it.

K. Email

Use:

- "resend";
- Context7.

Do not modify email infrastructure unless the task explicitly authorizes it.

L. Image / Canvas

Use:

- "sharp";
- "html2canvas";
- relevant browser tooling;
- Context7.

M. Browser / UI Auditing

Use:

- "playwright";
- "playwright-chromium";
- "puppeteer";
- Stitch where useful for design comparison;
- relevant framework documentation.

N. Full Audits / Deep Investigation

For a broad audit or deep investigation:

- inspect the complete relevant implementation;
- trace the user flow end to end;
- inspect relevant dependencies and configuration;
- use applicable MCPs and skills;
- use Context7 for applicable documentation;
- use Stitch for applicable design/UI investigation;
- use Neon for applicable database/data investigation;
- use browser/runtime verification where applicable;
- identify the root cause rather than stopping at symptoms;
- use evidence to inform the implementation plan.

Do not create a pointless audit-only change or report when the actual requested outcome is to identify and fix the problem.

The audit should produce evidence that informs the proposed implementation.

---

8. PROJECT SAFETY BOUNDARIES

Unless explicitly authorized by the task, do not modify:

- Stripe/payment configuration or payment flows;
- database schema or production data;
- authentication;
- email infrastructure;
- environment variables or secrets;
- Cloudflare account/settings;
- unrelated production infrastructure;
- unrelated application systems.

Neon may be used for authorized inspection and investigation even when no database changes are requested.

Using an MCP does not automatically authorize changing the system it can access.

Do not expose, print, commit, log, or hard-code:

- API keys;
- access tokens;
- passwords;
- secrets;
- private credentials;
- sensitive environment values.

Do not weaken security controls merely to make a task easier.

---

9. PRODUCT & DESIGN GUARDRAILS

LuckyPickCanada is an entertainment product.

It must not be presented as:

- a gambling product;
- a lottery operator;
- a betting service;
- a prize-based wagering service.

Maintain the established premium Canadian visual identity where applicable:

- Northern Lights / Aurora atmosphere;
- Canadian visual cues;
- mystical but polished presentation;
- elegant typography;
- realistic depth;
- lighting and reflections;
- controlled bloom;
- clean, intentional UI;
- premium visual hierarchy;
- polished responsive behavior.

Prefer custom, intentional design over generic templates.

Avoid unnecessary:

- childish/cartoon styling;
- cheap arcade styling;
- casino-style presentation;
- excessive neon;
- visual clutter;
- generic visual effects;
- excessive animation without purpose;
- UI elements that compete with the primary experience.

For visual work, use Stitch when it can improve visual direction, composition, hierarchy, or implementation quality.

Feature-specific visual and interaction requirements must be preserved unless the task explicitly changes them.

---

10. AUDITING & INVESTIGATION

When auditing or troubleshooting:

- inspect the complete relevant behavior rather than isolated snippets;
- trace the flow from user action through state, rendering, dependencies, and runtime behavior;
- use relevant MCPs and documentation rather than assumptions;
- use Neon when database/data behavior is relevant and authorized;
- use Stitch when UI/design investigation is relevant;
- inspect audio timing and lifecycle when audio is involved;
- inspect animation state and timing when animation is involved;
- inspect real data sources when backend/data behavior is relevant;
- use Playwright/Puppeteer when browser behavior is relevant;
- determine the root cause with evidence.

Do not stop at a superficial symptom when the underlying cause can be investigated.

When the requested outcome includes fixing the issue, the investigation should feed directly into the proposed implementation plan.

---

11. VERIFICATION — MANDATORY BEFORE SUBMISSION

DOUBLE-CHECK BEFORE SUBMISSION

Before submitting any fix or change, double-check the complete result.

Confirm all of the following that apply:

- the requested problem is actually solved;
- the requested behavior is present;
- the relevant user flow works end to end;
- repository instructions were followed;
- applicable MCPs were actually called and used;
- applicable skills were actually used;
- relevant documentation was actually retrieved and applied;
- applicable libraries were actually considered and used;
- existing project architecture was respected;
- no unnecessary dependency was introduced;
- existing behavior has not regressed;
- protected systems were not changed without authorization;
- the final diff contains only intended changes;
- no unrelated cleanup or refactoring was included;
- the application builds successfully where applicable;
- types pass where applicable;
- lint passes where applicable;
- tests pass where applicable;
- browser behavior was verified where applicable;
- visual behavior was verified where applicable;
- responsive behavior was verified where applicable;
- animations were verified rather than assumed;
- audio was verified rather than assumed;
- runtime behavior was verified where applicable;
- data/database behavior was verified where applicable;
- deployment behavior was verified where applicable.

A successful compile, build, or lint run alone is not proof that a UI, animation, audio, browser, data, deployment, or runtime problem is fixed.

If verification finds a problem:

fix the problem before submitting the work.

Do not knowingly submit a defective implementation.

---

12. FINAL IMPLEMENTATION STANDARD

The objective is not merely to produce code that compiles.

The objective is to produce a solution that is:

- correct;
- well-integrated with the existing application;
- visually appropriate;
- reliable;
- tested;
- verified in the relevant runtime;
- supported by actual documentation and tool evidence;
- respectful of existing architecture;
- within the requested scope;
- safe for protected systems;
- checked before submission.

Use the available MCPs, skills, libraries, documentation, and project capabilities to maximize the quality of the result.

Do not underuse the toolbox.

Do not merely connect tools. Use them.

Do not guess when the available project tools can provide evidence.

Do not submit until the work has been double-checked.
