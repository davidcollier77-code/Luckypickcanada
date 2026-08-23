# Bolt's Journal - Performance Learnings

This journal records critical performance lessons, patterns, and anti-patterns encountered while optimizing the LuckyPickCanada application.

## 2026-08-10 - SVG Programmatic Generation Performance Overhead
**Learning:** Programmatically generated SVG elements (like ticks, labels, and gridlines) can impose a heavy rendering and garbage collection penalty if reconstructed on every render, especially inside components with frequent updates or requestAnimationFrame animations (like the 8-second Daily Lucky Meter animation).
**Action:** Use `useMemo` with empty or carefully defined dependencies to cache static programmatically generated React/JSX elements. This reduces element allocations from thousands of objects to a single cached array, minimizing GC pressure and keeping animations at a steady 60fps.

## 2026-08-12 - setInterval Component Re-render Bottleneck
**Learning:** Components that rely on `setInterval` for updating time displays (like `timeLeft` in `app/lucky-meter/page.js` and `app/lucky-card-reveal.js`) will trigger full component tree re-renders every single second. This causes significant performance degradation and battery drain when large child trees or complex SVG animations are present.
**Action:** Isolate frequently updating state (like a countdown timer updated via `setInterval`) into its own tiny component (e.g. `<MidnightCountdown />`). This localizes the 1-second interval re-renders to just that text element, preventing the parent page from constantly re-rendering.

## 2026-08-16 - Canvas Particle System Optimization
**Learning:** Using `ctx.arc()` to draw thousands of tiny 1-2px particles (like a starfield) is a massive performance bottleneck. It requires trig calculations and multiple API calls (`beginPath`, `arc`, `fill`) per particle per frame, which severely limits framerate on mobile devices.
**Action:** Always use `ctx.fillRect()` instead of `ctx.arc()` for sub-pixel or tiny particles. A 1px square visually looks identical to a 1px circle due to screen resolution, but renders magnitudes faster.

## 2026-08-16 - Canvas Color Interpolation Optimization
**Learning:** Using dynamic string interpolation (like \`rgba(..., ${alpha})\`) to set `ctx.fillStyle` inside a `requestAnimationFrame` loop creates massive garbage collection pressure, especially when iterating over thousands of particles per frame. This triggers frequent GC pauses that manifest as animation stutter.
**Action:** Set a static hex or RGB color (e.g. `ctx.fillStyle = '#fff8df'`) outside the rendering loop or particle iteration. Inside the loop, adjust dynamic transparency solely through floating-point assignments to `ctx.globalAlpha`. Remember to reset `ctx.globalAlpha = 1.0` after the loop to prevent unintentional transparency on subsequent drawing operations.

## 2026-08-22 - Extracted MidnightCountdown Component
**Learning:** Found an instance of `setInterval` triggering full re-renders in `DailyLuckyMeter.tsx`.
**Action:** Created `MidnightCountdown` component to isolate the countdown timer interval, thereby preventing unnecessary re-renders of the large parent SVG.
