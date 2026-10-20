# MANDATORY INITIALIZATION DIRECTIVE

**STOP. READ `AGENTS.md` FIRST.**

Before any task work, read the root `AGENTS.md`; it is the authoritative
repository workflow. Then read `memory-bank/projectBrief.md` and
`memory-bank/activeContext.md` once, followed by exactly one selected
specialist file and the routed `.docs` material for that task group.

Do not load every `.jules/*.md`, every `.jules/cmds/*.md`, or unrelated
library snapshots into every task. Read a command definition when executing
that command and load additional material only when it is routed or relevant.

Complete the four Spec Kit stages in the order specified by `AGENTS.md`.
Keep one active task, one feature directory, one branch, and one PR for the
work. Check for an existing branch/PR before creating another. Execute stages
sequentially in the same active run whenever the interface allows it; do not
repeat a stage or create duplicate dispatches. Use concise, task-specific
artifacts and do not create optional design documents without a real need.

Do not ask for routine mid-task confirmation. When autonomous execution is
authorized, continue until completion unless an actual blocking approval,
material safety/security issue, missing essential input, or explicit blocking
gate prevents safe progress. An unchecked non-blocking checklist is reported,
not treated as an automatic pause.

At the conclusion, update `memory-bank/activeContext.md` when project state or
decisions materially changed. Update `memory-bank/progress.md` for completed
milestones, not for every minor fix. Do not make repetitive Memory Bank edits
that simply duplicate the PR Summary.

---

## 🚨 ABSOLUTE MCP APPROVAL GATE — HARD STOP

MCP usage is governed per-MCP as defined in AGENTS.md.

**Neon:** May be used without additional approval when materially applicable and within authorized scope.

**Stitch:** May be used without additional approval when materially applicable and within authorized scope.

**Context7:** Requires explicit repository-owner approval before every invocation.
*Note on Mandatory Documentation:* The requirement to consult Jules and Gemini documentation does NOT automatically authorize Context7 usage to retrieve them. Use local and approved resources first.
If you determine Context7 is needed for any library, you must **STOP IMMEDIATELY** and ask David for explicit approval first, providing:
- MCP/service being requested
- tool/action that will be invoked
- reason it is materially necessary
- what information it is expected to retrieve
- whether the action is read-only or modifies anything

**Other MCPs:** Require explicit approval unless separately authorized.

**Important:** MCP connection/initialization/availability never counts as actual MCP usage. Only an actual invocation/query/retrieval constitutes MCP usage.

---

## 2024-10-30 - Premium Cinematic Lucky Card Reveal
**Learning:** Using Howler for layered audio allows for synchronized, high-quality environmental soundscapes without relying on synthesized browser `OscillatorNode` logic that can sometimes feel synthetic or arcade-like. Coupling this with Framer Motion's `stagger` and dynamic scaling (rather than linear coordinate shakes) transforms flat interactions into premium cinematic events.
**Action:** Implemented a new, cinematic reveal structure for the Lucky Card experience that utilizes a multi-phase buildup involving deep atmospheric drones, floating motion physics, converging/bursting particles, and a final sweeping glow. The flash/burn-out effects and 3D flip now accurately reflect the "magic/cinematic" project guideline, removing the previously harsh yellow rectangle flash.

## 2026-09-07 - [Governance] Persistent Memory Clarification
**Learning:** Jules memory is a passive contextual layer for historical reference. It does NOT replace reading `AGENTS.md`. It cannot be relied upon to automatically enforce rules.
**Action:** The previous incorrect assumption that Jules could automatically retrieve and apply rules via memory has been corrected. `AGENTS.md` remains the sole authoritative governance document that must be manually read during initialization.
