# Feature Specification: Skill Library and MCP Connection Audit

**Feature Branch**: `freebuff/d39d4997e3eae68c62117cc1`
**Created**: 2026-11-04
**Status**: Draft

**Input**: Audit Freebuff's installed skill library and connected MCPs. List every installed skill and its
purpose; list every connected MCP with its available tools; verify each MCP is reachable and functioning
and identify disconnected, unavailable or misconfigured connections; determine whether Freebuff
auto-discovers and applies relevant skills and MCP tools or needs explicit instruction; explain how skills
are discovered, loaded, activated and applied; identify any skill or MCP Freebuff cannot discover or use;
provide examples of selection and use. Audit and report only.

## Scope and Boundaries

- **Audit-only.** No change to `AGENTS.md`, global configuration, MCP connections, permissions, installed
  skills, or application source. The only files written are the Spec Kit artifacts this repository's
  governance requires, the canonical PR summary, and the Memory Bank entry.
- **Verified versus unverified must stay separate.** A connection is reported as working only after a real
  tool call succeeded; a skill is reported as installed only after its instructions were actually read.
- **No secret exposure.** Failure messages are quoted only as provider error codes and text; no
  credential, token or key value is printed, stored or committed.

## User Scenarios & Testing

### User Story 1 — A trustworthy inventory of what is installed (Priority: P1)

The owner can read one list of every installed skill and every connected MCP, each with the purpose it
serves, so the capability surface is known rather than assumed.

**Why this priority**: Every later conclusion depends on the inventory being complete and read from the
real discovery surface rather than remembered.

**Independent Test**: The inventory enumerates all 14 skills declared by the skill tool, each confirmed by
a successful instruction read, and all 4 connected MCP accounts, each confirmed by a discovery call.

**Acceptance Scenarios**:

1. **Given** the skill discovery surface, **When** the audit runs, **Then** every declared skill is
   listed with its name, purpose and activation rule.
2. **Given** the connected-app surface, **When** the audit runs, **Then** every account is listed with its
   discoverable tools.
3. **Given** a skill or app that appears in a listing, **When** the audit reports it, **Then** listing
   alone is not treated as proof of use.

---

### User Story 2 — Broken connections are proven broken, not assumed (Priority: P1)

Each MCP is exercised with a read-only call, and a failure is reported with the provider's own error so the
owner can act on it.

**Why this priority**: The request explicitly forbids assuming a connection works because it appears in a
list; the value of the audit is separating the four accounts into working and failing.

**Independent Test**: Every account receives at least one read-only call; a failing account is called twice
to distinguish a persistent credential fault from a transient one; results are recorded per account.

**Acceptance Scenarios**:

1. **Given** a connected account, **When** a read-only tool call returns data, **Then** it is recorded as
   VERIFIED WORKING with the evidence summarised.
2. **Given** an account whose call returns a provider error, **When** the call is repeated and fails
   again, **Then** it is recorded as FAILING with the exact error code and message.
3. **Given** a write-capable tool, **When** the audit runs, **Then** no write, delete or deploy is
   performed.

---

### User Story 3 — The activation gap is stated plainly (Priority: P2)

The owner learns whether relevant skills and MCP tools are used automatically, and what — if anything —
in repository instructions or global configuration would make that reliable.

**Why this priority**: The inventory is only actionable once the owner knows whether capability is being
used by default or only when explicitly requested.

**Independent Test**: The audit compares the repository's instruction files against the skill surface and
shows whether any instruction causes skill or MCP invocation; the answer is backed by counts and by what
actually happened in the session.

**Acceptance Scenarios**:

1. **Given** `AGENTS.md`, **When** searched for skill guidance, **Then** the number of matches is reported
   as a measured fact.
2. **Given** the session transcript, **When** skill and MCP use is reviewed, **Then** each invocation is
   attributed to the explicit task instruction that caused it.

### Edge Cases

- A skill whose file is only a relocation stub, or that carries `disable-model-invocation`, cannot be
  model-invoked however relevant it is.
- A skill may declare sub-skills or helper scripts that are not installed; that is a broken dependency,
  not a working skill.
- A skill may depend on an MCP that is not connected.
- A repository instruction may gate a tool that is not connected at all, in which case the rule currently
  constrains nothing.
- Account-level connections are invisible to repository configuration; the repo cannot verify or repair
  them.

## Requirements

### Functional Requirements

- **FR-001**: The audit MUST list every installed skill with a brief purpose statement.
- **FR-002**: The audit MUST list every connected MCP account with its available tools and capabilities.
- **FR-003**: The audit MUST verify each MCP with at least one real read-only call and MUST label each
  account VERIFIED WORKING or FAILING.
- **FR-004**: The audit MUST identify skills or MCPs that Freebuff cannot discover, load or use, with the
  evidence for each.
- **FR-005**: The audit MUST explain how skills are discovered, loaded, activated and applied.
- **FR-006**: The audit MUST determine whether automatic selection occurs or explicit instruction is
  required.
- **FR-007**: The audit MUST identify whether additional `AGENTS.md` or global configuration would help,
  and MUST present recommendations separately for approval rather than applying them.
- **FR-008**: The audit MUST classify every finding as VERIFIED or UNVERIFIED and MUST NOT present an
  unverified claim as a result.
- **FR-009**: The audit MUST NOT expose any credential value.

### Key Entities

- **Skill**: a named instruction set in the account's skill library, discovered by name and description
  and loaded on demand.
- **MCP account**: an app connected to the Freebuff account, exposing named tools through a discovery
  tool and an execution tool.
- **Verification result**: the outcome of one real tool call, recorded per account.

## Success Criteria

### Measurable Outcomes

- **SC-001**: 100% of declared skills are listed and 100% have their instructions successfully read.
- **SC-002**: 100% of connected MCP accounts receive a real call and are labelled working or failing.
- **SC-003**: Every skill or MCP limitation names the exact missing dependency, disabled flag or provider
  error that causes it.
- **SC-004**: The repository verification gate passes with no application source file changed, and the
  production build stays below the 495 MB maximum.

## Assumptions

- Skills are an account-level library, and MCP connections are account-level, so the audit reads them
  through the agent's own tool surface. The Freebuff client's internal router and file layout are not
  inspectable from the workspace, and no claim is made about them.
- Read-only MCP verification is within the owner's request to "verify the MCPs are accessible"; the
  repository's approval rule for other MCPs is satisfied by that explicit instruction for reads only.
- Context7 is referenced by repository governance but is not a connected app here; that gap is reported,
  not worked around.
