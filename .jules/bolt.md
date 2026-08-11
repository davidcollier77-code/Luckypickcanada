# Bolt's Journal - Performance Learnings

This journal records critical performance lessons, patterns, and anti-patterns encountered while optimizing the LuckyPickCanada application.

## 2026-08-10 - SVG Programmatic Generation Performance Overhead
**Learning:** Programmatically generated SVG elements (like ticks, labels, and gridlines) can impose a heavy rendering and garbage collection penalty if reconstructed on every render, especially inside components with frequent updates or requestAnimationFrame animations (like the 8-second Daily Lucky Meter animation).
**Action:** Use `useMemo` with empty or carefully defined dependencies to cache static programmatically generated React/JSX elements. This reduces element allocations from thousands of objects to a single cached array, minimizing GC pressure and keeping animations at a steady 60fps.

## 2026-08-11 - Turbopack Dev Server Compatibility Issue
**Learning:** In this project, running Next.js 14/15 development server (`next dev`) using default Turbopack commands can result in `ERR_CONNECTION_REFUSED` or server unresponsiveness when Playwright or local scripts attempt to connect on port 3000.
**Action:** Always start the local development server with the explicit `--webpack` flag (`npm run dev -- --webpack`) when integration testing or verifying UI. This resolves local network interface/binding issues and ensures smooth connection on localhost.
