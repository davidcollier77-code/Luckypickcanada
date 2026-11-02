# Specification: Optimize Canvas Gradients in Aurora.tsx

## Problem
The `drawWisp` function in `components/Aurora.tsx` currently uses `ctx.createRadialGradient` and `ctx.fillRect` with scaling to draw organic wisp effects, which causes significant fill-rate overhead.

## Solution
Replace the overlapping full-screen radial gradients with bezier curve paths (`ctx.bezierCurveTo`) using simpler linear gradients (`ctx.createLinearGradient`).

## Requirements
- Update the `drawWisp` function in `components/Aurora.tsx`
- Do not introduce visual regressions
