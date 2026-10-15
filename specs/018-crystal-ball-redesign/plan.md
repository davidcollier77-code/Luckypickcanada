# Crystal Ball Redesign Plan

1. Analyze and Setup: Extract AVIF, WebP, and PNG transparent assets from the reference image.
2. Update CrystalBall.tsx: Replace the old CSS/SVG structure with the new assets using a Next.js `picture` element.
3. Update CrystalBall.module.css: Remove deprecated CSS and add layout classes for the new asset.
4. Verify Governance and Limits: Verify build size and run tests.
