# Implementation Plan: SwiftShader Configuration and Graphics-Rendering Architecture

**Branch**: `165-swiftshader-graphics-architecture` | **Date**: 2026-11-15 | **Spec**: [spec.md](./spec.md)
**Input**: Owner instruction to finish the SwiftShader configuration, verify both rendering paths,
document the graphics architecture, and complete the work through the existing pull request.

## Summary

Keep the existing Standard and SwiftShader configurations, keep the three proven SwiftShader
arguments, correct the documentation and stale command references, strengthen the guard test against
unjustified unsafe flags, and add one architecture document plus this feature record. No production
renderer, capability detection, fallback, visual or image behaviour changes.

## Technical Context

**Language/Version**: JavaScript/TypeScript, Node.js 26.x, Next.js 16.4.3
**Primary Dependencies**: Playwright Test 1.64.x, Vitest 5, existing repository tooling only
**Storage**: N/A
**Testing**: Playwright Test (Standard and SwiftShader), Vitest, `tsc --noEmit`,
`freebuff-verify.sh`, production build size check
**Target Platform**: Chromium 156.0.8078.4 in this environment; production remains browser-selected
**Project Type**: Next.js web application with Playwright QA tooling
**Performance Goals**: No regression; production build below 495 MiB
**Constraints**: No new dependencies, browsers or paid services; no production graphics changes;
no new visual effects; no image conversion changes
**Scale/Scope**: Two Playwright configurations, one guard test, two skill documents, one architecture
document, one feature record, memory-bank context

## Constitution Check

*GATE: Must pass before implementation.*

- **Production preservation**: The only runtime artefact touched is `package.json` (scripts, not
  dependencies). No renderer, capability, quality, fallback or visual code changes.
- **Evidence before claims**: Both configurations are executed, and WebGPU is reported from the
  browser's feature status rather than from flags.
- **Scope discipline**: Documentation, a test guard and two scripts. No speculative features, no 3D
  implementation, no WebGPU requirement.
- **Verification**: Focused and full unit tests, type check, both Playwright configurations, fallback
  behaviour, repository gate, build size.
- **No weakened checks**: The guard test is strengthened, not relaxed; no baselines are updated.

Result: PASS.

## Project Structure

### Documentation (this feature)

```
specs/165-swiftshader-graphics-architecture/
├── spec.md
├── plan.md
├── research.md
├── tasks.md
└── evidence.md          # filled after verification
```

### Source and documentation

```
playwright.swiftshader.config.ts                 # comment/stale-reference correction, same flags
__tests__/playwright-config-modes.test.js        # guard: exact flags + rejected unsafe flags + script
package.json                                     # test:visual / test:visual:swiftshader scripts
docs/graphics-rendering-architecture.md          # intended architecture and contracts
.agents/skills/playwright-cli/SKILL.md           # corrected SwiftShader/WebGPU capability statement
.agents/skills/playwright-cli/references/lucky-pick-canada.md  # measured results replace assumptions
.specify/feature.json                            # active feature pointer
memory-bank/activeContext.md, progress.md, techContext.md
```

## Implementation Phases

### Phase 1: Investigation (complete)

Run the flag matrix and the Standard controls; record the renderer, WebGL/Canvas 2D results and
WebGPU feature status. Output: `research.md`.

### Phase 2: Configuration and guard (complete)

Keep the proven arguments, correct the stale `test:visual:swiftshader` reference by adding the
documented scripts, and extend the guard test to reject unsafe/experimental flags that produced no
capability.

### Phase 3: Architecture documentation (complete)

Write `docs/graphics-rendering-architecture.md`: layers, capability selection, renderer inventory,
fallback ladder, image-delivery relationship, testing modes, future 3D requirements, non-goals.

### Phase 4: Documentation correction (complete)

Replace the guide's assumed flag list with measured results and rejected flags; correct the capability
table and compatibility rows.

### Phase 5: Verification (complete)

Run guard tests, focused and full Vitest, `tsc --noEmit`, Standard and SwiftShader Playwright runs,
desktop and mobile projects, a WebGL-disabled fallback check, `./freebuff-verify.sh`, and the build size
measurement. Record exact results in `evidence.md`.

### Phase 6: Submission

Review the complete diff, update the PR body with scope and evidence, push the branch, keep the pull
request open and unmerged.

## Complexity Tracking

No constitution violations. No new abstraction, dependency or runtime path is introduced.
