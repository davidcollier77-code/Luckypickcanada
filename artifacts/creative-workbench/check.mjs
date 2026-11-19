import { chromium } from 'playwright';

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await context.newPage();
const errors = [];
page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(`console: ${message.text()}`);
});

await page.goto('http://localhost:3000/workbench/creative', { waitUntil: 'load' });
await page.waitForFunction(() => window.__creativeWorkbench?.ready === true, null, { timeout: 45000 });

const initial = await page.evaluate(() => window.__creativeWorkbench.getState());

await page.evaluate(() => window.__creativeWorkbench.setTime(2.5));
const frozen = await page.evaluate(() => window.__creativeWorkbench.getState());
await page.screenshot({ path: 'artifacts/creative-workbench/golden-motes-frozen.png' });

// A trusted click so the browser allows the audio context to resume.
await page.getByRole('button', { name: /Play cue/ }).click();
await page.waitForTimeout(1800);
const sounding = await page.evaluate(() => window.__creativeWorkbench.getState());

await page.evaluate(() => window.__creativeWorkbench.selectScene('reactive-aurora'));
await page.waitForFunction(
  () =>
    window.__creativeWorkbench.ready === true &&
    window.__creativeWorkbench.getState().sceneId === 'reactive-aurora',
  null,
  { timeout: 45000 },
);
await page.evaluate(() => window.__creativeWorkbench.setTime(2.5));
const aurora = await page.evaluate(() => window.__creativeWorkbench.getState());
const capture = await page.evaluate(() => window.__creativeWorkbench.capture());
await page.screenshot({ path: 'artifacts/creative-workbench/reactive-aurora-frozen.png' });

await page.evaluate(() => {
  window.__creativeWorkbench.setTier('constrained');
  window.__creativeWorkbench.setReducedMotion(true);
});
await page.waitForFunction(
  () => {
    const state = window.__creativeWorkbench.getState();
    return state.ready === true && state.reducedMotion === true && state.plan?.motion === 'none';
  },
  null,
  { timeout: 45000 },
);
await page.evaluate(() => window.__creativeWorkbench.setTime(2.5));
const calm = await page.evaluate(() => window.__creativeWorkbench.getState());
await page.screenshot({ path: 'artifacts/creative-workbench/reactive-aurora-constrained-reduced.png' });

console.log(
  JSON.stringify(
    {
      scenes: await page.evaluate(() => window.__creativeWorkbench.listScenes()),
      initial,
      frozen,
      sounding,
      aurora,
      capture,
      calm,
      errors,
    },
    null,
    2,
  ),
);
await browser.close();
