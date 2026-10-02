const fs = require('fs');

const heroPath = 'app/homepage/Hero.js';
let heroContent = fs.readFileSync(heroPath, 'utf8');

if (!heroContent.includes('ExploreLuckButton')) {
  // Add import
  heroContent = heroContent.replace(
    "import Link from 'next/link';",
    "import Link from 'next/link';\nimport ExploreLuckButton from './ExploreLuckButton';"
  );

  // Add component
  heroContent = heroContent.replace(
    "alt=\"Lucky Pick Canada Hero Composition\"",
    "alt=\"Lucky Pick Canada Hero Composition\"\n                priority\n              />\n              <ExploreLuckButton />"
  );

  // Need to fix if replacing too much

  fs.writeFileSync(heroPath, heroContent);
  console.log("Patched Hero.js");
} else {
  console.log("Hero.js already patched");
}
