# Research — Premium Golden Maple-Leaf Assets

## Findings

- The main Crystal Ball artwork already uses a separate `<picture>` element with AVIF, WebP, and PNG sources. It does not need conversion or layout changes for this task.
- The shared `GoldenLeaf.tsx` was drawing a custom SVG inline for both the text cursor and the separately animated duplicate.
- The existing component API accepts className and style, and the CSS modules target those passed classes. A shared picture-based component can preserve those contracts.
- The page's background uses pre-existing CSS `image-set()` candidates for desktop/mobile; no background work is needed.
- The output asset is transparent and displayed at cursor-scale dimensions. AVIF and WebP support alpha; SVG is retained as the broadly compatible vector fallback.
- Local Sharp output sizes for the selected 112 × 122 raster variants: AVIF 2,316 bytes; WebP 3,870 bytes. GitHub blob hashes were compared to the locally generated assets before committing.

## Decision

Use one shared `picture` resource in the GoldenLeaf component with AVIF first, WebP second, and the SVG artwork as the `img` fallback. Keep the image presentation-hidden and preserve the component's existing animation classes.
