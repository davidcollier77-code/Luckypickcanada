# Implementation Plan: Reliable Lucky Stories Form QA

**Branch**: `freebuff/f73641c533daecd5ec53698a` | **Date**: 2026-11-14 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/157-lucky-stories-form-qa/spec.md`

## Summary

Use an explicit `htmlFor`/ `id` association for the existing province label and native select. Update the Playwright coverage to locate the named combobox through its accessible role and verify native required-field validity directly. Do not click the Turnstile-gated submit button in a CI environment where no site key is configured.

## Technical Context

**Language/Version**: JavaScript JSX and TypeScript; repository runtime Node.js 26.x

**Primary Dependencies**: Next.js App Router, React, Playwright Test

**Storage**: None; no database or browser-storage changes

**Testing**: Playwright Test; existing story API tests remain unchanged

**Target Platform**: Desktop and mobile browser projects in GitHub Actions Visual QA

**Project Type**: Next.js web application

**Performance Goals**: No runtime or bundle-performance change

**Constraints**: Preserve the dropdown, all 13 canonical values, required constraint, server validation, Turnstile gate, and current visual design; build-size limit remains 495 MiB

**Scale/Scope**: One map form field and one existing visual test

## Constitution Check

- Pass — the form remains a native required dropdown and server-side validation is untouched.
- Pass — Turnstile continues to guard actual form submission.
- Pass — no database, authentication, secret, deployment or payment configuration is changed.
- Pass — the visual form styles and all unrelated page behavior remain unchanged.

## Project Structure

### Documentation (this feature)

```text
specs/157-lucky-stories-form-qa/
├── spec.md
├── plan.md
├── tasks.md
└── checklists/
    └── requirements.md
```

### Source Code

```text
app/lucky-map-of-canada/lucky-map-of-canada.js
tests/visual/lucky-stories-pagination.spec.ts
```

**Structure Decision**: Make only the necessary edits in the existing Lucky Map component and its Playwright visual test. Keep all changes within the current repository conventions.

## Complexity Tracking

No constitution violations or added architectural complexity.
