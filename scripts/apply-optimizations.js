const fs = require('fs');

// We have the images generated. We just need to rename them if we keep them simple, or we can just copy them.
fs.copyFileSync('public/homepage-hero-lucky-pick-canada-669w.avif', 'public/homepage-hero-lucky-pick-canada-669w.avif');
fs.copyFileSync('public/homepage-hero-lucky-pick-canada-669w.webp', 'public/homepage-hero-lucky-pick-canada-669w.webp');

fs.copyFileSync('public/FB_IMG_1785107325979-551w.avif', 'public/FB_IMG_1785107325979-551w.avif');
fs.copyFileSync('public/FB_IMG_1785107325979-551w.webp', 'public/FB_IMG_1785107325979-551w.webp');
fs.copyFileSync('public/FB_IMG_1785107325979-551w.jpg', 'public/FB_IMG_1785107325979-551w.jpg');

fs.copyFileSync('public/FB_IMG_1785107325979-800w.avif', 'public/FB_IMG_1785107325979-800w.avif');
fs.copyFileSync('public/FB_IMG_1785107325979-800w.webp', 'public/FB_IMG_1785107325979-800w.webp');
fs.copyFileSync('public/FB_IMG_1785107325979-800w.jpg', 'public/FB_IMG_1785107325979-800w.jpg');

// Also full res FB formats just in case we need a fallback for larger screens, but the 800w one should suffice for the banner layout.
