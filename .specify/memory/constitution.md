<!--
Sync Impact Report:
Version change: 0.0.0 -> 1.0.0
Modified principles: Populated all placeholder templates with LuckyPickCanada principles aligned with AGENTS.md.
Added sections: Technology Stack & Constraints, Development Workflow.
Removed sections: None.
Follow-up TODOs: None.
-->
# LuckyPickCanada Constitution

## Core Principles

### I. Single Source of Truth
`AGENTS.md` is the canonical repository-level authority. All AI agents must read it first. Memory systems, specialist instructions (`.jules/*.md`), and Spec Kit artifacts are complementary and must never override or duplicate `AGENTS.md`.

### II. Verify Before Acting
Never assume repository state, tool availability, or documentation content. Agents MUST independently inspect the actual codebase, run necessary verification commands, and confirm the environment before drafting plans or executing changes.

### III. The Implementation Sequence
All work MUST follow the required sequence: INSPECT → IDENTIFY → UNDERSTAND → PLAN → IMPLEMENT → TEST → DOUBLE-CHECK → REPORT → CREATE PR. Plans must be presented for approval before making changes.

### IV. Protect Core Systems
Changes to payment processing (Stripe), authentication/authorization, databases (Neon), protected deployments (Cloudflare), and secrets are strictly prohibited unless explicitly authorized by the owner.

### V. Resource Conservation & Control
Respect the 495 free-service cap for documentation updates. Context7 MCP usage requires explicit owner approval before EVERY invocation. Local `.docs/` are read-only during normal tasks.

## Technology Stack & Constraints

The primary application is a Next.js App Router project deployed on Cloudflare Pages/Workers using OpenNext. The backend utilizes Neon PostgreSQL. Integrations include Stripe Checkout, Resend for email, and Cloudflare Turnstile. The project must maintain its identity as a Canada-wide, entertainment-only platform (no real-money gambling). Prefer premium, realistic, cinematic Canadian visuals and existing audio assets over synthetic additions.

## Development Workflow

- **Specification**: Use the existing Spec Kit installation (`.specify/` and `.jules/cmds/speckit.*.md`) for structured feature specification and planning when required by the task scope.
- **Testing**: Use Playwright for browser/user-facing verification. Use `act` and `./jules-verify.sh` for local workflow/CI validation.
- **Troubleshooting**: Apply the Scientific Debugging & Verification Protocol. Fix the verified problem; do not turn a repair task into an audit-only task.

## Governance

This Constitution provides the durable principles for the Spec Kit workflow while remaining strictly complementary and subordinate to `AGENTS.md`.
- Memory files (`memory-bank/*`) must record verified facts and completed milestones, but they do not establish rules.
- Do not create Copilot instructions or secondary governance systems.
- Any changes to these principles or the overall architecture must be authorized by the repository owner.

**Version**: 1.0.0 | **Ratified**: 2026-09-11 | **Last Amended**: 2026-09-11
