# Plan

1. Modify `app/layout.js` to use `next/font/google`.
2. Remove verifiably unused CSS classes from `homepage.css` and `default.css`.
3. Update `app/homepage/HomePage.js` to dynamically load `CheckoutModal` and `LuckyRevealPopup` with `{ ssr: false }`.
