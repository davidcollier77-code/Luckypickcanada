const sharp = require('sharp');
const fs = require('fs');
async function optimizeFB() {
  const src = 'public/FB_IMG_1785107325979.jpg';

  await sharp(src).avif({ effort: 6, quality: 65 }).toFile('public/FB_IMG_1785107325979.avif');
  await sharp(src).webp({ effort: 6, quality: 75 }).toFile('public/FB_IMG_1785107325979.webp');

  console.log('AVIF:', fs.statSync('public/FB_IMG_1785107325979.avif').size);
  console.log('WebP:', fs.statSync('public/FB_IMG_1785107325979.webp').size);
}
optimizeFB();
