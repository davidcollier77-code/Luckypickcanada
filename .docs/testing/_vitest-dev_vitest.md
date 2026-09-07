### Common Workflows > Documentation

Source: https://github.com/vitest-dev/vitest/blob/main/AGENTS.md

- Docs live in `docs/` (VitePress); read `docs/AGENTS.md` before working on them
- After ANY change to CLI options or their descriptions in `packages/vitest/src/node/cli/cli-config.ts`, run `pnpm -C docs run cli-table` and commit the regenerated `docs/guide/cli-generated.md`; never edit that file by hand

--------------------------------

### Vitest AI Agent Guide

Source: https://github.com/vitest-dev/vitest/blob/main/AGENTS.md

This document provides comprehensive information for AI agents working on the Vitest codebase.

--------------------------------

### Project Structure > Important Directories

Source: https://github.com/vitest-dev/vitest/blob/main/AGENTS.md

- `docs/` - Documentation (Vite-powered)
- `examples/` - Example projects and integrations
- `scripts/` - Build and development scripts
- `.github/` - GitHub Actions workflows
- `patches/` - Package patches via pnpm

--------------------------------

### Maintenance Guidelines > Release Branches > Documentation Branches

Source: https://github.com/vitest-dev/vitest/blob/main/CONTRIBUTING.md

Release branches correspond directly to documentation sites: `main` supplies unreleased documentation, `release` is manually updated by release managers to point to the latest stable release line, and `vN` branches provide documentation for prior major versions.

--------------------------------

### Troubleshooting > Getting Help

Source: https://github.com/vitest-dev/vitest/blob/main/AGENTS.md

- Check existing issues and documentation
- Review CONTRIBUTING.md for detailed guidelines
- Follow patterns in existing code
