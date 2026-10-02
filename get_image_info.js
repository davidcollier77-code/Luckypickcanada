const fs = require('fs');

async function checkImage(path) {
  try {
    const stats = fs.statSync(path);
    console.log(`Image: ${path}`);
    console.log(`Size: ${stats.size} bytes`);
  } catch (err) {
    console.error(`Error reading ${path}:`, err);
  }
}

checkImage('public/homepage-hero-lucky-pick-canada.png');
checkImage('public/BackgroundEraser_20260724_163638777.png');
