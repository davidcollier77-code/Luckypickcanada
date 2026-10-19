# Homepage CSS Optimization Plan

1. Remove the separate `import '../themes/default/index.css';` from `app/layout.js`.
2. Consolidate it into `app/globals.css` by adding `@import "../themes/default/index.css";` at the top of the file.
3. This approach merges the two critical CSS dependencies into one, eliminating a render-blocking request in the critical path without altering any styles.
