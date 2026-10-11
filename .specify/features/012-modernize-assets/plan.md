# Plan: Modernize Assets

1. Identify large image assets in `public/`.
2. Convert them to WebP using sharp with quality set to 90.
3. Verify file sizes are improved.
4. Update code references pointing to PNGs to point to WebPs.
5. Rebuild project and check build size.
