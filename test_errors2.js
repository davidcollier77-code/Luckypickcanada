const { chromium } = require('playwright-chromium');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    const errors = [];
    page.on('console', msg => {
        if (msg.type() === 'error' && !msg.text().includes('500 (Internal Server Error)')) {
            errors.push(msg.text());
            console.error('Browser Error:', msg.text());
        }
    });

    await page.goto('http://localhost:3000/lucky-meter', { waitUntil: 'networkidle' });

    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'networkidle' });

    // click awaken button
    await page.getByRole('button').first().click();

    // wait 10s for animation
    await page.waitForTimeout(10000);

    await browser.close();

    if (errors.length > 0) {
        console.log("Found frontend errors:", errors);
        process.exit(1);
    } else {
        console.log("No frontend console errors detected during animation sequence.");
        process.exit(0);
    }
})();
