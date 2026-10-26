# Performance Polish

## Objective
Improve website performance by optimizing Canvas drawing APIs inside the rendering loop. Specifically, replacing paths (`arc`) with `fillRect` bounding boxes for localized radial gradients where the transparent edges mask the rectangle.

## Scope
`app/lucky-card-reveal.js` - Optimize particle and glow animations.
