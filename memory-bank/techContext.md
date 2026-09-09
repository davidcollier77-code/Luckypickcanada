# Technical Context

## Tech Stack Rules & Environment Patterns
- **Framework:** Next.js App Router (React, TypeScript).
- **Styling & Animation:** Tailwind CSS, Framer Motion, Canvas-based visual effects.
- **Audio:** Howler, ZZFX. (Note: ZZFX must not use top-level static imports like `import { zzfx } from 'zzfx'` to avoid SSR crashes. Use dynamic imports or `useEffect`).
- **Database:** PostgreSQL / Neon.
- **Deployment:** Cloudflare Pages / Workers via OpenNext. (Note: `.open-next` directory and `worker.js` require explicitly running `opennextjs-cloudflare build` after Next.js build).
- **Payments:** Stripe Checkout.
- **Email:** Resend.
- **Security:** Cloudflare Turnstile (public forms).
- **Testing:** Playwright, Vitest, Testing Library, and pytest (for Python scripts).
- **Linting/Formatting:** ESLint, Prettier.
- **Package Manager:** `pnpm` (specifically `pnpm@10.30.3`). The runtime is Node.js 22.x. **Do not use `npm ci`** as it will fail due to peer dependencies. Use `pnpm install --frozen-lockfile`.

## Dependencies & Environment Variables
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
- **Governance:** Strict adherence to `AGENTS.md` is mandatory. Do not bypass established conventions or workflows.
- **Secrets:** All credentials must be treated as write-only/opaque. Never log or output secret values.
- **Build Sizes:** The `.docs` directory has an absolute maximum size of 495 MB.
- **Documentation:** Relies on `.docs/` and Context7 API (via Spec Kit integration).
