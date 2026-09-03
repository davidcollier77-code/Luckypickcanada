LuckyPickCanada Agent Guide

This is the permanent operating guide for AI coding agents working on the LuckyPickCanada repository.

CRITICAL DIRECTIVE: The current repository is the primary source of truth.

1. Instruction Priority

When instructions conflict, apply this order:

1. The user's current explicit request and authorization.
2. The current repository and working tree.
3. Protected-system rules in this file.
4. Task-specific requirements.
5. This "AGENTS.md".
6. Older notes, previous conversations, generated documentation, or assumptions.

Never allow older information to override the current repository or the user's current explicit instructions.

2. Operating Modes

Read-Only Audit / Investigation

When the user requests an audit, investigation, inspection, review, or diagnosis without authorizing changes:

- Inspect the repository and relevant systems.
- Use the requested tools, including Context7 or Neon when relevant.
- Do not modify the repository.
- Report findings honestly.

When the user later authorizes implementation of identified fixes, switch to implementation mode.

Authorized Implementation

Once the user has explicitly authorized a defined implementation task, proceed through the authorized scope without repeatedly asking for permission for each low-risk change.

Use normal engineering judgment for minor decisions clearly within the approved scope.

Stop and ask the user only when:

- the requirement is materially ambiguous;
- the change is outside the authorized scope;
- a protected system would need an unauthorized change; or
- continuing would create significant or irreversible risk.

3. Standard Implementation Workflow

Follow this sequence:

Understand the task → inspect the current repository → trace the relevant implementation → identify the root cause → make the smallest correct change → verify the result → inspect the final diff → report completion.

Do not skip repository inspection because a previous agent, conversation, audit, or document already described the problem.

4. Non-Negotiable Engineering Rules

Never Fabricate

Never invent or assume:

- file paths;
- APIs;
- functions;
- configuration keys;
- environment variables;
- test results;
- build results;
- deployment results;
- commit hashes;
- tool capabilities; or
- implementation details.

Unknown information must be inspected, tested, or clearly reported as unknown.

Baseline Before Changes

Before modifying files:

- inspect the current git status;
- identify pre-existing changes;
- never overwrite or discard user work;
- inspect relevant callers and dependencies;
- determine the smallest necessary file set.

Investigation First

Do not make speculative fixes based only on filenames, symptoms, old notes, or assumptions.

Trace the actual implementation and determine the root cause before changing it.

Surgical Change Rule

- Change only what the task requires.
- Avoid unrelated refactors, cleanup, formatting churn, dependency upgrades, or architectural changes.
- Do not replace working architecture simply because another approach looks cleaner.
- Supporting changes are permitted only when required for correctness, compatibility, or verification.
- Every changed file must have a clear task-related reason.

Stop Rather Than Guess

When unexpected repository state, conflicting implementations, missing dependencies, or materially ambiguous requirements make safe continuation uncertain, stop rather than inventing an answer.

For minor obvious issues within scope, use normal engineering judgment.

5. Protected Systems

The following systems are protected:

- Stripe;
- checkout;
- gifts;
- email delivery;
- authentication;
- Cloudflare Turnstile;
- database access;
- environment variables;
- secrets and credentials;
- Cloudflare settings;
- Wrangler configuration; and
- OpenNext configuration.

Default rule: do not modify protected systems unless the user's task explicitly requires it.

When explicitly authorized:

- make the smallest necessary change;
- preserve existing contracts;
- do not refactor surrounding protected systems unnecessarily; and
- never expose secrets, tokens, credentials, or private configuration.

Visual or styling work is not permission to alter protected functionality.

6. Context7, Neon, and GitHub Tool Usage

Use connected tools when they materially improve the accuracy of the work.

Context7

Use Context7 whenever current, authoritative, or version-specific documentation could materially affect the task.

This includes, but is not limited to:

- Next.js;
- React;
- Tailwind CSS;
- CSS and browser APIs;
- Canvas APIs;
- Web Audio API;
- animation APIs;
- animation timing or synchronization;
- visual effects;
- frontend interaction behavior;
- responsive behavior involving framework APIs;
- accessibility APIs or framework behavior;
- Cloudflare;
- Cloudflare Pages;
- Cloudflare Workers;
- Wrangler;
- OpenNext;
- deployment configuration;
- third-party libraries;
- SDKs;
- APIs; and
- platform-specific behavior.

For visual, animation, or audio work, do not assume that documentation is unnecessary simply because the task looks like a design change. Use Context7 when the implementation depends on library, framework, browser, API, or platform behavior.

Prefer authoritative or official documentation sources through Context7.

Do not put Context7 API keys, bearer tokens, or credentials into "AGENTS.md", source files, commits, or other repository content. Authentication belongs in the connected MCP/tool configuration.

Neon

Use Neon whenever the task materially involves Neon or PostgreSQL-backed functionality.

This includes:

- schemas;
- tables;
- queries;
- migrations;
- indexes;
- database configuration;
- database troubleshooting;
- branches;
- connection behavior;
- Neon-specific APIs or features;
- data integrity;
- persistence behavior; and
- application features whose correctness depends on the database.

Use Neon to inspect actual database state when that is relevant rather than relying on assumptions or stale documentation.

Do not use Neon for unrelated frontend or documentation tasks.

GitHub

Use GitHub tools when the task requires current repository information or GitHub-specific actions, including:

- repository files;
- branches;
- commits;
- pull requests;
- issues;
- workflow information; and
- GitHub-specific configuration.

7. Verification Is Part of Completion

Verification must match the actual task.

Logic and Functionality

Run the narrowest relevant automated checks or exercise the affected behavior.

UI and Visual Work

Verify the rendered result, not merely the source code.

Where practical, verify:

- desktop;
- mobile;
- relevant viewport sizes;
- affected interactions;
- animation behavior;
- timing;
- responsive layout;
- accessibility behavior;
- reduced-motion behavior; and
- visual consistency with the existing product.

CSS and Theme Work

When relevant, verify:

- the CSS exists;
- it is imported;
- it is included in the build;
- it is delivered at the expected path;
- it is not being overridden unexpectedly; and
- the browser actually applies it.

Animation and Audio Work

When relevant, verify the actual user experience rather than only the implementation.

Check:

- animation sequencing;
- timing;
- synchronization;
- cleanup;
- repeated triggering;
- interaction state;
- audio initialization and lifecycle;
- browser restrictions;
- reduced-motion behavior; and
- mobile behavior.

SEO

When relevant, verify actual generated or served:

- metadata;
- titles;
- descriptions;
- canonical behavior;
- sitemap;
- robots behavior;
- structured data; and
- affected routes.

Build and Deployment

Verify the actual relevant build, output, and configuration path.

Do not claim that a deployment, production asset, or build output works unless it was actually verified.

Security

Perform appropriate security validation for security-sensitive work without exposing secrets.

Documentation

For documentation-only work, verify referenced commands, paths, APIs, and links when practical.

Never claim verification that was not actually performed.

8. Visual Verification Standard

LuckyPickCanada is a highly visual product.

For visual changes, source inspection alone is insufficient.

Where practical, verify the rendered result on relevant desktop and mobile layouts and exercise the affected interaction.

Preserve the product's visual character:

- premium Canadian identity;
- maple leaf motifs;
- Northern Lights / Aurora atmosphere;
- starry night sky;
- gold accents;
- glass and translucent surfaces;
- controlled glow;
- premium typography;
- atmospheric motion; and
- intentional visual hierarchy.

Do not flatten the experience into a generic dashboard or generic UI.

9. Never Game Verification

Never make verification appear successful by:

- weakening assertions;
- deleting tests;
- disabling validation;
- narrowing scope only to hide failures;
- hiding errors;
- removing protected functionality;
- changing the verification command instead of fixing the underlying issue; or
- otherwise manipulating the verification process.

10. Final Self-Review

Before declaring completion:

- inspect the final diff;
- confirm only intended files changed;
- check for accidental refactors or unrelated churn;
- verify imports and references;
- remove debug or temporary code;
- confirm protected-system boundaries remain intact;
- confirm the requested behavior was actually addressed;
- check that the final implementation matches the current repository architecture.

11. Completion Report

A completion report must state:

- what changed;
- which files changed;
- what was actually verified;
- which checks passed;
- which checks failed;
- which checks were skipped or unavailable; and
- any remaining uncertainty or risk.

Never state that a check passed unless it was actually run and passed.

For read-only audits, report findings without implying that fixes were made.

12. Command Accuracy

Before requiring or documenting a project command, verify that the command actually exists in the current repository and tooling.

Do not preserve stale commands merely because they appeared in older documentation.

13. Architecture-Map Accuracy

Use the current repository to verify architecture and paths.

Do not invent replacement paths.

When a specific path cannot be confidently verified, describe the relevant subsystem without fabricating a path.

14. Project Identity

LuckyPickCanada is a digital entertainment experience centered around Canadian luck, mystery, community, and premium visual presentation.

It is not affiliated with real-world gambling or lottery prizes.

The product includes free interactive experiences and premium entertainment/gift experiences.

15. Repository Overview

The project uses:

- Next.js App Router;
- React;
- Tailwind CSS;
- OpenNext;
- Cloudflare Pages/Workers;
- Stripe;
- Resend;
- Cloudflare Turnstile; and
- PostgreSQL / Neon-backed data where configured.

The current repository remains authoritative if implementation differs from this overview.

Routes

- "/" — Homepage, Hero, Lucky Pick generator, Lucky Meter entry, Crystal Ball entry.
- "/lucky-meter" — Daily Resonance ritual.
- "/map" — Community Lucky Map.
- "/stories" — Community Lucky Stories.
- "/crystal-ball" — Interactive Oracle experience.
- "/admin/suggestions" — Admin suggestion review.

16. Architecture Map

Only rely on these paths after confirming they still exist in the current repository.

Homepage

- "app/homepage/HomePage.js"
- "app/homepage/Hero.js"
- "app/homepage/Header.js"
- "app/homepage/FAQSection.js"

Lucky Pick Generator

- "app/lucky-reveal.js"
- "app/lucky-reveal-popup.js"
- "components/LuckyGenerator.tsx"

Lucky Card Reveal

- "app/lucky-card-data.js"
- "app/lucky-card-content.js"
- "app/lucky-card-reveal.js"
- "app/collection-binder.js"

Lucky Meter / Daily Resonance

- "app/lucky-meter/page.js"
- "components/DailyResonance.tsx"
- "components/ResonanceButton.tsx"
- "components/midnight-countdown.js"
- "app/hooks/useRollingScore.ts"

Crystal Ball / Oracle

- "app/crystal-ball/page.js"
- "app/crystal-ball-client/CrystalBallClient.js"
- "app/api/oracle/route.js"

Community Stories / Map

- "app/map/page.js"
- "app/stories/page.js"
- "app/lucky-map-of-canada/lucky-map-of-canada.js"
- "app/lucky-stories.js"
- "app/api/lucky-stories/route.js"
- "app/api/luck-map/route.js"

Payments / Stripe

- "app/api/checkout/route.js"
- "app/api/stripe-webhook/route.js"

Gifts

- "app/api/gift-delivery/route.js"
- "app/api/send-gift/route.ts"
- "app/gift-email.js"

Visual Design / Backgrounds

- "components/Aurora.tsx"
- "components/Starfield.tsx"
- "components/ShootingStars.tsx"
- "components/CosmicBackground.tsx"

Theme / CSS

- "themes/default/theme.js"
- "app/globals.css"
- "tailwind.config.js"

Security

- "app/turnstile-config.js"
- "app/turnstile-field.js"
- "app/form-security.js"

Build / Deployment

- "package.json"
- "wrangler.jsonc"
- "open-next.config.ts"
- "next.config.mjs"

Database

- "app/lib/db-init.js"

17. Core User Experiences

Lucky Pick

Generates 6 numbers from 1–49 or 7 numbers from 1–50 without duplicates.

Preserve:

- number-generation rules;
- reveal pacing;
- Aurora/stars effects;
- lucky color;
- lucky day;
- entertainment framing; and
- integration with Stripe checkout.

Do not conflate entertainment logic with payment logic.

Lucky Card Reveal

This is a critical weighted card-selection system.

Tiers include:

- Standard;
- Premium; and
- Flagship.

Preserve:

- rarity logic;
- weighted selection;
- card IDs;
- artwork;
- card data;
- selection behavior; and
- anti-repeat behavior where already implemented.

Do not destructively merge card data and selection logic.

Lucky Meter / Daily Resonance

A premium interactive daily ritual producing a luck result from 0–100%.

Preserve the current implementation's:

- daily-use rules;
- midnight reset/countdown behavior;
- previous-day protections;
- reveal sequence;
- sound effects / Web Audio behavior;
- animation timing; and
- interaction states.

A visual task is not permission to remove or alter these functional rules.

Crystal Ball / Oracle

An interactive question experience connected to the Oracle API.

Preserve:

- API contracts;
- loading and result states;
- session/history behavior;
- error handling; and
- atmospheric visuals.

Do not replace the real API flow with static content unless explicitly required by the task.

Community Stories and Lucky Map

Preserve the relationship between:

- community data;
- province information;
- stories;
- map presentation; and
- shared data structures.

Do not break data structures merely to change presentation.

Homepage

The homepage is the central entry point connecting the major experiences.

Preserve:

- background effects;
- calls to action;
- feature connections;
- responsive behavior; and
- existing interaction flows.

Gifts and Suggestions

Preserve the current gift-delivery, suggestion-submission, and admin-review functionality unless explicitly included in the task.

18. Visual Design System

LuckyPickCanada's visual identity is a premium Canadian night-sky experience.

Important elements include:

- maple leaf motifs;
- Aurora / Northern Lights;
- stars and celestial effects;
- gold accents;
- glass/translucent surfaces;
- controlled glow;
- atmospheric depth;
- premium typography; and
- purposeful motion.

Visual changes should improve this identity rather than replace it with generic UI patterns.

Aurora and Background Effects

The project may use a combination of:

- CSS;
- gradients;
- HTML5 Canvas;
- React components; and
- animation logic.

Always inspect the current implementation before deciding how a visual effect works.

Preserve, where already implemented and relevant:

- realistic layering;
- "globalCompositeOperation = 'screen'" behavior;
- ambient stars;
- shooting stars;
- constellation twinkling;
- controlled glow; and
- content readability.

Do not assume that Aurora, stars, shooting stars, and other atmospheric effects are interchangeable.

19. Animation, Audio, and Interaction

For changes involving animation, motion, audio, or synchronization:

- inspect the current implementation first;
- use Context7 when browser/framework/API behavior is relevant;
- preserve existing timing relationships unless the task explicitly changes them;
- preserve cleanup and lifecycle behavior;
- avoid duplicated listeners, timers, animation frames, or audio nodes;
- respect reduced-motion preferences;
- verify the actual interaction where practical.

Design quality includes synchronization between visuals, motion, sound, and user interaction.

20. Performance

Avoid unnecessary performance costs.

Preserve:

- lazy loading;
- dynamic imports where appropriate;
- efficient rendering;
- existing caching behavior;
- reasonable asset sizes; and
- bounded animation work.

Avoid:

- unnecessary client-side JavaScript;
- unnecessary dependencies;
- large assets without justification;
- unbounded animation loops;
- redundant Canvas operations; and
- unnecessary rerenders.

Respect "prefers-reduced-motion".

21. Mobile and Responsive Behavior

The site must work across:

- narrow phones;
- larger phones;
- tablets; and
- desktop displays.

Preserve:

- viewport-height behavior;
- touch targets;
- fixed and sticky UI behavior;
- readable typography;
- modal behavior;
- responsive spacing; and
- interaction usability.

Do not break mobile behavior to solve a desktop-only issue, or vice versa.

22. Accessibility

Preserve and improve accessibility.

Use:

- semantic HTML;
- accessible labels;
- visible keyboard focus;
- appropriate ARIA attributes;
- usable touch targets;
- sensible keyboard behavior; and
- reduced-motion support.

Custom modals and interactive overlays should correctly handle Escape-key dismissal and listener cleanup where applicable.

23. Build and Deployment

The project uses pnpm, Next.js, OpenNext, and Cloudflare deployment tooling.

Preserve working:

- build scripts;
- Node/runtime expectations;
- "wrangler.jsonc";
- OpenNext configuration;
- static-asset handling; and
- deployment architecture.

Do not casually change Node versions, Wrangler settings, OpenNext configuration, or build architecture.

Do not reintroduce recursive build behavior.

For build/deployment problems, inspect the complete relevant path before modifying configuration.

24. CSS and Theme Architecture

The project may combine:

- global CSS;
- CSS modules;
- inline styles;
- Tailwind CSS;
- theme assets; and
- component-level styling.

Before rewriting styles for a visual problem, determine:

Does the CSS exist? Is it imported? Is it built? Is it delivered? Is it applied? Is it overridden?

Fix the actual failure point instead of replacing working styling systems unnecessarily.

25. Shared Dependencies

Some functionality is shared across multiple features.

Examples include:

- Community data shared by Map and Stories;
- theme assets and identifiers;
- Canvas-based visual systems;
- shared visual components;
- API contracts; and
- database-backed data.

Before changing a shared dependency, inspect all relevant consumers.

Do not fix one feature by silently breaking another.

26. Change-Safety Rules

Visual Work Does Not Authorize Business-Logic Changes

A visual task does not authorize changing:

- payment logic;
- card-selection logic;
- database behavior;
- API contracts;
- security behavior;
- authentication;
- email delivery; or
- other protected functionality.

Verify After Modification

After changes, use appropriate read-only inspection and verification tools to confirm the final state.

27. Final Verification Checklist

Before completion, confirm:

- git status was checked;
- only intended files changed;
- no unrelated refactor was introduced;
- relevant imports and references are valid;
- affected functionality was actually tested or exercised;
- visual changes were actually rendered and inspected where practical;
- build verification was performed when relevant;
- protected systems remain intact;
- no secrets were exposed;
- final behavior matches the user's request; and
- the completion report accurately describes what was and was not verified.

The standard project build check is:

"pnpm run build"

Run it when appropriate to the task and repository state. Do not claim it passed unless it was actually run successfully.

28. Keep This File Focused

This file should contain practical rules and project knowledge that materially help coding agents work safely and correctly.

Do not add:

- generic programming tutorials;
- generic Git tutorials;
- generic shell tutorials;
- lengthy explanations of AI behavior;
- repetitive rules; or
- instructions that do not materially affect work in this repository.

When detailed subsystem documentation becomes necessary, prefer dedicated project documentation rather than continually expanding this file.
