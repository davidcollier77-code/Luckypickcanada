import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

/**
 * Source and asset guard for `specs/112-feature-image-social-sharing-optimization`.
 *
 * SEO audit findings F-H2 (feature-page images), F-H3 (share image) and the
 * in-scope part of F-M6 (missing intrinsic dimensions). The guard reads the real
 * asset files: an optimization that is only claimed in markup cannot pass.
 */

const read = (relativePath) => readFileSync(join(process.cwd(), relativePath), 'utf8');
const filePath = (relativePath) => join(process.cwd(), relativePath);
const exists = (relativePath) => existsSync(filePath(relativePath));
const bytes = (relativePath) => statSync(filePath(relativePath)).size;
const publicPath = (url) => `public${url}`;
const metadataOf = (relativePath) => sharp(filePath(relativePath)).metadata();

const SHARE_URL = '/luckypickcanada-share-1200x630.jpg';
const SHARE_FILE = publicPath(SHARE_URL);
const HOME_SHARE_URL = '/luckypickcanada-home-1200x630.jpg';
const HOME_SHARE_FILE = publicPath(HOME_SHARE_URL);
const ORIGINAL_SHARE_URL = '/1785347037732.png';
const ORIGINAL_SHARE_FILE = publicPath(ORIGINAL_SHARE_URL);
// The homepage preview is a capture of the live homepage; feature pages keep
// the shared artwork, so app/layout.js is checked by its own homepage test.
const METADATA_FILES = [
  'app/map/page.js',
  'app/crystal-ball/page.js',
  'app/lucky-meter/page.js',
  'app/reveal/page.tsx',
  'app/lucky-map-of-canada/page.js',
  'app/where-luck-has-been-found-in-canada/page.js',
];

const crystalSource = read('app/components/CrystalBall/CrystalBall.tsx');
const meterSource = read('components/DailyResonance.tsx');
const revealSource = read('app/lucky-card-reveal.js');
const mapSource = read('app/lucky-map-of-canada/lucky-map-of-canada.js');

function slice(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start);
  return start >= 0 && end > start ? source.slice(start, end) : '';
}

/** Every local image URL referenced by a markup fragment. */
function referencedImages(markup) {
  const matches = markup.matchAll(/\/(?:assets\/|images\/)?[A-Za-z0-9._-]+\.(?:avif|webp|png|jpe?g)/g);
  return [...new Set([...matches].map((match) => match[0]))];
}

function expectFilesExist(markup) {
  const images = referencedImages(markup);
  expect(images.length).toBeGreaterThan(0);
  for (const url of images) {
    expect(exists(publicPath(url)), `missing referenced image ${url}`).toBe(true);
    expect(bytes(publicPath(url)), `empty referenced image ${url}`).toBeGreaterThan(0);
  }
  return images;
}

const crystalPicture = slice(crystalSource, '<picture className={styles.ballArtwork}>', '</picture>');
const meterPicture = slice(meterSource, '<picture className="absolute inset-0', '</picture>');
const revealPicture = slice(revealSource, '<picture className="absolute inset-0 w-full h-full">', '</picture>');
const mapPicture = slice(mapSource, '<picture className="w-full">', '</picture>');

describe('Social share image (F-H3)', () => {
  it('is a real 1200x630 JPEG under 250 KB', async () => {
    expect(exists(SHARE_FILE)).toBe(true);
    const metadata = await metadataOf(SHARE_FILE);
    expect(metadata.width).toBe(1200);
    expect(metadata.height).toBe(630);
    expect(metadata.format).toBe('jpeg');
    expect(bytes(SHARE_FILE)).toBeLessThanOrEqual(250 * 1024);
  });

  it('is referenced by every social metadata module with dimensions that match the file', async () => {
    const metadata = await metadataOf(SHARE_FILE);
    for (const file of METADATA_FILES) {
      const source = read(file);
      expect(source, `${file} does not reference the share image`).toContain(SHARE_URL);
      expect(source, `${file} still references the oversized original`).not.toContain(ORIGINAL_SHARE_URL);
      expect(source, `${file} declares the wrong Open Graph dimensions`).toContain(
        'width: 1200, height: 630'
      );
      expect(metadata.width).toBe(1200);
      expect(metadata.height).toBe(630);
    }
  });

  it('keeps the original artwork asset untouched', async () => {
    expect(exists(ORIGINAL_SHARE_FILE)).toBe(true);
    const metadata = await metadataOf(ORIGINAL_SHARE_FILE);
    expect(metadata.width).toBe(1407);
    expect(metadata.height).toBe(768);
  });

  it('keeps a homepage preview capture at 1200x630 under 250 KB', async () => {
    expect(exists(HOME_SHARE_FILE)).toBe(true);
    const metadata = await metadataOf(HOME_SHARE_FILE);
    expect(metadata.width).toBe(1200);
    expect(metadata.height).toBe(630);
    expect(metadata.format).toBe('jpeg');
    expect(bytes(HOME_SHARE_FILE)).toBeLessThanOrEqual(250 * 1024);
  });

  it('uses the homepage preview as the root og:image and twitter:image', async () => {
    const source = read('app/layout.js');
    expect(source).toContain(HOME_SHARE_URL);
    expect(source).not.toContain(SHARE_URL);
    expect(source).toContain('width: 1200, height: 630');
    expect(source).toMatch(/images: \[\{ url: socialImage, alt: socialImageAlt \}\]/);
  });
});

describe('Feature-page image derivatives (F-H2)', () => {
  it('serves crystal-ball artwork at 420w and 716w in AVIF then WebP', async () => {
    expect(crystalPicture).not.toBe('');
    expect(crystalPicture).toContain(
      'srcSet="/assets/crystal-ball-pedestal-420w.avif 420w, /assets/crystal-ball-pedestal.avif 716w"'
    );
    expect(crystalPicture).toContain(
      'srcSet="/assets/crystal-ball-pedestal-420w.webp 420w, /assets/crystal-ball-pedestal.webp 716w"'
    );
    expect(crystalPicture).toContain('type="image/avif"');
    expect(crystalPicture).toContain('type="image/webp"');
    expect(crystalPicture).toContain('sizes="(max-width: 560px) 75vw, 420px"');
    expect(crystalPicture).toContain('src="/assets/crystal-ball-pedestal.png"');
    expect(crystalPicture).toContain('width={716}');
    expect(crystalPicture).toContain('height={875}');
    expect(crystalPicture).toContain('loading="eager"');
    expectFilesExist(crystalPicture);

    const small = await metadataOf('public/assets/crystal-ball-pedestal-420w.avif');
    expect(small.width).toBe(420);
    expect(small.height).toBe(513);
    expect(bytes('public/assets/crystal-ball-pedestal-420w.avif')).toBeLessThan(
      bytes('public/assets/crystal-ball-pedestal.png')
    );
  });

  it('serves the lucky-meter backdrop at 640w, 1024w and 1400w in both modern formats', async () => {
    expect(meterPicture).not.toBe('');
    expect(meterPicture).toContain(
      'srcSet="/images/lucky-meter-night-sky-640w.avif 640w, /images/lucky-meter-night-sky-1024w.avif 1024w, /images/lucky-meter-night-sky.avif 1400w"'
    );
    expect(meterPicture).toContain(
      'srcSet="/images/lucky-meter-night-sky-640w.webp 640w, /images/lucky-meter-night-sky-1024w.webp 1024w, /images/lucky-meter-night-sky.webp 1400w"'
    );
    expect(meterPicture).toContain('sizes="100vw"');
    // Presentation and priority hints are untouched.
    expect(meterPicture).toContain('objectPosition: "center 40%"');
    expect(meterPicture).toContain('loading="eager"');
    expect(meterPicture).toContain('fetchPriority="high"');
    expectFilesExist(meterPicture);

    const small = await metadataOf('public/images/lucky-meter-night-sky-640w.avif');
    expect(small.width).toBe(640);
    expect(small.height).toBe(1170);
    expect(bytes('public/images/lucky-meter-night-sky-640w.avif')).toBeLessThan(
      bytes('public/images/lucky-meter-night-sky.avif')
    );
  });

  it('serves the reveal backdrop at 1280w, 1920w and 2949w and declares intrinsic dimensions', async () => {
    expect(revealPicture).not.toBe('');
    expect(revealPicture).toContain(
      'srcSet="/NGC4216_crawford-1280w.avif 1280w, /NGC4216_crawford-1920w.avif 1920w, /NGC4216_crawford.avif 2949w"'
    );
    expect(revealPicture).toContain(
      'srcSet="/NGC4216_crawford-1280w.webp 1280w, /NGC4216_crawford-1920w.webp 1920w, /NGC4216_crawford.webp 2949w"'
    );
    expect(revealPicture).toContain('type="image/avif"');
    expect(revealPicture).toContain('type="image/webp"');
    expect(revealPicture).toContain('type="image/jpeg"');
    expect(revealPicture).toContain('sizes="100vw"');
    expect(revealPicture).toContain('src="/NGC4216_crawford.jpg"');
    // F-M6: the full-bleed decorative image now declares its intrinsic box.
    expect(revealPicture).toContain('width={2949}');
    expect(revealPicture).toContain('height={2847}');
    expect(revealPicture).toContain('object-cover object-center');
    expect(revealPicture).toContain('aria-hidden="true"');
    expectFilesExist(revealPicture);

    const small = await metadataOf('public/NGC4216_crawford-1280w.avif');
    expect(small.width).toBe(1280);
    expect(small.height).toBe(1236);
    expect(bytes('public/NGC4216_crawford-1280w.avif')).toBeLessThan(
      bytes('public/NGC4216_crawford.jpg')
    );
  });

  it('leaves the already-correct map artwork delivery unchanged', async () => {
    expect(mapPicture).not.toBe('');
    expect(mapPicture).toContain('type="image/avif"');
    expect(mapPicture).toContain('type="image/webp"');
    expect(mapPicture).toContain('src="/IMG_20260731_055452_187611.png"');
    expect(mapPicture).toContain('width={569}');
    expect(mapPicture).toContain('height={464}');
    expect(mapPicture).toContain('loading="eager"');
    expect(mapPicture).toContain('fetchPriority="high"');
    expectFilesExist(mapPicture);

    // The 569 px source is smaller than its 704 px rendered box, so no honest
    // larger derivative exists and none was invented.
    const avif = await metadataOf('public/IMG_20260731_055452_187611.avif');
    expect(avif.width).toBe(569);
    expect(avif.height).toBe(464);
    expect(bytes('public/IMG_20260731_055452_187611.avif')).toBeLessThan(
      bytes('public/IMG_20260731_055452_187611.png')
    );
  });
});

describe('Preserved artwork originals', () => {
  it('keeps every source PNG/JPEG at its original dimensions', async () => {
    const originals = [
      ['public/assets/crystal-ball-pedestal.png', 716, 875],
      ['public/images/lucky-meter-night-sky.webp', 1400, 2559],
      ['public/NGC4216_crawford.jpg', 2949, 2847],
      ['public/IMG_20260731_055452_187611.png', 569, 464],
    ];
    for (const [file, width, height] of originals) {
      const metadata = await metadataOf(file);
      expect(metadata.width, file).toBe(width);
      expect(metadata.height, file).toBe(height);
    }
  });
});
