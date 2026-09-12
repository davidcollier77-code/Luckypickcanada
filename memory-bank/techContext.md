# Technical Context

## Tech Stack Rules & Environment Patterns
- **Framework:** Next.js App Router (React, TypeScript).
- **Styling & Animation:** Tailwind CSS, Framer Motion, Canvas-based visual effects.
- **Audio:** Howler.
- **Database:** PostgreSQL / Neon.
- **Deployment:** Cloudflare Pages / Workers via OpenNext. (Note: `.open-next` directory and `worker.js` require explicitly running `opennextjs-cloudflare build` after Next.js build).
- **Payments:** Stripe Checkout.
- **Email:** Resend.
- **Security:** Cloudflare Turnstile (public forms).
- **Testing:** Playwright, Vitest, and Testing Library. (Note: The `pytest` test suite mentioned in README.md is not currently present in the codebase).
- **Linting/Formatting:** ESLint, Prettier.
- **Package Manager:** `pnpm` (specifically `pnpm@10.30.3`). The runtime is Node.js 22.x. **Do not use `npm ci`** as it will fail due to peer dependencies. Use `pnpm install --frozen-lockfile`.

## Dependencies & Environment Variables
*(Note: Environment-variable NAMES may be recorded here. Secret VALUES must NEVER be recorded in the Memory Bank.)*
- `STRIPE_SECRET_KEY`: Stripe secret key.
- `RESEND_API_KEY`: Resend API key for gift emails and suggestions.
- `GIFT_FROM_EMAIL`: Verified sender email for gift delivery/suggestions.
- `GIFT_TEST_SECRET`: Secret for sending test gift emails.
- `SUGGESTIONS_FROM_EMAIL` / `SUGGESTIONS_TO_EMAIL`: Configuration for suggestion notifications.
- `POSTGRES_URL` or `DATABASE_URL`: Neon database connection string.
- `ADMIN_PASSWORD`: Password for `/admin/suggestions`.
- `TURNSTILE_SITE_KEY` / `NEXT_PUBLIC_TURNSTILE_SITE_KEY`: Turnstile site key.
- `TURNSTILE_SECRET_KEY`: Turnstile secret key.

## Project Architecture & Data Boundaries
- **Governance:** Strict adherence to `AGENTS.md` is mandatory. The Memory Bank summarizes durable operating constraints but must NOT reproduce or replace the entire governance system. `AGENTS.md` remains the canonical instruction source.
- **Secrets:** All credentials must be treated as write-only/opaque. Never log, output, or store secret values in the Memory Bank.
- **Build Sizes:** The `.docs` directory has an absolute maximum size of 495 MB.
- **Documentation:** Relies on `.docs/` and Context7 API (via Spec Kit integration). Do not claim `.docs` was consulted unless the relevant `.docs` material was actually read.
