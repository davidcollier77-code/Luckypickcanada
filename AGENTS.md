LuckyPickCanada Agent Guide

This file is the permanent operating guide for AI coding agents working in this repository.

---

1. Core Operating Rules & Boundaries

ALWAYS DO

- Investigate first. Trace behavior from the user action through state, component logic, rendering, browser behavior, and relevant dependencies before proposing or implementing a fix.
- Use the existing architecture. Reuse established components, utilities, styles, assets, APIs, and dependencies instead of creating redundant systems.
- Verify before changing. Inspect the actual repository, versions, configuration, and runtime behavior. Never guess paths, APIs, configuration, or library behavior when evidence can establish the answer.
- Keep changes scoped. Make the smallest coherent change that fully solves the requested problem.
- Preserve working behavior. Existing Lucky Pick generation, rarity/weighting, daily-card behavior, Binder behavior, accessibility, APIs, database logic, payments, authentication, and protected integrations must remain intact unless explicitly authorized.
- Follow the project's established visual language. New work must feel like part of LuckyPickCanada, not like an unrelated component or generic template.
- Use documentation appropriate to the task. See Section 3 and Section 4 before implementing library-dependent work.
- Verify the result. Code compiling is not sufficient. Use the appropriate build, type, lint, browser, visual, audio, or runtime verification for the task.

ASK FIRST — REQUIRES EXPLICIT USER AUTHORIZATION

Do not make these changes without explicit authorization:

- Stripe / checkout / payment behavior.
- Resend / transactional email behavior.
- Authentication systems.
- Cloudflare Turnstile.
- Neon database schemas, migrations, production data, or integrity rules.
- Upstash Redis behavior or production data.
- Cloudflare configuration.
- Wrangler configuration.
- OpenNext deployment configuration.
- Environment variables or secrets.
- Existing Lucky Pick generation rules.
- Card rarity or weighting rules.
- Daily Lucky Card selection rules.
- Crystal Ball / Oracle API behavior.
- Installing, removing, or upgrading npm/yarn dependencies.
- Replacing established Lucky Card artwork.

NEVER DO

- Never guess APIs, library behavior, configuration values, file paths, or version-specific implementation details.
- Never claim Context7, MCP, Playwright, Puppeteer, Neon, or another tool was used unless it was actually used.
- Never treat an available MCP connection as evidence that its documentation was consulted.
- Never install a dependency simply because it is convenient.
- Never patch structural layout problems with arbitrary negative margins, magic-number positioning, or overlays whose purpose is to hide incorrect layout.
- Never replace real database/API functionality with static mocks just to make a visual check pass.
- Never delete, weaken, bypass, or rewrite tests solely to make them pass.
- Never redesign or replace established Lucky Card artwork without authorization.
- Never introduce casino-style, cartoonish, cheap arcade, childish, amateur, or generic game aesthetics.
- Never introduce public/stock sound effects for new Lucky Card audio work.
- Never use visual or audio effects that obscure the card, interfere with interaction, or materially degrade mobile performance.

---

2. Project Safety Boundaries

The following systems are considered protected unless the user explicitly authorizes changes:

Protected integrations

- Stripe
- Stripe.js
- Resend
- Authentication
- Cloudflare Turnstile

Protected infrastructure

- Cloudflare configuration
- Wrangler configuration
- OpenNext deployment configuration
- Environment variables
- Secrets

Protected data systems

- Neon PostgreSQL
- Upstash Redis

Protected product logic

- Lucky number generation rules
- Card rarity rules
- Card weighting
- Daily-card selection rules
- No-repeat logic
- Crystal Ball / Oracle behavior

Protected artwork

Existing Lucky Card front and back artwork must remain untouched unless specifically authorized.

Do not tint, recolor, overlay, distort, redraw, replace, or permanently modify card artwork as a shortcut for creating an effect.

Effects should normally exist around the physical card rather than being painted over it.

---

3. Mandatory Tool & MCP Usage

Tools and MCP integrations are part of the project's development workflow.

They must be actively used when relevant.

GitHub

Use GitHub as the source of truth for:

- Repository files
- Branches
- Pull requests
- Commits
- Issues
- Workflow state
- Current source implementation

Inspect the actual current repository state before making repository-level recommendations.

Context7 / The Codex

Context7 is the project's primary documentation source for framework, library, API, configuration, and version-sensitive implementation questions.

Mandatory Context7 procedure

When a task depends on a library or framework:

1. Identify exactly which technology is involved.
2. Find the matching entry in the registry in Section 5.
3. Consult that Context7 documentation before implementation when the task depends on its API, lifecycle, configuration, or recommended usage.
4. Use the retrieved documentation to make the implementation decision.
5. When multiple technologies interact, consult all relevant libraries.
6. Never invent a Context7 library ID.
7. Never substitute a random package/documentation entry simply because its name looks similar.
8. In the final report, identify which Context7 libraries were actually consulted when Context7 was required.

Context7 evidence rule

Opening documentation is not enough.

The implementation must demonstrably reflect the documentation that was consulted.

Do not claim:

- "Context7 verified this"
- "According to Context7"
- "Context7 confirms"

unless the relevant documentation was actually retrieved and used.

---

4. Task-to-Documentation Routing

This section tells agents which parts of this document and which Context7 libraries to consult for common task types.

When a task matches one or more categories below, follow the corresponding routing before implementation.

A. Audio / Sound / Lucky Card Reveal Audio

Read first:

- Section 6 — Audio Rules
- Section 8 — Lucky Card Reveal Quality Bar
- Section 10 — Verification

Consult as relevant:

- "tone"
- "howler"
- "use-sound"
- "pizzicato"

Preferred order

For new original sound creation, prefer:

1. "tone"
2. Native Web Audio concepts documented through the relevant audio tooling
3. Existing project-owned audio assets where appropriate

Use:

- "howler" for lifecycle/playback management when appropriate.
- "use-sound" for React-oriented triggering when appropriate.
- "pizzicato" for audio effects processing when appropriate.

Do not introduce public/stock sound downloads for new Lucky Card audio.

When audio and animation interact, also consult:

- "framer-motion"

Audio timing must be synchronized with the actual visual timeline.

---

B. Animation / Motion / Reveal Sequencing

Read first:

- Section 7 — Product & Design Guardrails
- Section 8 — Lucky Card Reveal Quality Bar
- Section 10 — Verification

Consult:

- "framer-motion"

Use Framer Motion as the primary UI motion/orchestration system.

Do not introduce multiple competing animation frameworks for the same interaction without a clear architectural reason.

---

C. Particle Systems / Cosmic Effects / Nebula / Ambient Energy

Read first:

- Section 7
- Section 8

Consult:

- "tsparticles"
- "framer-motion"

For cinematic backgrounds, particles, atmospheric motion, or mystical energy:

- preserve depth;
- keep light sources visually coherent;
- keep the card readable;
- avoid excessive particle density;
- verify mobile performance.

---

D. Next.js Application Work

Read first:

- Section 3
- Section 7
- Section 10

Consult:

- "next"
- "react"
- "react-dom"
- "typescript"
- "react-error-boundary"

Check the installed versions in the repository before relying on version-specific behavior.

---

E. TypeScript / Static Analysis / Type Errors

Read first:

- Section 3
- Section 10

Consult:

- "typescript"
- "eslint"
- "@types/node"
- "@types/react"

Use actual compiler/linter output rather than reasoning from assumptions.

---

F. Styling / Tailwind / Component UI

Read first:

- Section 7
- Section 10

Consult as relevant:

- "tailwindcss"
- "autoprefixer"
- "shadcn/ui"
- "react"

Do not create duplicate styling systems when an existing component or styling system already supports the requirement.

---

G. Cloudflare / OpenNext / Deployment

Read first:

- Section 2
- Section 3
- Section 10

Consult as relevant:

- "@opennextjs/cloudflare"
- "wrangler"
- "@opennextjs/aws"
- "next"

Infrastructure changes require explicit authorization where defined in Section 2.

Do not make deployment changes under the assumption that they are harmless.

---

H. Database / PostgreSQL

Read first:

- Section 2
- Section 3
- Section 10

Consult as relevant:

- "@neondatabase/serverless"
- Neon tooling/documentation

Inspect real schema/state when the task concerns actual database behavior.

Do not infer database structure from application code alone when the database can be inspected.

---

I. Redis / Caching / State

Read first:

- Section 2
- Section 3

Consult:

- "@upstash/redis"

Inspect actual usage and key/value behavior before modifying caching or persistence logic.

---

J. Stripe / Payments

Read first:

- Section 2
- Section 3

Consult:

- "stripe"
- "@stripe/stripe-js"

Payment changes require explicit authorization.

Do not modify checkout flows merely to solve unrelated UI or feature problems.

---

K. Email

Read first:

- Section 2
- Section 3

Consult:

- "resend"

Email-system changes require explicit authorization.

---

L. Image Processing / Rendering / Canvas Capture

Read first:

- Section 7
- Section 10

Consult as relevant:

- "sharp"
- "html2canvas"

Use the appropriate tool for the actual rendering requirement.

Do not introduce image-processing work when CSS/SVG can solve the problem cleanly.

---

M. Browser/UI Audit

Read first:

- Section 9 — Auditing & Deep Dive
- Section 10 — Verification

Consult/use as appropriate:

- "playwright"
- "playwright-chromium"
- "puppeteer"

A browser audit should examine the actual rendered application, not merely source code.

---

N. Full Audit / Deep Dive / Troubleshooting

Read first:

- Section 3 — Mandatory Tool & MCP Usage
- Section 4 — Task-to-Documentation Routing
- Section 9 — Auditing & Deep Dive
- Section 10 — Verification

Then identify every technology involved and consult the corresponding Context7 entries.

A multi-system audit should use multiple relevant documentation sources rather than forcing the entire investigation through one library.

---

5. Context7 Library Registry — Canonical Project Mappings

These are the maintained Context7 mappings for this repository.

Do not silently substitute another identifier.

Keep this section synchronized when the project intentionally adds or remaps a Context7 library.

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
- "framer-motion" — Motion & 3D Animation Engine

Graphics / Particles / Rendering

- "tsparticles" — Cosmic Background & Particle System
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

- "playwright" — End-to-End Testing Engine
- "playwright-chromium" — End-to-End Testing Engine / Chromium Runtime
- "puppeteer" — Headless Browser Automation & Auditing

Quality / Types

- "eslint" — Static Code Analysis & Linting
- "@types/node" — Node.js Type Definitions
- "@types/react" — React Type Definitions

Context7 / MCP Integration

- "@upstash/context7-mcp" — Context7 Codex & MCP Integration Suite
- "ctx7" — Context7 Codex & MCP Integration Suite

Registry rule

These mappings are canonical for project work.

Do not invent identifiers.

If a task requires documentation for something not represented here, investigate the correct mapping before proceeding.

---

6. Audio Rules — Original, Synchronized, Premium

Audio is a first-class product system.

It is not filler.

Hard rules

- Do not download or introduce public/stock sound effects for new work.
- Prefer original synthesized audio using Tone.js / Web Audio.
- Existing project-owned audio may be reused when appropriate.
- Avoid generic beeps, cartoon sounds, cheap arcade effects, casino-style dings, or obviously stock effects.
- Synchronize audio to actual visual events.
- Treat buildup, impact, movement, flip, reveal, and tier escalation as separate moments when appropriate.
- Respect browser user-gesture activation requirements.
- Correctly manage audio context lifecycle and cleanup.
- Prevent runaway repeated playback.
- Respect accessibility and reduced-motion behavior.
- Avoid audio that becomes annoying during repeated daily interactions.

Lucky Card Reveal Audio Language

A cinematic reveal should be capable of using multiple synchronized layers.

1. Tap

Immediate magical activation cue.

2. Energy buildup

Subtle atmospheric tension, low-frequency movement, or synthesized energy.

3. Side waves

Two directional rising elements corresponding to energy entering from the left and right.

4. Impact

A sharp magical/electrical strike with controlled low-end weight.

This moment should align with:

- energy convergence;
- card reaction;
- small controlled shake;
- radial pulse.

5. Card flip

Fast refined crystalline, metallic, or magical movement synchronized to card rotation.

6. Reveal

Bright premium shimmer/chime as the card face becomes visible.

7. Tier escalation

Standard

- restrained
- satisfying
- short

Premium

- richer
- deeper
- more layered

Flagship

- most dramatic
- more spatial and dimensional
- unmistakably special
- never cheap or chaotic

The objective is premium collectible excitement, not volume or noise.

---

7. LuckyPickCanada Product & Design Guardrails

LuckyPickCanada is a digital entertainment project for fun.

It has no affiliation with gambling and provides no real lottery prizes.

The product must not visually communicate casino gambling.

Established visual identity

Favor:

- premium Canadian identity;
- Northern Lights / Aurora atmosphere;
- maple symbolism;
- starry Canadian night;
- mystical energy;
- realistic depth;
- elegant gold;
- glass;
- luminous accents;
- controlled bloom;
- sophisticated typography;
- atmospheric lighting.

Avoid:

- childish cartoon graphics;
- flat generic game UI;
- cheap arcade styling;
- casino styling;
- excessive neon;
- visual clutter;
- generic stock-looking effects.

Physicality

Elements that are supposed to be physical objects should feel physical.

Use:

- depth;
- realistic light behavior;
- controlled shadows;
- rim lighting;
- atmospheric reflections;
- coherent bloom.

Layering rule

Environmental effects must appear to exist around the physical card.

The environment should react to the card.

Avoid painting the effect directly over the card face or card artwork unless explicitly intended.

---

8. Lucky Card Reveal Quality Bar

The Lucky Card reveal should feel like a premium collectible artifact being activated by a magical environment.

The environment reacts to the card.

The sequence should build anticipation, converge, impact, and resolve.

Preferred sequence

Phase 1 — Ambient

- starfield is alive but restrained;
- subtle motion may exist in background atmosphere;
- card remains the visual anchor.

Phase 2 — Energy buildup

- ambient energy begins increasing;
- atmospheric lighting becomes more noticeable;
- movement remains controlled.

Phase 3 — Convergence

- magical waves begin entering from both sides;
- energy moves toward the card;
- waves may curl, spiral, or funnel inward;
- motion should feel intentional rather than random.

Phase 4 — Impact

Energy reaches the card.

At the exact moment of impact:

- card reacts;
- controlled micro-shake occurs;
- electrical/magical veins may appear;
- radial pulse occurs;
- audio impact occurs;
- particles reinforce the event.

Phase 5 — Flip

The card performs the established flip.

The flip should remain readable.

The effect should support the flip rather than hiding it.

Phase 6 — Reveal

The face becomes visible.

A premium shimmer/chime and controlled particle response reinforce the reveal.

Phase 7 — Resolution

Effects settle.

The revealed card gets a brief visual moment.

Avoid immediately drowning the result in continued effects.

Tier escalation

Escalate:

- anticipation;
- energy density;
- depth;
- audio richness;
- visual complexity;
- impact strength;
- particle sophistication.

Do not simply increase:

- clutter;
- brightness;
- random flashes;
- shake intensity;
- noise.

The hierarchy must remain:

Flagship feels rarer because it feels more extraordinary, not because it is louder.

---

9. Auditing, Troubleshooting, Deep Dives & Fine Polish

When explicitly asked to:

- audit;
- inspect;
- deep dive;
- troubleshoot;
- review;
- fine polish;
- investigate;

do real investigation.

Do not merely skim the source.

Audit workflow

Step 1 — Repository inspection

Trace:

- entry point;
- user interaction;
- state;
- component hierarchy;
- animation flow;
- audio flow;
- API/data flow;
- rendering;
- cleanup;
- browser behavior.

Step 2 — Documentation

Use Context7 for every relevant version-sensitive framework/library involved.

Follow Section 4 routing.

Step 3 — Static checks

Use where applicable:

- ESLint
- TypeScript
- build output

Step 4 — Browser verification

For UI work use:

- Playwright
- Puppeteer

Inspect:

- actual DOM;
- computed layout;
- responsive behavior;
- interaction state;
- animation timing;
- errors;
- console output;
- mobile behavior where relevant.

Step 5 — Audio verification

For audio work inspect:

- user gesture activation;
- audio context;
- synthesis;
- effect chain;
- trigger timing;
- repeated plays;
- cleanup;
- browser compatibility;
- mobile behavior;
- accessibility.

Step 6 — Regression check

Verify that unrelated systems were not changed.

Audit standard

An audit requires evidence from the real repository, runtime, and relevant documentation.

Do not call something an audit if the investigation was only a source-code skim.

---

10. Verification & Final Self-Review

A change is complete only when it has been verified appropriately.

Build

Verify the appropriate production/project build.

Type checking

Run TypeScript checks where applicable.

Linting

Run ESLint where applicable.

Browser

For UI changes verify:

- real rendered behavior;
- DOM;
- computed layout;
- responsiveness;
- interaction;
- visual sequence.

Motion

Verify:

- timing;
- sequencing;
- completion;
- cleanup;
- reduced-motion behavior;
- mobile performance.

Audio

Verify:

- user activation;
- timing;
- synchronization;
- repeated playback;
- cleanup;
- mobile behavior;
- accessibility.

Regression

Confirm that protected systems and established product logic were not unintentionally changed.

Diff review

Review the complete final diff for:

- unrelated changes;
- debug code;
- console logging;
- dead code;
- accidental assets;
- configuration changes;
- dependency changes;
- unexpected generated files.

Context7 evidence

When Context7 was required:

- identify the libraries consulted;
- use the documentation in the implementation;
- never claim documentation was consulted when it was not.

Uncertainty

Clearly report anything that could not be verified.

Never present an assumption as a confirmed result.

---

11. Final Engineering Principle

Do not optimize for:

«"It looks like it works."»

Optimize for:

«Verified, maintainable, production-quality behavior that respects the existing LuckyPickCanada architecture, product identity, performance requirements, and protected systems.»

The best implementation is not necessarily the one with the most code or the most effects.

It is the one that produces the strongest result with the least unnecessary complexity while preserving everything that already works.
