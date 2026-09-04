AGENTS.md

1. Core Operating Rules & Boundaries

- Treat "main" as the source of truth.
- Read and follow this file before making repository changes.
- Inspect the existing implementation before changing it.
- Prefer the smallest safe change that fully solves the requested problem.
- Preserve existing behavior unless the task explicitly requires a change.
- Do not rewrite working systems unnecessarily.
- Do not invent APIs, configuration, dependencies, routes, database structures, or environment variables.
- Do not remove existing functionality unless explicitly requested.
- Keep changes focused and reviewable.

2. MCP AND LIBRARY USAGE

Unless otherwise noted, connect to, call, and actively use the relevant MCPs and libraries available for the task.

Do not merely connect to an MCP, configure it, or acknowledge that it exists. Actually use it.

Use the appropriate MCPs, tools, libraries, and documentation to:

- investigate the existing implementation;
- understand relevant APIs and library behavior;
- validate assumptions;
- troubleshoot problems;
- implement the correct solution;
- verify the result.

Use the library quick-reference below together with the detailed routing and registry in Sections 3–5.

Library quick reference — what each project library is for

Core Framework & Language

- ""next"" — Next.js app framework and routing.
- ""react"" — UI components, state, and rendering.
- ""react-dom"" — React browser/DOM rendering.
- ""typescript"" — Type safety and static typing.
- ""react-error-boundary"" — React error handling boundaries.

Edge / Deployment / OpenNext

- ""@opennextjs/cloudflare"" — Next.js deployment adapter for Cloudflare.
- ""wrangler"" — Cloudflare Workers CLI and deployment tooling.
- ""@opennextjs/aws"" — OpenNext AWS adapter.

Styling / UI / Motion

- ""tailwindcss"" — Utility-based CSS styling.
- ""autoprefixer"" — Automatic CSS vendor prefixes.
- ""shadcn/ui"" — Reusable Radix-based UI components.
- ""framer-motion"" — UI animation and motion.

Graphics / Particles / Rendering

- ""tsparticles"" — Particle systems and ambient effects.
- ""sharp"" — Server-side image processing and optimization.
- ""html2canvas"" — Captures DOM content as canvas images.

Audio

- ""howler"" — Audio playback and lifecycle management.
- ""tone"" — Synthesized audio and Web Audio effects.
- ""use-sound"" — React sound-trigger hook.
- ""pizzicato"" — Audio effects processing.

Data / Backend / Services

- ""@neondatabase/serverless"" — Neon serverless PostgreSQL database client.
- ""@upstash/redis"" — Redis caching and state.
- ""stripe"" — Stripe server-side payments integration.
- ""@stripe/stripe-js"" — Stripe browser payment integration.
- ""resend"" — Transactional email delivery.

Testing / Auditing

- ""playwright"" — End-to-end browser testing and UI verification.
- ""playwright-chromium"" — Chromium runtime for Playwright browser testing.
- ""puppeteer"" — Headless browser automation and auditing.

Quality / Types

- ""eslint"" — Code-quality and lint analysis.
- ""@types/node"" — Node.js type definitions.
- ""@types/react"" — React type definitions.

Context7 / MCP Integration

- ""@upstash/context7-mcp"" — Context7 MCP integration.
- ""ctx7"" — Context7 MCP/Codex integration.

3. Mandatory Tool & MCP Usage

For any task where documentation, API behavior, dependency behavior, implementation details, or current library usage matters:

1. Identify the technologies involved.
2. Match them to the relevant libraries listed in Section 5.
3. Use the relevant MCPs and documentation before implementation when appropriate.
4. Actually call and use the MCPs, not merely connect them.
5. Apply the retrieved guidance to the implementation.
6. When multiple libraries interact, use the relevant documentation for those libraries rather than relying on assumptions.
7. Never invent Context7 library IDs or substitute unrelated documentation.
8. Do not claim that documentation or an MCP was used unless it was actually retrieved and applied.

For repository investigation, use the actual source code, configuration, dependency files, tests, browser/runtime behavior, and relevant MCP tools as evidence.

4. Task-to-Documentation Routing

Use the relevant library documentation when working on these areas:

A. Audio / Sound

Use:

- ""tone"" — synthesized audio and Web Audio.
- ""howler"" — audio playback and lifecycle.
- ""use-sound"" — React sound triggers.
- ""pizzicato"" — audio effects.

Also use ""framer-motion"" when animation timing interacts with audio timing.

B. Animation / Motion

Use:

- ""framer-motion"" — UI animation and motion.

C. Particles / Visual Effects

Use:

- ""tsparticles"" — particle and ambient effects.
- ""framer-motion"" — animated UI and visual motion.

D. Next.js / React

Use:

- ""next"" — application framework and routing.
- ""react"" — UI components and state.
- ""react-dom"" — browser rendering.
- ""typescript"" — type safety.
- ""react-error-boundary"" — error boundaries.

E. TypeScript / Static Analysis

Use:

- ""typescript"" — static typing.
- ""eslint"" — code-quality analysis.
- ""@types/node"" — Node.js types.
- ""@types/react"" — React types.

F. Styling / UI

Use:

- ""tailwindcss"" — utility CSS.
- ""autoprefixer"" — CSS compatibility.
- ""shadcn/ui"" — reusable UI components.
- ""react"" — component implementation.

G. Cloudflare / OpenNext

Use:

- ""@opennextjs/cloudflare"" — Cloudflare deployment adapter.
- ""wrangler"" — Cloudflare Workers tooling.
- ""@opennextjs/aws"" — OpenNext AWS integration.
- ""next"" — Next.js framework behavior.

H. Database / PostgreSQL

Use:

- ""@neondatabase/serverless"" — Neon PostgreSQL client.
- Relevant Neon MCP tooling when database work is authorized and required.

I. Redis

Use:

- ""@upstash/redis"" — Redis caching and state.

J. Stripe / Payments

Use:

- ""stripe"" — server-side Stripe integration.
- ""@stripe/stripe-js"" — browser-side Stripe integration.

Do not modify payment systems unless the task explicitly authorizes it.

K. Email

Use:

- ""resend"" — transactional email delivery.

L. Image / Canvas

Use:

- ""sharp"" — image processing and optimization.
- ""html2canvas"" — DOM-to-canvas rendering.

M. Browser / UI Auditing

Use:

- ""playwright"" — browser testing and UI verification.
- ""playwright-chromium"" — Chromium browser runtime.
- ""puppeteer"" — headless browser automation and auditing.

N. Full Audits / Deep Investigation

For a broad audit or deep investigation:

- inspect the complete implementation;
- trace the relevant user flow end to end;
- use all relevant MCPs and documentation;
- inspect dependencies and configuration;
- use browser/runtime verification when applicable;
- identify the root cause rather than stopping at symptoms;
- produce evidence-based conclusions.

5. Context7 Library Registry — Canonical Project Mappings

Use these exact project mappings when consulting Context7 or related MCP tooling.

Core Framework & Language

- ""next"" — Next.js Core Framework
- ""react"" — React Library
- ""react-dom"" — React DOM Renderer
- ""typescript"" — TypeScript Language Support
- ""react-error-boundary"" — React Error Boundary Utility

Edge / Deployment / OpenNext

- ""@opennextjs/cloudflare"" — OpenNext Cloudflare Adapter
- ""wrangler"" — Cloudflare Workers CLI & Tooling
- ""@opennextjs/aws"" — OpenNext AWS Adapter

Styling / UI / Motion

- ""tailwindcss"" — Tailwind CSS Styling Engine
- ""autoprefixer"" — CSS Vendor Prefixer
- ""shadcn/ui"" — Radix-backed Component System
- ""framer-motion"" — Motion & 3D Animation Engine

Graphics / Particles / Rendering

- ""tsparticles"" — Cosmic Background & Particle System
- ""sharp"" — Node Image Processing Engine
- ""html2canvas"" — DOM-to-Canvas Rendering Utility

Audio

- ""howler"" — Howler.js Audio Lifecycle Manager
- ""tone"" — Tone.js Audio Synthesis Engine
- ""use-sound"" — React Hook for Sound Triggers
- ""pizzicato"" — Pizzicato.js Audio Effects Library

Data / Backend / Services

- ""@neondatabase/serverless"" — Neon Serverless PostgreSQL Client
- ""@upstash/redis"" — Upstash Redis Client
- ""stripe"" — Stripe Server SDK
- ""@stripe/stripe-js"" — Stripe Frontend Client SDK
- ""resend"" — Transactional Email Delivery SDK

Testing / Auditing

- ""playwright"" — End-to-End Browser Testing and UI Verification
- ""playwright-chromium"" — Chromium Runtime for Playwright
- ""puppeteer"" — Headless Browser Automation and Auditing

Quality / Types

- ""eslint"" — Static Code Analysis & Linting
- ""@types/node"" — Node.js Type Definitions
- ""@types/react"" — React Type Definitions

Context7 / MCP Integration

- ""@upstash/context7-mcp"" — Context7 MCP Integration Suite
- ""ctx7"" — Context7 MCP/Codex Integration

6. Project Safety Boundaries

Unless explicitly authorized by the task, do not modify:

- Stripe/payment configuration or payment flows;
- database schema or data;
- authentication;
- email infrastructure;
- environment variables or secrets;
- Cloudflare account/settings;
- production infrastructure outside the requested scope.

Do not expose, print, commit, or hard-code secrets.

7. Product & Design Guardrails

LuckyPickCanada is an entertainment product and must not be presented as a gambling product, lottery operator, or prize-based betting service.

Maintain the established premium Canadian visual identity where applicable:

- Northern Lights / Aurora atmosphere;
- Canadian visual cues;
- mystical but polished presentation;
- elegant typography;
- realistic depth, lighting, reflections, and controlled bloom;
- clean, intentional UI.

Avoid unnecessary:

- childish/cartoon styling;
- cheap arcade styling;
- casino-style presentation;
- excessive neon;
- clutter;
- generic visual effects.

Feature-specific visual and interaction requirements should be provided in the individual task for that feature.

8. Auditing & Investigation

When auditing or troubleshooting:

- inspect the complete relevant behavior rather than isolated snippets;
- trace the flow from user action through state, rendering, dependencies, and runtime behavior;
- use relevant MCPs and documentation rather than assumptions;
- perform actual browser verification for browser-facing issues when possible;
- inspect audio timing and lifecycle when audio is involved;
- inspect real data sources when database/cache behavior is relevant and authorized;
- determine the root cause with evidence.

Do not stop at a superficial symptom when the underlying cause can be investigated.

9. Verification

Verification is mandatory before submitting any fix or change.

DOUBLE-CHECK BEFORE SUBMISSION

Before submitting work, double-check the implementation.

Confirm that:

- the requested problem is actually solved;
- the repository instructions were followed;
- relevant documentation was consulted and applied;
- relevant MCPs were actually called and used;
- existing behavior has not regressed;
- the appropriate build, type, lint, test, browser, visual, audio, or runtime checks were performed;
- protected systems were not changed without authorization;
- the final diff contains only intended changes.

A successful compile or lint run alone is not proof that a UI, animation, audio, browser, or runtime problem is fixed.

If verification finds a problem, fix it before submitting the work rather than submitting a known-defective change.
