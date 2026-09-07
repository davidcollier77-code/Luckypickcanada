### Documentation as Homepage in Plugin Config

Source: https://github.com/vercel/next.js/blob/canary/skills/.claude-plugin/plugin.json

The plugin configuration declares the documentation page as the plugin homepage.

```json
"homepage": "https://nextjs.org/docs"
```

--------------------------------

### Official Documentation URL in Core Package README

Source: https://github.com/vercel/next.js/blob/canary/packages/next/README.md

The core Next.js package README explicitly states the official documentation URL.

```markdown
Visit [https://nextjs.org/docs](https://nextjs.org/docs) to view the full documentation.
```

--------------------------------

### Developer and Operator Documentation Overview

Source: https://github.com/vercel/next.js/blob/canary/AGENTS.md

The AGENTS.md file (symlinked as CLAUDE.md) provides comprehensive developer and operator documentation for the Next.js repository, including codebase structure, build commands, development workflow, testing procedures, CI triage, and debugging guidelines.

```markdown
# Next.js Development Guide

> **Note:** `CLAUDE.md` is a symlink to `AGENTS.md`. They are the same file.

## Codebase structure

### Monorepo Overview

This is a pnpm monorepo containing the Next.js framework and related packages.

```
next.js/
├── packages/           # Published npm packages
├── turbopack/          # Turbopack bundler (Rust) - git subtree
├── crates/             # Rust crates for Next.js SWC bindings
├── test/               # All test suites
├── examples/           # Example Next.js applications
├── docs/               # Documentation
└── scripts/            # Build and maintenance scripts
```

### Core Package: `packages/next`

The main Next.js framework lives in `packages/next/`. This is what gets published as the `next` npm package.

**Source code** is in `packages/next/src/`.

**Key entry points:**

- Dev server: `src/cli/next-dev.ts` → `src/server/dev/next-dev-server.ts`
- Production server: `src/cli/next-start.ts` → `src/server/next-server.ts`
- Build: `src/cli/next-build.ts` → `src/build/index.ts`
```

--------------------------------

### Configure Agent Guidance in AGENTS.md (Markdown)

Source: https://github.com/vercel/next.js/blob/canary/docs/01-app/02-guides/ai-agents.mdx

Directs AI coding agents to read bundled docs located in node_modules before generating code. Keep custom instructions outside the managed comment block so they persist across updates.

```markdown
<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
```

### Step 1: Point agents at the bundled docs > Docs over the network

Source: https://github.com/vercel/next.js/blob/canary/docs/01-app/02-guides/ai-agents.mdx

Next.js documentation is accessible over the network as plain Markdown by appending .md to documentation URLs or by sending an Accept: text/markdown header, which includes unbundled error message pages. Standard llms.txt and llms-full.txt endpoints are also available following the llms.txt convention for agent discovery.
