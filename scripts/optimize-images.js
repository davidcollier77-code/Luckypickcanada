const sharp = require('sharp');
const fs = require('fs');

async function optimizeHero() {
  const src = 'public/homepage-hero-lucky-pick-canada.avif';
  const widths = [669];

  for (const w of widths) {
    const avifOut = `public/homepage-hero-lucky-pick-canada-${w}w.avif`;
    const webpOut = `public/homepage-hero-lucky-pick-canada-${w}w.webp`;

    // We want high quality to be visually indistinguishable. Let's do quality: 65, which is typical for AVIF
    await sharp(src).resize({ width: w }).avif({ effort: 6, quality: 65 }).toFile(avifOut);
    await sharp(src).resize({ width: w }).webp({ effort: 6, quality: 75 }).toFile(webpOut);
    console.log(`Generated Hero ${w}w - AVIF: ${fs.statSync(avifOut).size} WebP: ${fs.statSync(webpOut).size}`);
  }
}

async function optimizeFB() {
  const src = 'public/FB_IMG_1785107325979.jpg';
  const widths = [551, 800];

  for (const w of widths) {
    const avifOut = `public/FB_IMG_1785107325979-${w}w.avif`;
    const webpOut = `public/FB_IMG_1785107325979-${w}w.webp`;
    const jpgOut = `public/FB_IMG_1785107325979-${w}w.jpg`;

    await sharp(src).resize({ width: w }).avif({ effort: 6, quality: 65 }).toFile(avifOut);
    await sharp(src).resize({ width: w }).webp({ effort: 6, quality: 75 }).toFile(webpOut);
    await sharp(src).resize({ width: w }).jpeg({ quality: 80, mozjpeg: true }).toFile(jpgOut);

    console.log(`Generated FB ${w}w - AVIF: ${fs.statSync(avifOut).size} WebP: ${fs.statSync(webpOut).size} JPG: ${fs.statSync(jpgOut).size}`);
  }
}

Promise.all([optimizeHero(), optimizeFB()]).then(() => console.log('Optimization Done'));
