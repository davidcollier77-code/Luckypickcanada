# Active Context
- Resolved Dependabot alerts #28 and #29 for `brace-expansion`.
- Fixed Cloudflare Turnstile integration failure on public forms by configuring Next.js environment mapping in `next.config.mjs`.
- Spec Kit updater manifest repair: verified Run #11 reached the generic-integration integrity guard because five managed Jules command files had stale SHA-256 entries in ".specify/integrations/generic.manifest.json". Corrected only those five recorded hashes; the no-force updater workflow and Atlantic schedule remain unchanged.
