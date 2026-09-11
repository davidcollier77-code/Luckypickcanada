# LuckyPickCanada — Technology Stack

## Frontend Framework

- **Next.js** (latest) - React framework with App Router
- **React** (latest) - UI library
- **TypeScript** - Type safety for select components
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Animation library

## Payment & Email

- **Stripe** - Payment processing (@stripe/stripe-js, stripe SDK)
- **Resend** - Email delivery service for gift packages

## Database & Caching

- **PostgreSQL** - Primary database (via @neondatabase/serverless)
- **Upstash Redis** - Key-value caching layer (@upstash/redis)

## UI Components & Effects

- **Lucide React** - Icon library
- **Canvas Confetti** - Celebration effects
- **Howler.js** - Audio management
- **zzfx** - Lightweight sound effects
- **html2canvas** - Screenshot generation

## Deployment & Hosting

- **Cloudflare Pages/Workers** - Primary hosting platform
- **OpenNext Cloudflare** (@opennextjs/cloudflare) - Next.js adapter for Cloudflare
- **Wrangler** - Cloudflare deployment CLI

## Security

- **Cloudflare Turnstile** - Bot protection for public forms
- **DOMPurify** - XSS prevention
- **Zod** - Runtime validation
- **zxcvbn** - Password strength estimation

## Testing & Quality

- **Vitest** - Unit testing framework
- **Playwright** - E2E testing
- **@testing-library/react** - Component testing utilities
- **axe-core** - Accessibility testing
- **ESLint** - Code linting
- **Prettier** - Code formatting

## Monitoring & Error Tracking

- **Sentry** (@sentry/nextjs) - Error tracking and performance monitoring

## Development Tools

- **Husky** - Git hooks
- **lint-staged** - Pre-commit linting
- **pnpm** - Package manager (v10.30.3)

## Build Configuration

- **Node.js** 22.x required
- **Standalone output** - Optimized for Cloudflare deployment
- **Webpack** - Build system (explicit flag in dev/build scripts)
- **Image optimization disabled** - Cloudflare handles CDN

## Environment Variables Required

- STRIPE_SECRET_KEY, RESEND_API_KEY
- GIFT_FROM_EMAIL, GIFT_TEST_SECRET
- SUGGESTIONS_FROM_EMAIL, SUGGESTIONS_TO_EMAIL
- POSTGRES_URL or DATABASE_URL
- ADMIN_PASSWORD
- TURNSTILE_SITE_KEY, TURNSTILE_SECRET_KEY

## Architecture Pattern

- **App Router** (Next.js 13+) with client/server component separation
- **API routes** for backend logic
- **Dynamic imports** for performance optimization
- **Standalone output** for edge deployment
- **Redis caching** for frequently accessed data
