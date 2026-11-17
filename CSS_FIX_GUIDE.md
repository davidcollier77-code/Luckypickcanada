# Theme CSS Loading Reference

## Current source of truth

The application imports its theme CSS from the repository's `themes/default/` source directory. Next.js compiles those imports into generated stylesheets under `/_next/static/css/`.

Current application imports:

- `app/layout.js` imports `../themes/default/index.css` for the shared theme layer.
- `app/homepage/HomePage.js` imports `../../themes/default/homepage.css`.
- `app/homepage/Hero.js` imports `../../themes/default/hero.css`.
- `app/map/page.js`, `app/crystal-ball/page.js`, and `app/crystal-ball/preview/page.js` import the active `homepage.css`.
- `app/lucky-map-of-canada/lucky-map-of-canada.js` imports the active `map.css`.

Keep these source files and import relationships as the authoritative implementation. Do not copy them into `public/themes/default/` or add a direct stylesheet link to `/themes/default/index.css`. That old public mirror is no longer maintained.

## Production verification

1. Build with the repository's pinned toolchain (Node.js 26.x and pnpm 10.30.3).
2. Inspect the rendered route's HTML and Network panel.
3. Confirm the page loads the generated `/_next/static/css/[hash].css` files successfully.
4. Confirm the expected theme styles are applied to the page.

A production HTML document should reference Next.js-generated CSS bundles. It should not need a direct `/themes/default/index.css` link.

## Troubleshooting

- Confirm the relevant CSS import still exists in the route or shared layout listed above.
- Confirm the imported source file exists under `themes/default/`.
- Check the generated `/_next/static/css/` response for HTTP errors.
- Check computed styles on the affected element to distinguish a missing import from an overriding rule.

Do not restore the retired public CSS mirror as a troubleshooting workaround. Fix the active source import or the actual CSS rule instead.
