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

## 2026-08-23 - SVG Array Reallocation in setInterval
**Learning:** In React components that trigger rapid state updates (e.g., a `setInterval` firing every 40ms to animate a score), inline generation of static arrays (like `Array.from({ length: 12 }).map(...)`) causes the engine to allocate new array objects and JSX elements 25 times a second. This leads to heavy garbage collection pressure and can stutter mobile GPUs.
**Action:** Always wrap static, programmatically generated arrays of JSX/SVG elements in a `useMemo(() => ..., [])` hook. This caches the array on mount, so subsequent high-frequency renders only re-reference the existing elements, eliminating the allocation overhead.
## 2024-08-24 - setInterval Extraction with Phase Prop guards
**Learning:** When extracting `setInterval` state logic into isolated child components to optimize React re-renders, it's not enough to simply move the effect. You must ensure phase-guards (e.g., `if (phase !== 'locked') return;`) are passed down as props to prevent intervals from running indefinitely in the background when the parent is in other states. Furthermore, trigger an immediate initial state sync before the interval is set to prevent "stale state" lag (e.g., a clock showing an outdated time for 1 second).
**Action:** When extracting timer-based components, pass necessary phase props, enforce guard logic in their `useEffect`, and invoke a manual immediate state update before the `setInterval` begins.
## 2026-08-25 - High-frequency Canvas Rendering Bottlenecks
**Learning:** For high-frequency HTML5 Canvas rendering (e.g., drawing thousands of tiny particles inside `requestAnimationFrame`), using `ctx.arc()` involves expensive trigonometry calculations that can significantly degrade frame rates, especially on mobile devices. Furthermore, using dynamic string interpolation for transparency (e.g., `rgba(..., ${alpha})`) in `ctx.fillStyle` inside the render loop causes excessive string allocations and heavy garbage collection pressure, leading to animation stutter.
**Action:** Replace `ctx.arc()` with `ctx.fillRect()` for small, sub-pixel particles since a small square visually mimics a circle without the trigonometric overhead. Additionally, eliminate string interpolation by setting a static color (e.g., `#c8dcff`) to `ctx.fillStyle` and manipulating transparency purely via `ctx.globalAlpha`, remembering to reset `ctx.globalAlpha = 1.0` afterward to avoid unintended side effects on subsequent draw calls.

## 2026-08-26 - Playwright Headless AudioContext Errors
**Learning:** When using Playwright locally to capture headless screenshots of frontend components utilizing `window.AudioContext` within `next.js` client logic, you will frequently encounter errors like `TypeError: Class constructors cannot be invoked without 'new'`. This is a known limitation of the local mocked playwright execution environment, and NOT a symptom of application logic bugs.
**Action:** Ignore `window.AudioContext` mock errors during headless UI verification scripts unless they are actively preventing rendering tests from completing. Do not waste cycles attempting to refactor functional `AudioContext` app logic strictly to appease the playwright utility.

## 2026-08-27 - Starfield Canvas Optimization in DailyResonance
**Learning:** Rendering complex particle systems (like a background starfield) using `ctx.arc()` involves expensive trigonometry calculations that can significantly degrade frame rates, especially on mobile devices. Furthermore, using dynamic string interpolation for transparency (e.g., `rgba(..., ${alpha})`) in `ctx.fillStyle` inside the render loop causes excessive string allocations and heavy garbage collection pressure, leading to animation stutter.
**Action:** Replaced `ctx.arc()` with `ctx.fillRect()` for small, sub-pixel particles since a small square visually mimics a circle without the trigonometric overhead. Additionally, eliminated string interpolation by setting a static color (e.g., `#ffffff`) to `ctx.fillStyle` before the render loop and manipulated transparency purely via `ctx.globalAlpha`, remembering to reset `ctx.globalAlpha = 1.0` afterward to avoid unintended side effects on subsequent draw calls.
