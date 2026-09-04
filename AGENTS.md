# LuckyPickCanada Agent Guide

This file is the permanent operating guide for AI coding agents working in this repository.

## Core Reasoning

Understand the user’s actual goal before changing code.

Treat the current repository and working tree as the primary source of truth.

Separate the requested outcome from the visible symptom.

Investigate the root cause before proposing or implementing a fix.

Do not treat the first plausible explanation as proven; look for evidence that could disprove it.

For non-trivial work, consider the viable approaches and choose the one that is most correct, simple, maintainable, compatible, and appropriately scoped.

Prefer the smallest correct change over broad rewrites.

Preserve working architecture unless there is a demonstrated reason to change it.

Never guess file paths, APIs, framework behavior, configuration, test results, deployment state, or tool capabilities.

When uncertain, inspect the repository, run the relevant check, or use an authoritative connected source.

## Investigation Before Implementation

Before modifying code:

Inspect the relevant files, components, styles, configuration, and data flow.

Trace the behavior from user action to rendered result.

Identify the actual dependency chain causing the problem.

Check existing implementations before creating new ones.

Look for existing shared utilities, components, hooks, styles, and libraries that should be reused.

Distinguish stale, unused, duplicated, and active code.

For layout or UI problems, inspect actual DOM structure, computed styles, sizing, positioning, and render order instead of guessing from class names.

For state, persistence, APIs, or database behavior, inspect the real source of truth.

Do not make cosmetic patches to hide a structural problem.

## MCP / Connected Tool Usage

MCP and connected-tool usage is mandatory for repository work.

Always use the available MCPs and connected tools during every task when they provide a relevant capability. Do not skip MCP/tool usage merely because the change appears simple.

Use the appropriate MCP or connected tool to establish facts, inspect current repository state, retrieve authoritative information, or verify behavior rather than relying on memory, assumptions, or inference.

When multiple relevant MCPs are available, use all relevant MCPs needed to properly investigate, implement, and verify the task.

Do not assume that a task is too simple to require MCP/tool usage.

Do not claim to have used an MCP, tool, documentation source, test, or verification step unless it was actually used or run.

### GitHub

Use GitHub for current repository truth:
- source files
- branches
- commits
- pull requests
- issues
- workflows
- GitHub configuration

### Context7

Use Context7 whenever technical documentation, library behavior, framework behavior, API usage, or version-specific information is relevant.

This includes, but is not limited to:
- Next.js
- React
- Tailwind CSS
- browser APIs
- Web Audio & sound synthesis
- visual, motion, and styling libraries
- accessibility behavior
- Cloudflare
- Wrangler
- OpenNext
- third-party libraries and SDKs

Use the repository’s installed versions as the compatibility baseline. Use Context7 to verify the correct documentation and APIs for those versions rather than relying on remembered or potentially outdated information.

#### Context7 Visuals, Motion & Design Library Resolution
When creating or refining visuals, animations, or UI effects:
- Check `package.json` first to identify existing design and motion dependencies (e.g., Tailwind CSS, Framer Motion, Lucide icons, Canvas utilities).
- Use Context7 to retrieve the latest, version-specific APIs for UI animation, canvas-based particle bursts, celestial glows, and glassmorphism styling.
- Ensure visual effects enhance depth and atmosphere without breaking layout responsiveness, accessibility contrast, or reduced-motion preferences.
- Never use cartoonish or flat clip-art effects; maintain high-end, premium, cosmic aesthetics.

#### Context7 Audio & Sound Library Resolution
When implementing, upgrading, or modifying audio, sound effects, or animations:
- Use Context7's library resolution to search for modern Web Audio and synthesis documentation (e.g., Tone.js, Howler.js, or native Web Audio API).
- Check the repository's dependencies (`package.json`) first to see if `tone` or `howler` is already installed, and use Context7 to retrieve the correct, version-specific APIs.
- If synthesis is required without static files, query Context7 for `tone` or native Web Audio API patterns to generate ethereal, celestial, and harmonic chord soundscapes.
- If audio playback via remote high-fidelity CDN streams is needed, query Context7 for `howler` to ensure proper mobile touch unlocking and lifecycle management.
- Do not guess audio APIs, do not use generic system beeps, and do not reference static MP3 files from `/public`.

### Neon

Use Neon whenever the task involves PostgreSQL or Neon-related functionality, including:
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

Use actual database state when it is relevant.

### General Tool Rule

MCPs and connected tools are part of the normal development workflow, not an optional last resort.

Prefer authoritative evidence from MCPs and connected tools over assumptions or memory.

Use multiple relevant MCPs when the task crosses repositories, libraries, APIs, databases, or other system boundaries.

If a relevant MCP is available, use it before making technical assumptions that the MCP can verify.

If a relevant MCP cannot be used, clearly state that limitation rather than pretending it was used.

After implementation, use the appropriate MCPs and connected tools again when they can help verify the resulting work.

## Implementation Discipline

Make changes only within the authorized scope.

Reuse existing architecture and dependencies whenever practical.

Avoid unnecessary dependencies, abstractions, duplication, and rewrites.

Keep unrelated systems untouched.

Do not weaken security, validation, accessibility, or error handling to make a task appear complete.

Preserve existing contracts unless the task explicitly requires changing them.

Keep changes understandable and maintainable.

Handle lifecycle, cleanup, repeated interaction, loading, error, and edge states where relevant.

Do not solve positioning problems with negative margins, arbitrary transforms, absolute positioning, overflow tricks, or similar visual hacks when the real problem is structural.

Do not replace working systems with static mocks merely to satisfy a visual or functional check.

## Protected Systems

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

## LuckyPickCanada Product Guardrails

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

## Visuals, Audio & Card Reveal Directives

- **Card Artwork Protection:** Never alter, distort, or modify the face design or back art of collectible cards when applying reveal effects.
- **Cosmic Glow Origin:** Visual cosmic energy, mystical particles, and atmospheric glows must originate strictly from behind the card container (`z-index: -1` or parent wrappers) to preserve card art integrity.
- **Visual Aesthetic:** Designs must feel premium, celestial, and mystical—not cartoonish, flat, or arcade-like.
- **Never use generic system/OS alert tones, default browser beeps, or mechanical SFX** (e.g., gun-cocking, railguns, clicks).
- **Never load or reference local static sound files (MP3/WAV)** from the repository or `/public` for card reveal events.
- **Sound Design Identity:** Sound design must be procedural, celestial, and ethereal (crystalline chimes, harmonic bells, soft cosmic swells with smooth reverb).
- **Engine Selection:** Synthesize sound in real time using Tone.js or native browser Web Audio API oscillators, or stream curated cinematic audio via Howler from high-fidelity remote CDNs.
- **Mobile Interaction:** Ensure all audio contexts are properly unlocked on touch/click events to comply with mobile autoplay constraints.

## Verification Is Part of the Work

A change is not complete merely because the code compiles.

Verify the behavior the user actually requested.

Run the relevant tests, linting, type checks, or build checks when applicable.

For UI work, inspect the rendered result and relevant responsive states.

For CSS issues, verify the style is actually imported, built, delivered, and applied by the browser.

For animation and audio, verify timing, sequencing, synchronization, cleanup, repeated triggering, lifecycle behavior, browser restrictions, and reduced-motion behavior where relevant.

For database work, verify against the actual database when appropriate.

For deployment-related work, verify the relevant generated output and configuration rather than assuming a successful build means a successful deployment.

Never claim a check passed unless it was actually run and passed.

Never game verification by weakening tests, deleting assertions, hiding errors, disabling validation, or changing the verification process instead of fixing the underlying problem.

## Final Self-Review

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
