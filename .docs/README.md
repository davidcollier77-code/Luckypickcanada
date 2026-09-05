# Local Library Reference System

This directory (`.docs/`) serves as the local documentation and reference system for the LuckyPickCanada project.

## Purpose

Instead of querying Context7 repeatedly for routine information about approved libraries, agents can refer to this local system. This reduces external tool calls, guarantees version-accurate reference material, and keeps agent workflow focused and efficient.

## Usage

Agents should consult these files when implementing features or fixing bugs related to specific technologies in the stack:

1. **Check this folder first**: Before reaching out to Context7 for basic API lookups, search the relevant library markdown file in `.docs/`.
2. **Context7 for Deep Dives**: If the information here is insufficient or missing, use Context7 (`context7_resolve-library-id` -> `context7_query-docs`) to retrieve the needed documentation, and apply the learnings to the codebase.

## Updating

This documentation is maintained automatically by a GitHub Actions workflow (`.github/workflows/refresh-docs.yml`).

- **Automatic**: Runs every Friday at 2:00 AM (America/Halifax / AST). It checks the project's lockfile for changes and creates an actionable issue if a refresh is needed.
- **Manual**: Can be triggered manually via the `workflow_dispatch` event in the Actions tab on GitHub.

When an agent is assigned to refresh the documentation (e.g., via the automated issue), the agent should:
1. Verify the current installed versions in `package.json`.
2. Use Context7 to retrieve the most critical, practical usage patterns and APIs for the updated libraries.
3. Update the corresponding markdown files in this `.docs/` directory without dumping excessive, irrelevant data.

## Approved Inventory

Always ensure that only currently approved libraries are documented here. Refer to `AGENTS.md` for the official list of authorized libraries and their purposes.
