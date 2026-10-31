<!--
Sync Impact Report:
Version change: 1.1.0 -> 1.2.0
Modified sections: Implementation Sequence clarifies approval versus autonomous execution; Development Workflow adopts task-relevant context, concise artifacts, one sequential Spec Kit pass, and non-blocking checklist handling; Governance aligns Memory Bank updates with meaningful state changes.
Added sections: None.
Removed sections: None.
Follow-up TODOs: Verify the revised workflow through the task-artifact regression tests and PR CI.
-->
# LuckyPickCanada Constitution

## Core Principles

### I. Single Source of Truth
`AGENTS.md` is the canonical repository-level authority. All AI agents must read it first. Memory systems, specialist instructions (` `.freebuff/*.md`), and Spec Kit artifacts are complementary and must never override or duplicate `AGENTS.md`.

### II. Verify Before Acting
Never assume repository state, tool availability, or documentation content. Agents MUST independently inspect the actual codebase, run necessary verification commands, and confirm the environment before drafting plans or executing changes.

### III. The Implementation Sequence
All work MUST follow the required sequence: INSPECT → IDENTIFY → UNDERSTAND → PLAN → IMPLEMENT → TEST → DOUBLE-CHECK → REPORT → CREATE PR. Plans must be documented before changes. Request separate approval only when the user asks for it, the scope is genuinely unclear, or a protected action lacks authorization. Explicit authorization for autonomous execution removes a redundant approval pause but never overrides safety or scope boundaries.

### IV. Protect Core Systems
Changes to payment processing (Stripe), authentication/authorization, databases (Neon), protected deployments (Cloudflare), and secrets are strictly prohibited unless explicitly authorized by the owner.

### V. Resource Conservation & Control
Respect the 495 free-service cap for documentation updates. Context7 MCP usage requires explicit owner approval before EVERY invocation. Local `.docs/` are read-only during normal tasks.

## Technology Stack & Constraints

The primary application is a Next.js App Router project deployed on Cloudflare Pages/Workers using OpenNext. The backend utilizes Neon PostgreSQL. Integrations include Stripe Checkout, Resend for email, and Cloudflare Turnstile. The project must maintain its identity as a Canada-wide, entertainment-only platform (no real-money gambling). Prefer premium, realistic, cinematic Canadian visuals and existing audio assets over synthetic additions.

## Development Workflow

- **Specification**: Every coding task MUST complete the core Spec Kit sequence—specify, plan, tasks, and implement—in order, using `.specify/` and each invoked ` `.freebuff/cmds/speckit.*.md` definition. Keep artifacts concise and task-scoped; create optional design artifacts only when the task needs them. Execute each stage once; do not duplicate dispatches or pause for routine confirmation. When native slash-command dispatch is unavailable, follow the invoked command definition directly and report the actual execution method.
- **Testing**: Use Playwright for browser/user-facing verification. Use `act` and `./freebuff-verify.sh` for local workflow/CI validation.
- **Troubleshooting**: Apply the Scientific Debugging & Verification Protocol. Fix the verified problem; do not turn a repair task into an audit-only task.

## Governance

This Constitution provides the durable principles for the Spec Kit workflow while remaining strictly complementary and subordinate to `AGENTS.md`.
- Memory files (`memory-bank/*`) must record verified facts and completed milestones, but they do not establish rules.
- Do not create Copilot instructions or secondary governance systems.
- Any changes to these principles or the overall architecture must be authorized by the repository owner.

**Version**: 1.2.0 | **Ratified**: 2026-09-11 | **Last Amended**: 2026-10-20
