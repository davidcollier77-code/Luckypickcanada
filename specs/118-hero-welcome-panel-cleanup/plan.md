# Implementation Plan: Homepage Welcome Panel Cleanup

**Branch**: `fix/hero-welcome-panel-cleanup` | **Date**: 2026-11-08 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/118-hero-welcome-panel-cleanup/spec.md`

## Summary

Remove the oversized welcome-panel CTA and the adjacent gold entertainment-only note. Keep the dark gold-edged panel, all its existing explanatory copy, and the separate painted Explore arrows. Reduce the panel's vertical padding and the top/bottom divider margins so the Explore artwork sits closer to the panel.

## Technical Context

**Language/Version**: JavaScript (ES modules), CSS; Node.js 22

**Primary Dependencies**: Next.js 16.4.3, React 19.3.1; no new dependencies

**Storage**: N/A

**Testing**: Vitest source/layout guard; existing Playwright homepage visual and Explore interaction suites

**Target Platform**: Responsive web browser, with mobile widths (390 px and 412 px) as the main visual target

**Project Type**: Next.js App Router web application

**Performance Goals**: No added client-side code, network requests, assets or rendering work

**Constraints**: Preserve the current homepage artwork, AVIF/WebP selection and preload, starfield, shimmer, navigation and Explore scroll behaviour. No changes to the separate ExploreLuckButton component or the destination section.

## Constitution Check

- **Single source of truth**: PASS — `AGENTS.md` remains authoritative; this feature records only the scoped change.
- **Verify before acting**: PASS — current main branch, merged hero PR, source components, test guards and current open PR list were inspected.
- **Implementation sequence**: PASS — specify → plan → tasks → implement, in order.
- **Protect core systems**: PASS — no database, payment, authentication, hosting or secret changes.
- **Resource control**: PASS — no dependencies or documentation library changes.

## Phase 0 — Research

No additional research was needed. This is a local presentation-only adjustment to the existing hero. The existing `ExploreLuckButton` implementation was inspected to confirm the scroll behavior is separate from the CTA being removed.

## Phase 1 — Design

1. Remove only the `.hero-welcome-cta` anchor and `.hero-welcome-note` paragraph from `app/homepage/Hero.js`.
2. Remove their now-unused CSS rules from `themes/default/hero.css`.
3. Tighten the welcome card's padding, paragraph bottom margin and the margins around its adjacent maple divider slices.
4. Extend `__tests__/homepage-hero-layout.test.js` to assert the retained copy, absence of removed elements, compact panel styling and continued Explore control placement.
5. Leave `app/homepage/ExploreLuckButton.js`, the artwork, navigation and sections below the hero untouched.

## Project Structure

```text
app/homepage/
  Hero.js                         # welcome panel markup and artwork arrangement
  ExploreLuckButton.js            # existing scroll/confetti/audio control (unchanged)
themes/default/
  hero.css                        # welcome panel and divider spacing
__tests__/
  homepage-hero-layout.test.js    # source/layout regression guard
tests/visual/
  homepage.spec.ts               # existing browser visual and interaction coverage
specs/118-hero-welcome-panel-cleanup/
  spec.md
  plan.md
  tasks.md
  checklists/requirements.md
```

**Structure Decision**: Keep the change within the existing homepage hero component, stylesheet and regression guard. No new application components, APIs, data models or assets are required.

## Complexity Tracking

No constitution violations or additional architectural complexity.
