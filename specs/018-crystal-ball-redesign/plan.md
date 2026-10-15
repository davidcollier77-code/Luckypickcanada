# Crystal Ball Redesign Plan

1. Inspect the incorrect merged raster asset and compare against the supplied target.
2. Prepare a transparent foreground image from the supplied visual direction without altering the existing page background.
3. Serve the asset AVIF first, WebP next, and PNG fallback through a native `picture` element.
4. Align the responsive brand text to the inset nameplate in the foreground artwork.
5. Keep the Milky Way background crisp and remove/avoid any Crystal Ball aurora layers; keep the existing interactions unchanged.
6. Update Playwright checks for the real raster dimensions, AVIF/WebP/PNG source order, glow geometry, and existing form/navigation.
7. Verify build/tests and compare real mobile/desktop rendering before considering the fix complete.
