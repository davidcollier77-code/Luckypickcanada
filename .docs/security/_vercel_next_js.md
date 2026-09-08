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

### Inspect Next.js Bundled Documentation Directory Structure

Source: https://github.com/vercel/next.js/blob/canary/docs/01-app/02-guides/ai-agents.mdx

Displays the layout of Next.js docs bundled inside node_modules. Agents can access this directory locally to reference version-accurate documentation.

```txt
node_modules/next/dist/docs/
├── 01-app/
│   ├── 01-getting-started/
│   ├── 02-guides/
│   └── 03-api-reference/
├── 02-pages/
├── 03-architecture/
└── index.mdx
```

### Step 1: Point agents at the bundled docs > Docs over the network

Source: https://github.com/vercel/next.js/blob/canary/docs/01-app/02-guides/ai-agents.mdx

Next.js documentation is accessible over the network as plain Markdown by appending .md to documentation URLs or by sending an Accept: text/markdown header, which includes unbundled error message pages. Standard llms.txt and llms-full.txt endpoints are also available following the llms.txt convention for agent discovery.
