# CSS Loading Fix for Production (White Homepage Issue)

## Problem Analysis

The homepage renders completely white with unstyled default fonts in production, despite working in development. This is a common Next.js App Router CSS loading issue.

## Root Cause

The CSS files in `/themes/default/` are imported via relative paths in `app/layout.js`:
```javascript
import '../themes/default/index.css';
```

In production builds, Next.js may not properly resolve or bundle CSS files located outside the `app` directory when using relative imports.

## Solutions (In Priority Order)

### Solution 1: Move Theme CSS to Public Folder (Immediate Fix)

**Current structure:**
```
themes/default/
  ├── index.css
  ├── default.css
  ├── homepage.css
  └── [other css files]
```

**Action Required:**
1. Copy `themes/default/` to `public/themes/default/`
2. Update `app/layout.js` to use direct `<link>` tags in the `<head>`:

```javascript
<head>
  <link rel="stylesheet" href="/themes/default/index.css" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <link rel="preconnect" href="https://challenges.cloudflare.com" />
  <link rel="preload" href="/1785347037732.png" as="image" fetchPriority="high" />
</head>
```

### Solution 2: Use Absolute Imports (Requires next.config.mjs update)

Update `next.config.mjs`:
```javascript
const nextConfig = {
  // ... existing config
  webpack: (config) => {
    config.resolve.alias['@themes'] = path.join(__dirname, 'themes');
    return config;
  },
};
```

Update `app/layout.js`:
```javascript
import '@themes/default/index.css';
```

### Solution 3: Move CSS to App Directory (Recommended Long-term)

Restructure to follow Next.js conventions:
```
app/
  ├── styles/
  │   ├── theme-index.css
  │   ├── theme-default.css
  │   └── theme-homepage.css
  └── layout.js
```

Update imports in `app/layout.js`:
```javascript
import './globals.css';
import './styles/theme-index.css';
```

## Verification Steps

1. Clear build cache: `rm -rf .next`
2. Rebuild: `npm run build`
3. Test production build locally: `npm run start`
4. Check browser DevTools Network tab for CSS file requests
5. Verify computed styles in Elements tab show theme colors

## Current CSS Import Order (app/layout.js)
Line 1: `import './globals.css';`
Line 2: `import '../themes/default/index.css';`

## Expected CSS Variables After Loading
```css
--night: #02070c;
--gold: #eabe52;
--lpc-display: 'Cinzel', Georgia, serif;
--lpc-body: 'Manrope', Inter, ui-sans-serif, system-ui, sans-serif;
```

## Quick Production Test

After deployment, open browser console and run:
```javascript
console.log(getComputedStyle(document.body).backgroundColor);
// Should show: rgb(2, 7, 12) or similar dark color, not white

console.log(getComputedStyle(document.body).fontFamily);
// Should include 'Manrope'
```

## Additional Checks

1. **Verify CSS files exist in build output:**
   ```bash
   ls .next/static/css/
   ```

2. **Check CSS file size:**
   - If CSS bundles are suspiciously small (<1KB), CSS isn't being bundled properly

3. **Inspect HTML source in production:**
   - Look for `<link rel="stylesheet" href="/_next/static/css/[hash].css">`
   - Verify the CSS file returns content (not 404)

## OpenNext / AWS Specific Considerations

If deploying with OpenNext to AWS:
- Ensure S3 bucket has proper CORS and content-type headers for CSS files
- Verify CloudFront distribution serves CSS with correct `Content-Type: text/css`
- Check CloudFront cache behavior for `/themes/*` paths

## Recommended Immediate Action

Copy the theme folder to public and update layout.js to use direct link tags. This ensures CSS is served as static assets and bypasses Next.js CSS bundling issues.
