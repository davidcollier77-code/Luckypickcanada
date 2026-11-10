# Project Brief

## Purpose
Lucky Pick Canada is a Canada-wide digital entertainment site that generates random lottery-style number picks and offers playful experiences around luck. It is not a lottery operator, gambling service, or source of winning predictions.

## Main Experiences
- Random lucky-pick number sets.
- Lucky Meter and daily card/reveal experiences.
- Lucky Map and community stories across Canada.
- Crystal Ball / Oracle daily fortune experience.
- Optional digital gifts delivered by email.

## Product and Trust Boundaries
- The site is not affiliated with, endorsed by, or connected to any lottery organization.
- All picks, fortunes, stories and interactive features are for entertainment only.
- Payments are for digital experiences or gifts, not wagers or lottery tickets.
- Preserve existing artwork, visual identity, user-facing behavior and safeguards unless a task explicitly authorizes a change.

## Platform
- Next.js App Router application using React and TypeScript.
- Hosted on Cloudflare Pages, with Cloudflare Workers/OpenNext support.
- Neon PostgreSQL stores application data such as community-story submissions and suggestions.
- Stripe Checkout handles paid experiences; Resend handles email delivery; Cloudflare Turnstile protects public forms.

## Memory Maintenance
- Inspect the live repository before relying on remembered state.
- Keep this file focused on stable project identity and scope.
- Keep current work in activeContext.md and meaningful completed milestones in progress.md.
- Keep verified architecture and tooling facts in techContext.md.
- Memory is context only; AGENTS.md is the sole authoritative governance source.
- Never store secret values, credentials, tokens or passwords. Environment-variable names may be documented only when currently verified and useful.
