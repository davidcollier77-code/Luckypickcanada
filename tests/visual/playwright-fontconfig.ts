import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const SYSTEM_FONT_DIRS = [
  '/usr/share/fonts',
  '/usr/local/share/fonts',
  path.join(os.homedir(), '.fonts'),
  path.join(os.homedir(), '.local', 'share', 'fonts'),
];

function escapeXml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function hasSystemFonts() {
  return SYSTEM_FONT_DIRS.some((directory) => {
    try {
      return fs.readdirSync(directory).length > 0;
    } catch {
      return false;
    }
  });
}

/**
 * Chromium uses fontconfig on Linux. Minimal container images can have no
 * fontconfig file and no system fonts, which makes Skia abort as soon as a
 * page asks for a font fallback. Point Playwright's Chromium at the TTF that
 * Next already bundles so browser tests can run in those images.
 *
 * Normal developer machines and CI runners with system fonts are unchanged.
 */
export function configurePlaywrightFonts() {
  if (process.platform !== 'linux') return;

  const configuredFile = process.env.FONTCONFIG_FILE;
  if (configuredFile && fs.existsSync(configuredFile)) return;
  if (fs.existsSync('/etc/fonts/fonts.conf') && hasSystemFonts()) return;

  const bundledFont = path.join(
    process.cwd(),
    'node_modules',
    'next',
    'dist',
    'compiled',
    '@vercel',
    'og',
    'Geist-Regular.ttf',
  );

  if (!fs.existsSync(bundledFont)) {
    throw new Error(
      `No usable system fonts were found and the Playwright fallback font is missing: ${bundledFont}`,
    );
  }

  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'lpc-playwright-fonts-'));
  const cacheDirectory = path.join(directory, 'cache');
  fs.mkdirSync(cacheDirectory);

  const configPath = path.join(directory, 'fonts.conf');
  fs.writeFileSync(
    configPath,
    [
      '<?xml version="1.0"?>',
      '<fontconfig>',
      `  <dir>${escapeXml(path.dirname(bundledFont))}</dir>`,
      `  <cachedir>${escapeXml(cacheDirectory)}</cachedir>`,
      '</fontconfig>',
      '',
    ].join('\n'),
  );

  process.env.FONTCONFIG_FILE = configPath;
}
