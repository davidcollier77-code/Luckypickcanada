# Implementation Plan: About Section Lucky Stories Link Repair

**Branch**: `090-about-stories-link` | **Date**: 2026-11-04 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/090-about-stories-link/spec.md`

## Summary

Point the About section's "Community Lucky Stories section" link at the homepage stories section
(`/#community-stories`) instead of the redirect-only `/stories` path, update the unit test to assert the new
destination and the absence of the old path, and leave the `/stories` → `/map` redirect, the map link, the copy
and the styling untouched.

## Technical Context

**Language/Version**: JavaScript (Next.js App Router) with TypeScript for this component

**Primary Dependencies**: Next.js `Link`, Vitest + @testing-library/react (existing dev dependencies)

**Storage**: N/A

**Testing**: `pnpm exec vitest run __tests__/components/AboutSection.test.tsx`; repository gate `./freebuff-verify.sh`

**Target Platform**: Web (desktop and mobile browsers)

**Project Type**: Next.js web application

**Performance Goals**: No change; the edit alters one `href` value only

**Constraints**: 495 MB build ceiling; pnpm only; preserve `prefers-reduced-motion`, accessibility and responsive behaviour

**Scale/Scope**: One component, one test file, one feature artifact set

## Constitution Check

*GATE: Must pass before implementation.*

- Smallest correct change: one `href` attribute plus test coverage — PASS.
- Preserve protected behaviour: copy, heading, classes, map link, Lucky Meter link and the `/stories` redirect are untouched — PASS.
- No security, auth, payments, API or database surface touched — PASS.
- Read-only `.docs/`: no documentation files were modified — PASS.
- Verification: focused unit test, typecheck, `./freebuff-verify.sh`, build-size measurement and a served redirect check — PASS.

## Project Structure

### Documentation (this feature)

```text
specs/090-about-stories-link/
├── spec.md
├── plan.md
├── tasks.md
└── checklists/requirements.md
```

### Source Code (repository root)

```text
components/AboutSection.tsx              # stories link destination
__tests__/components/AboutSection.test.tsx  # assertions for the destination and the removed path
next.config.mjs                          # unchanged: /stories -> /map redirect preserved
app/homepage/HomePage.js                 # unchanged: provides id="community-stories" anchor target
```

**Structure Decision**: Single Next.js application; the change is confined to the existing About component and
its existing unit test, with no new files in `app/`.

## Complexity Tracking

No constitution violations; no complexity justification required.
