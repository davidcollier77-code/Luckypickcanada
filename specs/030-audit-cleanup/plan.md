# Plan — Repository Cleanup Audit (Feature 030)

## Approach

This audit uses a static analysis approach: grep-based reference tracing, `depcheck` for npm dependencies, `du` for build size measurement, and `git ls-files` for stale tracked files. No local checkout is used; all analysis is performed via repository API.

## Investigation Steps

1. **Enumerate `public/` assets** — List all files in `public/` and cross-reference against `app/`, `components/`, `scripts/` source files using grep.
2. **Audio files** — Search for all `.mp3`, `.wav`, `.ogg` references; flag unreferenced files.
3. **Dependency audit** — Run `pnpm dlx depcheck` and cross-verify each flagged dependency with manual grep to avoid false positives (e.g., dynamic imports, server-side-only packages).
4. **Git artifacts** — Run `git ls-files | grep -E '\.(orig|rej)$'` to identify tracked merge conflict artifacts.
5. **Build size measurement** — Run `du -sk .next public/` and compare against the 495 MB hard ceiling.
6. **Classify findings** — Categorize each finding as CONFIRMED UNUSED, LIKELY UNUSED, or DO NOT REMOVE with supporting evidence and risk assessment.
7. **Document in PR_SUMMARY.md** — Write up categorized findings, build size, and recommendations.

## Limitations

- Static grep analysis cannot detect dynamic imports (e.g., `import(\`/public/${asset}\`)`), CSS `url()` references, or Next.js image loader configurations. Items classified as CONFIRMED UNUSED based on grep alone should be re-verified with bundler analysis before actual removal.
- `depcheck` may produce false positives for packages used via non-standard import patterns, server-side-only usage, or peer dependency requirements.

## Resources

- `AGENTS.md` — governance and routing
- `.jules/deep-dive.md` — investigation methodology
- `package.json` — dependency declarations
- `.docs/manifest.json` — documentation asset structure
- `memory-bank/projectBrief.md`, `memory-bank/activeContext.md` — project context and 495 MB constraint
