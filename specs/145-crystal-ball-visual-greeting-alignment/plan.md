# Implementation Plan: Crystal Ball Visual Greeting Alignment

**Branch**: `fix/crystal-ball-visual-greeting-tests-20261112` | **Date**: 2026-11-12 | **Spec**: [spec.md](spec.md)

## Summary

The application exports ten greeting personalities and returns three quiet alternatives on selected dates. Three visual specs still hard-code the original four personalities, so valid new greetings fail the assertions. Add one shared Playwright assertion helper that imports the application greeting exports and evaluates the quiet-day message using the browser-local date. Update only the affected specs.

## Technical Context

- **Language/Version**: TypeScript test files and existing JavaScript greeting module.
- **Primary Dependencies**: Playwright Test; existing Crystal Ball greeting exports.
- **Storage**: Existing browser localStorage greeting record; no schema change.
- **Testing**: Existing Playwright Visual QA projects.
- **Target Platform**: Chromium desktop, mobile-390 and mobile-412.
- **Project Type**: Browser regression test maintenance.
- **Performance Goals**: No new runtime behavior or dependencies.
- **Constraints**: Keep production app files and visual baselines unchanged.
- **Scale/Scope**: One shared test helper and three visual specs.

## Research

Current source in `app/crystal-ball-client/greetings.js` exports ten entries in `GREETINGS`, plus `getQuietGreeting(dateKey)` for the solemn-day messages. The failing visual tests duplicate only the original four greeting strings.

The Visual QA workflow installs pnpm before configuring the Node cache, so its browser tests reached execution. The observed failures are assertion mismatches, not browser startup or baseline failures.

## Constitution Check

- No production code, protected files, deployment workflows, dependencies, or data boundaries change.
- Keep browser assertions aligned with real application behavior.
- Use browser-local date when testing visitor-local commemorative messages.

## Project Structure

- `tests/visual/crystal-ball-greeting-assertions.ts`: shared recognized-greeting assertion.
- `tests/visual/crystal-ball-greeting.spec.ts`: stable daily selection, non-repetition and cursor checks.
- `tests/visual/crystal-ball-interactions.spec.ts`: greeting-led fortune and follow-up coverage.
- `tests/visual/crystal-ball.spec.ts`: page-level greeting check.
- `specs/145-crystal-ball-visual-greeting-alignment/`: feature artifacts.

## Implementation Decision

Import `GREETINGS` and `getQuietGreeting` from the existing greeting module. Resolve the date key in the browser, then poll the accessible greeting text until it contains a current personality or exactly matches the current quiet greeting. Keep the no-repeat check tied to the stored greeting index, so it continues to verify selection even when a quiet-day message replaces the visible personality.
