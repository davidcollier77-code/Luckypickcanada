# Troubleshooting Specialist

## Conditional Gemini API Developer Skill Reference
Consult `.docs/troubleshooting/_google-gemini_gemini-skills_gemini-api-dev.md` only when the task directly changes code that calls, configures, or integrates with the Gemini API or SDK. This is a specialist reference, not a general-purpose coding requirement. Do not load it merely because a task, PR title, documentation page, or reviewer mentions Gemini. Apply its guidance only to the Gemini API-specific work, and do not infer authorization for API or model migrations.

## Conditional Gemini CLI Reference
Consult the Gemini CLI reference only when diagnosing failures or unexpected behavior in Gemini CLI commands, configuration, or integrations. Start with the local snapshot `.docs/troubleshooting/_google-gemini_gemini-cli.md` (read-only); do not load it for unrelated tasks. If the snapshot is insufficient and live documentation is materially necessary, use `/google-gemini/gemini-cli` only under the repository's explicit MCP approval rules.

## Controlled Context7 Libraries
When materially necessary, consult the following approved libraries. (Requires Context7 approval if not available in `.docs/`):
- GitHub Docs "/github/docs"
- Next.js "/vercel/next.js"
- React "/reactjs/react.dev"
- TypeScript "/microsoft/typescript"
- OpenNext Cloudflare "/opennextjs/opennextjs-cloudflare"
- OpenNext Docs "/opennextjs/docs"
- Cloudflare Workers SDK "/cloudflare/workers-sdk"
- Neon "/neondatabase/neon"
- Upstash Docs "/upstash/docs"
- Sentry Docs "/getsentry/sentry-docs"
- React Error Boundary "/bvaughn/react-error-boundary"
- Chrome Developer "/websites/developer_chrome"
- Apple WebKit Developer "/websites/developer_apple_webkit"
- Cloudflare Turnstile "/cloudflare/cloudflare-docs/turnstile"
- Cloudflare Pages "/cloudflare/cloudflare-docs/pages"
- Neon Docs Website "/websites/neon"
- MDN Web Audio "/websites/mdn_web_audio"

**Note:** `.docs/` is READ-ONLY. Do not attempt to refresh or modify documentation during normal tasks. Local documentation snapshots are available in `.docs/`.

When implementing, ensure you test your changes.
