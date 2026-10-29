# Test the AboutSection component

## Objective
Write a React Testing Library test suite for the `AboutSection` component to increase codebase test coverage and catch potential regressions.

## Context
The `AboutSection` component (`components/AboutSection.tsx`) is a simple stateless functional React component that renders a section heading and three links (`/lucky-meter`, `/stories`, `/map`). It is completely untested.

## Testing Frameworks
*   Vitest
*   React Testing Library

## Test Cases to Cover
*   The component renders the expected heading correctly.
*   The component renders the "interactive Lucky Meter generator" link correctly with the correct `href` attribute.
*   The component renders the "Community Lucky Stories section" link correctly with the correct `href` attribute.
*   The component renders the "Canadian Lucky Map" link correctly with the correct `href` attribute.

## Acceptance Criteria
*   Test suite file is added at `__tests__/components/AboutSection.test.tsx`.
*   All test cases pass.
*   `pnpm test` runs successfully without errors.
