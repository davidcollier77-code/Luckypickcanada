/* eslint-disable no-console */
// Visual probe for `specs/084-lucky-reveal-counter`.
//
// Renders the production build in Chromium, stubs the public total with a known
// value, and records what the counter actually paints at desktop and mobile
// widths. Screenshots and the JSON report are written to artifacts/counter-proof/.
//
// Prerequisite (once per workspace):
//   scripts/setup-chromium-libs.sh
//   eval "$(scripts/setup-chromium-libs.sh --env)"
//
// Usage:
//   node artifacts/lucky-reveal-counter-probe.cjs [base-url]
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-chromium');

const BASE_URL = process.argv[2] || process.env.TARGET_URL || 'http://127.0.0.1:3100';
const OUT = path.join(__dirname, 'counter-proof');

const VIEWPORTS = [
  { label: 'desktop-1440x900', viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
  {
    label: 'mobile-390x844',
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  },
];

async function inspect(browser, spec) {
  const context = await browser.newContext({
    viewport: spec.viewport,
    deviceScaleFactor: spec.deviceScaleFactor,
    isMobile: Boolean(spec.isMobile),
    hasTouch: Boolean(spec.hasTouch),
    colorScheme: 'dark',
    locale: 'en-CA',
  });
  const page = await context.newPage();
  const consoleErrors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text().slice(0, 300));
  });
  page.on('pageerror', (error) => consoleErrors.push(`pageerror: ${error.message}`.slice(0, 300)));

  await page.route('**/api/visits', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ visits: 12345 }) }),
  );
  await page.route('**/api/lucky-reveals-count', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ total: 4321 }) }),
  );

  const response = await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 90_000 });
  const counter = page.locator('#lucky-reveals-counter');
  await counter.waitFor({ state: 'visible', timeout: 30_000 });
  await counter.scrollIntoViewIfNeeded();
  await page.waitForTimeout(700);

  const facts = await counter.evaluate((element) => {
    const style = getComputedStyle(element);
    const number = element.querySelector('.homepage-reveals-counter-number');
    const label = element.querySelector('.homepage-reveals-counter-label');
    const numberStyle = number ? getComputedStyle(number) : null;
    const rect = element.getBoundingClientRect();

    return {
      text: (element.innerText || '').replace(/\s+/g, ' ').trim(),
      label: label ? label.textContent.trim() : null,
      number: number ? number.textContent.trim() : null,
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      borderRadius: style.borderRadius,
      borderColor: style.borderColor,
      backgroundImage: style.backgroundImage.slice(0, 140),
      boxShadow: style.boxShadow.slice(0, 160),
      numberFontSize: numberStyle ? numberStyle.fontSize : null,
      numberColor: numberStyle ? numberStyle.color : null,
      numberBackgroundImage: numberStyle ? numberStyle.backgroundImage.slice(0, 100) : null,
      horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  });

  const shot = path.join(OUT, `counter-${spec.label}.png`);
  await counter.screenshot({ path: shot });

  const sequence = await page.evaluate(() => {
    const reveal = document.getElementById('personalized');
    const counter = document.getElementById('lucky-reveals-counter');
    const tipJar = document.getElementById('tip-jar-section');
    const follows = (first, second) =>
      Boolean(first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING);

    return {
      afterRevealInDom: follows(reveal, counter),
      beforeTipJarInDom: follows(counter, tipJar),
      gapFromReveal: Math.round(
        counter.getBoundingClientRect().top - reveal.getBoundingClientRect().bottom,
      ),
    };
  });

  await context.close();

  return {
    label: spec.label,
    status: response ? response.status() : null,
    ...facts,
    ...sequence,
    consoleErrors,
    screenshot: path.relative(OUT, shot),
    bytes: fs.statSync(shot).size,
  };
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const version = browser.version();
  const results = [];

  for (const spec of VIEWPORTS) {
    const result = await inspect(browser, spec);
    results.push(result);
    console.log(
      `${result.status} ${spec.label} — "${result.label}" = ${result.number}, ${result.width}x${result.height}px, overflow=${result.horizontalOverflow}px, consoleErrors=${result.consoleErrors.length}`,
    );
  }

  await browser.close();
  fs.writeFileSync(
    path.join(OUT, 'report.json'),
    JSON.stringify({ target: BASE_URL, capturedAt: new Date().toISOString(), browser: { name: 'chromium', version }, results }, null, 2),
  );
  console.log(`Chromium ${version} — ${results.length} counter capture(s) in ${OUT}`);
}

main().catch((error) => {
  console.error('COUNTER PROBE FAILED:', error);
  process.exit(1);
});
