# Spec: Homepage Performance

## Goal
Improve PageSpeed Insights performance by resolving render-blocking requests, removing unused CSS, and reducing unused JavaScript on the homepage, while strictly preserving image quality and visual layout.

## Scope
1. Replace synchronous Google Fonts with `next/font/google`.
2. Strip definitively unused CSS classes from public themes.
3. Enhance dynamic loading of off-screen components.
