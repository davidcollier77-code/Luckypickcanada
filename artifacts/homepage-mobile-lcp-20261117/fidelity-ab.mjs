// Clean A/B of the hero artwork itself at the PSI mobile profile: the same <img>
// element is screenshotted twice, once with the 768w candidate and once with the
// previous 1024w file routed over that URL. Animations are disabled so the
// decorative shimmer overlay cannot pollute the comparison.
import { chromium } from 'playwright';
import sharp from 'sharp';

const url = 'http://127.0.0.1:3100/';
const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const context = await browser.newContext({ viewport: { width: 412, height: 823 }, deviceScaleFactor: 1.75, isMobile: true, hasTouch: true });

async function shot(replaceWithPrevious) {
  const page = await context.newPage();
  if (replaceWithPrevious) {
    await page.route('**/homepage-hero-lucky-pick-canada-768w.avif', async (route) => {
      const response = await route.fetch({ url: route.request().url().replace('-768w.avif', '.avif') });
      await route.fulfill({ response });
    });
  }
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction(() => document.querySelector('.hero-art-slice--emblem .hero-art-image')?.complete === true);
  await page.waitForTimeout(800);
  const buf = await page.locator('.hero-art-slice--emblem .hero-art-image').screenshot({ animations: 'disabled' });
  await page.close();
  return buf;
}
const neu = await shot(false);
const old = await shot(true);
await sharp(neu).toFile('artifacts/homepage-mobile-lcp-20261117/fidelity-768w.png');
await sharp(old).toFile('artifacts/homepage-mobile-lcp-20261117/fidelity-1024w.png');
// Side-by-side of a detail region (gold wordmark) for visual inspection.
const meta = await sharp(neu).metadata();
const cropTop = Math.round(meta.height * 0.42), cropH = Math.round(meta.height * 0.18);
const left = await sharp(neu).extract({ left: 0, top: cropTop, width: meta.width, height: cropH }).toBuffer();
const right = await sharp(old).extract({ left: 0, top: cropTop, width: meta.width, height: cropH }).toBuffer();
await sharp({ create: { width: meta.width, height: cropH * 2 + 6, channels: 3, background: '#ff00ff' } })
  .composite([{ input: left, top: 0, left: 0 }, { input: right, top: cropH + 6, left: 0 }])
  .png().toFile('artifacts/homepage-mobile-lcp-20261117/fidelity-detail-top768-bottom1024.png');
const a = await sharp(neu).removeAlpha().raw().toBuffer();
const b = await sharp(old).removeAlpha().raw().toBuffer();
let sum = 0, max = 0;
for (let i = 0; i < Math.min(a.length, b.length); i++) { const d = Math.abs(a[i] - b[i]); sum += d; if (d > max) max = d; }
const n = Math.min(a.length, b.length);
console.log(JSON.stringify({ size: `${meta.width}x${meta.height}`, meanAbsDiff: +(sum / n).toFixed(2), psnr: +(10 * Math.log10(65025 / (a.reduce((s, v, i) => s + (v - b[i]) ** 2, 0) / n))).toFixed(2), worstChannelDiff: max }, null, 1));
await browser.close();
