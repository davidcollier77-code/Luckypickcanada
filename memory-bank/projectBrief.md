# Project Brief

## Core Goals
- Provide a digital entertainment experience centered around generating random Canadian lottery number sets (Lucky Pick Canada).
- Offer fun and engaging features like the Lucky Meter, Lucky Cards, Lucky Map of Canada, and Crystal Ball / Oracle.
- Provide a seamless digital gift experience, allowing users to send lucky picks via email using Stripe integration for payments.

## Scope
- The primary application is a Next.js App Router project deployed on Cloudflare Pages/Workers (using OpenNext).
- The project includes a React frontend with Tailwind CSS for styling and Framer Motion for animations.
- The backend utilizes Neon PostgreSQL for data storage, including submissions to the Little Luck Map and user suggestions.
- Integrations include Stripe Checkout for payments, Resend for email delivery, and Cloudflare Turnstile for public form verification.
- **Note:** A local utility script (`luckypick.py`) is described in the `README.md` to generate picks via terminal, but this file does not currently exist in the repository.

## Non-Gambling Disclaimers
- Lucky Pick Canada is **not affiliated with, endorsed by, or connected to any lottery organization.**
- The picks and features provided are for **fun and entertainment purposes only.**
- This is a digital entertainment platform, not a gambling or real-money gaming service.

## Memory Lifecycle & Maintenance
- **Inspect First:** Future Jules sessions must inspect the current repository before trusting memory. Treat memory as context, not as absolute proof.
- **Update Context:** Update `activeContext.md` when work starts and finishes; remove stale next steps.
- **Record Progress:** Move meaningful completed work into `progress.md`. Preserve stable project identity here in `projectBrief.md`.
- **Verified Facts:** Record only verified information. Identify unknown/unverified information honestly.
- **Governance:** The Memory Bank must never duplicate or override `AGENTS.md` as a second governance system. `AGENTS.md` is the canonical instruction source.
- **No Secrets:** Persistent project memory may NEVER contain secret values, credentials, API keys, passwords, etc. Environment-variable names are acceptable when useful.
