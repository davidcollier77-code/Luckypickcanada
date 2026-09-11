# LuckyPickCanada — Development Guidelines

## Core Principles

1. **Minimal Changes Only** - Make only changes required by the assigned task or PR fix
2. **Preserve Existing Functionality** - Do not modify working features unless explicitly required
3. **No Unrelated Work** - Avoid cleanup, refactoring, dependency upgrades, or architectural changes outside scope

## Protected Systems

**Do not modify unless explicitly authorized:**

- Stripe integration, payments, pricing, webhooks
- Authentication and authorization
- Database schema and migrations
- Secrets and environment variables
- Cloudflare configuration (wrangler.jsonc, open-next.config.ts)

## Security Requirements

- **Never expose** secrets, API keys, tokens, credentials, or private configuration
- **Never print, log, or commit** sensitive data
- Use environment variables for all credentials
- Validate and sanitize all user inputs
- Use Cloudflare Turnstile for bot protection on public forms

## Development Workflow

1. **Inspect first** - Review current repository state before making changes
2. **Stay consistent** - Follow existing patterns and architecture
3. **Test thoroughly** - Run required verification after changes
4. **Review diffs** - Inspect final diff for unintended changes
5. **Report accurately** - Only report work actually performed

## Code Style

- Follow existing component patterns (client vs. server components)
- Use TypeScript for new complex components
- Follow Tailwind CSS utility patterns
- Use dynamic imports for performance-critical components
- Maintain accessibility (ARIA labels, semantic HTML)

## Performance Considerations

- Lazy load non-critical components
- Use caching where appropriate (Redis)
- Optimize images and assets
- Keep bundle sizes minimal
- Test on Cloudflare Workers constraints
