const fs = require('fs');

let content = fs.readFileSync('app/layout.js', 'utf8');

const imports = `import { Inter, Manrope, Playfair_Display, Cinzel } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
});

const manrope = Manrope({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-manrope',
  weight: ['400', '500', '600', '700', '800'],
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-playfair',
  weight: ['400', '500', '600', '700', '800', '900'],
});

const cinzel = Cinzel({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-cinzel',
  weight: ['600', '700', '800', '900'],
});
`;

content = content.replace(
  "import Link from 'next/link';",
  "import Link from 'next/link';\n" + imports
);

content = content.replace(
  /<html\n\s*lang="en-CA"\n\s*className="m-0 p-0"\n\s*style={{\n\s*'--font-inter': '"Inter"',\n\s*'--font-playfair': '"Playfair Display"',\n\s*'--font-cinzel': '"Cinzel"',\n\s*'--font-manrope': '"Manrope"',\n\s*}}/,
  '<html lang="en-CA" className={`m-0 p-0 ${inter.variable} ${manrope.variable} ${playfair.variable} ${cinzel.variable}`}'
);

content = content.replace(
  /<link rel="preconnect" href="https:\/\/fonts\.googleapis\.com" \/>\n\s*<link rel="preconnect" href="https:\/\/fonts\.gstatic\.com" crossOrigin="anonymous" \/>\n\s*<link\n\s*rel="stylesheet"\n\s*href="https:\/\/fonts\.googleapis\.com\/css2\?family=Cinzel:wght@600;700;800;900&family=Inter:wght@100\.\.900&family=Manrope:wght@400;500;600;700;800&family=Playfair\+Display:wght@400\.\.900&display=swap"\n\s*\/>\n/,
  ''
);

fs.writeFileSync('app/layout.js', content);
