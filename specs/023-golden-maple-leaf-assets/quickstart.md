# Quickstart — Premium Golden Maple-Leaf Assets

1. Run `pnpm exec playwright test tests/visual/crystal-ball-interactions.spec.ts`.
2. Open `/crystal-ball`, ask a question, and confirm the gold energy flash still precedes the falling leaf and typed fortune.
3. Confirm the flying leaf and inline cursor use `golden-maple-leaf.avif`, `golden-maple-leaf.webp`, and the SVG fallback in that order.
4. Repeat with reduced motion enabled; confirm the existing reduced-motion flow remains unchanged.
5. Run `./jules-verify.sh`, then inspect production/OpenNext build-size evidence. Do not merge if required checks fail or build size reaches 495 MB.
