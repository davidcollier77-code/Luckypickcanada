# Plan: Optimize Canvas Gradients in Aurora.tsx

1. Read `.freebuff/bolt.md` to understand the optimization context.
2. Locate the `drawWisp` function in `components/Aurora.tsx`.
3. Replace the `ctx.createRadialGradient` and `ctx.fillRect` with `ctx.bezierCurveTo` and `ctx.createLinearGradient`.
4. Test the changes using `pnpm test` and `pnpm run build`.
