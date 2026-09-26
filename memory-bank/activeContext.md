# Active Context

## 2026-09-26 — Production CSS Regression Repair

- Branch: `fix/restore-tailwind-postcss-after-audio`
- Verified the active production recovery build is based on `e1e7d2f300ea5d7787fcbd03335fc5691989e26e`, while `main` remains at `f740f660b146fcc1f44ee4fe91ca8ca26b8bd370`.
- Deep-dive comparison confirmed PR #1261 explicitly deleted `postcss.config.js` and `tailwind.config.js`.
- Verified `app/globals.css` still contains Tailwind v3 directives (`@tailwind base/components/utilities`) and `package.json` still declares Tailwind CSS, PostCSS override, and Autoprefixer.
- Restored the known-good `postcss.config.js` and `tailwind.config.js` from `e1e7d2f` without changing `app/lucky-card-reveal.js` or the recent Standard-tier Web Audio implementation.
- Verification pending: local clean pnpm test/build and final diff/PR checks.
