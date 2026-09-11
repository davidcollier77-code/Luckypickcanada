# LuckyPickCanada — Repository Structure

## Core Application

```
app/
├── homepage/          # Homepage components (Hero, FAQs, HomePage.js)
├── crystal-ball/      # Crystal Ball oracle feature
├── lucky-meter/       # Daily luck meter/resonance feature
├── reveal/            # Daily card reveal system
├── map/              # Lucky Stories map (Canada provinces/territories)
├── about/            # About the creator page
├── api/              # API routes
│   ├── checkout/     # Stripe checkout session creation
│   ├── oracle/       # Crystal Ball oracle responses
│   ├── suggestions/  # Suggestion box submissions
│   ├── visits/       # Visit counter
│   ├── send-gift/    # Gift email delivery
│   └── stripe-webhook/ # Stripe payment webhooks
├── components/       # Shared React components
├── lib/             # Utilities (database, caching)
└── globals.css      # Global styles
```

## Key Directories

- **.amazonq/rules/** - Amazon Q configuration and guidelines
- **.docs/** - Documentation organized by task type (audio, creation, deep-dive, polishing, security, seo, testing, troubleshooting)
- **.jules/** - Jules AI configuration and commands
- **.specify/** - Specification workflow tools and templates
- **components/** - Reusable React components (Aurora, CosmicBackground, DailyResonance, LuckyGenerator, etc.)
- **public/** - Static assets (images, sounds, themes, logos)
- **scripts/** - Build and maintenance scripts (refresh-docs.js)
- **themes/** - CSS theme system (default theme with tokens, effects, map styling)

## Configuration Files

- **package.json** - Dependencies and scripts (Next.js, React, Stripe, Resend, PostgreSQL, etc.)
- **next.config.mjs** - Next.js configuration (standalone output, Cloudflare compatibility, redirects)
- **tailwind.config.js** - Tailwind CSS configuration
- **tsconfig.json** - TypeScript configuration
- **wrangler.jsonc** - Cloudflare Workers/Pages configuration
- **open-next.config.ts** - OpenNext (Cloudflare adapter) configuration

## Database Tables

- **luck_shares** - Lucky Pick purchase submissions by province
- **suggestions** - User suggestions from the suggestion box
- **stories** - Lucky Stories submissions for the Canada map

## Documentation Organization

The `.docs/` directory is organized by development phase:
- **audio** - Audio/sound implementation docs
- **creation** - Initial feature creation references
- **deep-dive** - In-depth technical documentation
- **polishing** - UI/UX refinement references
- **security** - Security best practices and tools
- **seo** - SEO optimization guides
- **testing** - Testing frameworks and approaches
- **troubleshooting** - Common issues and solutions

Each subdirectory contains documentation pulled from relevant GitHub repositories and web resources.
