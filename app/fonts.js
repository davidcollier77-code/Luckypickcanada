import { Inter, Manrope, Playfair_Display, Cinzel } from 'next/font/google';

// Inter is only the last entry of the `--lpc-body` stack (Manrope is the body
// face) and no element asks for `font-sans`, so the font file is fetched when a
// real fallback is needed instead of being preloaded on every route. That keeps
// two woff2 files off the critical path the LCP artwork is competing with.
export const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: false,
  variable: '--font-inter',
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
});

export const manrope = Manrope({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-manrope',
  weight: ['400', '500', '600', '700', '800'],
});

// Playfair is used only by `font-playfair`/`font-serif` content (the About page
// and the Daily Card Reveal quote), so it is not preloaded on routes that never
// render it. Pages that do use it still load it from the emitted @font-face.
export const playfair = Playfair_Display({
  subsets: ['latin'],
  display: 'swap',
  preload: false,
  variable: '--font-playfair',
  weight: ['400', '500', '600', '700', '800', '900'],
});

export const cinzel = Cinzel({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-cinzel',
  weight: ['600', '700', '800', '900'],
});
