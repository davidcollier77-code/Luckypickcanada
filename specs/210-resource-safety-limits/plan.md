# Implementation Plan: Resource-readiness safety limits

**Branch**: `210-resource-safety-limits` | **Date**: 2026-11-22 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/210-resource-safety-limits/spec.md`

## Summary

Add four safety properties to the existing site-wide readiness hub without adding the two-container handover: bounded capacity accounting from declared or estimated weights, hard queue and per-experience speculative caps with priority shedding, counted leases that protect resources an active experience owns, and real payload disposal on every path that drops a record. All work stays inside `app/lib/resource-readiness.js` and its existing test suite.

## Technical Context

**Language/Version**: JavaScript (ES modules) on Next.js 16.4.5, React 19.3.1, Node.js 26.x expectation; no TypeScript source change

**Primary Dependencies**: None added. Reuses `getAdaptivePlan()` for tier and `registerReleasableResource()` for pressure release; the existing `texture` adapter's `dispose()` contract is the first real payload owner.

**Storage**: In-memory module maps only. The browser HTTP cache remains outside hub ownership; no service worker, database or persistence is added.

**Testing**: Vitest (`__tests__/resource-readiness.test.js`) plus `tsc --noEmit` and `./freebuff-verify.sh`

**Target Platform**: Browser (desktop and mobile) and server-safe module import

**Performance Goals**: Admission, eviction and statistics stay O(records) over a hard-bounded set (at most 48 records), so no new steady-state work is introduced on the page.

**Constraints**: Production build strictly below 495 MiB; no visual, audio, timing, layout or fallback change; no second preloader or adaptive policy; no payload exposure.

**Scale/Scope**: One module and one existing test file; six manifest experiences and their existing resources remain valid under the default budgets.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Smallest correct change**: only `app/lib/resource-readiness.js` and `__tests__/resource-readiness.test.js` change, plus this Spec Kit artifact set and the Memory Bank active-context header.
- **Protected systems**: no payment, database, authentication, hosting, deployment, secrets or environment configuration is touched. `AGENTS.md` and `PR_SUBMISSION.md` are unchanged.
- **Security and data integrity**: no credentials, no environment inspection, no new network endpoint, no payload logging. Diagnostics contain counts and byte weights only.
- **Preservation**: the public readiness snapshot shape, priority names, retry/backoff, page-settle gate, image identity reuse and routed prefetch behavior are unchanged. No renderer, audio cue, animation or layout is edited.
- **Build**: one small module grows by bounded helpers; the size gate is unaffected in kind but will be measured.
- **Workflow**: specify → plan → tasks → implement, executed in order in this run.

## Project Structure

### Documentation (this feature)

```text
specs/210-resource-safety-limits/
├── spec.md
├── plan.md
├── tasks.md
└── checklists/requirements.md
```

### Source Code (repository root)

```text
app/lib/
└── resource-readiness.js        # bounded capacity, admission, leases, disposal, diagnostics

__tests__/
└── resource-readiness.test.js   # capacity, queue, lease and disposal coverage
```

**Structure Decision**: Single-module change in the existing hub. No new runtime module, route, component or dependency is warranted because the handover state machine is explicitly deferred.

## Phase 0: Research

No material unknown requires external research. The decisions below follow the hub's existing contracts:

- **Weight source**: manifest `bytes` is already declared but unused; it becomes the weight, with per-kind fallbacks for resources that do not declare a size.
- **Budget tiers**: reuse the existing `high` / `balanced` / `constrained` plan tiers; no new device classification.
- **Ownership**: counted lease keys rather than a second container. This is the memory-efficient design the owner asked about: one store, no duplicated payloads, and a swap of ownership counts rather than copies.
- **Disposal**: an adapter already returns `dispose()` for textures and object URLs. The hub calls it only for kinds it owns; `audio`, `code` and `module` remain delegated.

## Phase 1: Design

### Capacity model

| Tier | Max retained records | Max retained weight | Max queued jobs | Max speculative pending per experience |
|------|----------------------|---------------------|-----------------|----------------------------------------|
| high | 48 | 24 MiB | 24 | 12 |
| balanced | 32 | 16 MiB | 16 | 8 |
| constrained | 16 | 8 MiB | 8 | 6 |

Estimated weights when `bytes` is absent: image 96 KiB, texture 512 KiB, model 512 KiB, module 256 KiB, audio 96 KiB, code 48 KiB, unknown 64 KiB. The totals are deliberately conservative because decoded payloads are larger than their compressed file size.

### Admission order

1. Validate registration and deduplicate by kind + target + version (existing behavior).
2. Reuse a ready or cooling-down failed record (existing behavior).
3. Reuse an in-flight promise (existing behavior).
4. Apply the per-experience speculative pending cap.
5. Apply the queue cap: background is deferred; intent may shed one background job; critical may shed background then intent and, if nothing is shed, may exceed the soft queue cap by its own committed resources.
6. Apply the retained entry and weight budget: critical may evict settled unleased records, least valuable then least recently used; intent may evict only background records; background never evicts.
7. Admit or record an honest `skipped` decision in a bounded rejection ledger so snapshots report the reason.

### Ownership model

- `leases`: lease id → `{ id, label, keys }`.
- `pinnedKeys`: resource key → count.
- A record is protected while `pinnedKeys.get(key) > 0`.
- Explicit release, pressure release and version replacement retire a protected record instead of deleting it.
- Lease release sweeps retired, settled, now-unleased records and disposes them.
- `beginActiveExperience(label)` acquires a lease automatically when `label` is a registered experience id.

### Disposal model

- `dispose()` on the adapter result, when present.
- Otherwise clear `result.image.src` for a hub-created image element.
- Never for `audio`, `code` or `module`.
- Best effort with a swallowed failure; disposal never breaks a renderer or release path.
- Called from explicit release, pressure release, capacity eviction, version replacement, retirement sweep and reset.

### Deferred

The two-container alternating handover, readiness handover gates, reserves, overflow classes, replenishment and demand-based scaling are not implemented here. They depend on a current experience actually consuming a prepared payload, which no experience does yet.

## Post-design Constitution Check

- The change is additive and internal; no protected or visitor-facing behavior changes.
- All new state is bounded, so the memory goal is met by construction rather than by tuning.
- No security, privacy, data-boundary or hosting surface changes.

## Complexity Tracking

No constitution violations.
