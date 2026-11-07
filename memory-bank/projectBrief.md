# Project Brief

## Purpose
Lucky Pick Canada is a Canadian entertainment website that generates random lottery-number picks and provides playful, interactive experiences. It is not affiliated with or endorsed by any lottery organization; its picks and features are for entertainment only.

## Core Experience
- The main experience includes the Lucky Meter, Lucky Cards and card reveal, Crystal Ball / Oracle, Lucky Map / Little Luck Map, Lucky Stories, and gift and tip experiences.
- The number-generation experience is entertainment, not a lottery purchase or promise of winnings.
- The Lucky Meter is not shown in the initial homepage landing viewport.
- The Lucky Card reveal has Standard, Premium, and Flagship presentation tiers; preserve card content and generation/selection logic when changing presentation.

## Platform and Architecture
- Next.js App Router with React, Tailwind CSS, and Framer Motion.
- Deployed to Cloudflare Pages/Workers through OpenNext.
- Neon PostgreSQL supports persisted map submissions and user suggestions.
- Stripe Checkout handles one-time payments; Resend delivers gift emails; Cloudflare Turnstile protects public forms.
- Email is outbound delivery only; the site does not provide an inbound-email workflow.

## Current Product Setup
- **Lucky Pick:** CAD $1.00, one-time payment.
- **Lucky Pick Gift:** CAD $1.99, one-time payment, with email delivery.
- **Tip Jar:** one-time customer-selected amount, with CAD $5.00 suggested.
- These are one-time products, not subscriptions. Treat product amounts, Stripe price IDs, checkout behavior, and gift delivery as existing product configuration; repository governance in `AGENTS.md` controls authorization for changes.

## Experience and Design Principles
- The high-definition Milky Way / night-sky background is a signature part of the site. Preserve its artwork, layering, and living-sky treatment unless the task explicitly asks to change it.
- Preserve existing artwork, copy, layout, navigation, interactions, and number-generation behavior during unrelated maintenance.
- The approved Medallion Gold CTA palette is `#FFF6D3`, `#F4D381`, `#E0AE44`, and `#B1701B`; primary gold actions use the shared raised 3D treatment.
- Respect accessibility, responsive behavior, keyboard interaction, and `prefers-reduced-motion`.
- Mobile PageSpeed is an ongoing improvement goal (roughly 88–90) but must not be pursued by degrading the established visual experience. Record fresh measurements before reporting current scores.

## Memory Bank Lifecycle
- `projectBrief.md` is the lasting project reference: purpose, architecture, product facts, and enduring design constraints. Do not use it as a task log.
- `activeContext.md` contains current unfinished work, open PRs, blockers, and decisions still needed. Keep it concise and explicit; when nothing is active, say so rather than leaving it empty.
- `progress.md` is a compact record of meaningful completed milestones, normally covering the most recent 30 days. Consolidate related work instead of recording every PR, command, or small fix.
- Thirty days is a working-history window, not an automatic deletion date. Keep older information when it remains important to architecture, product behavior, decisions, constraints, or lessons.
- At task completion, reconcile all three files: move lasting facts to this brief, keep only genuinely active items in active context, and summarize meaningful completed work in progress. Avoid duplicate, stale, speculative, or diary-style notes.
- There is no arbitrary file-size limit. Preserve important verified context; never retain secrets, credentials, tokens, or passwords.
