import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://localhost:5179/', { waitUntil: 'networkidle' });
await page.getByTitle(/Live Edit/).click();
await page.waitForTimeout(300);
await page.keyboard.press('p');
await page.waitForTimeout(150);
// draw far from the seed "Example polygon layer" shape
await page.mouse.click(1000, 250);
await page.waitForTimeout(150);
await page.mouse.click(1000, 400);
await page.waitForTimeout(150);
await page.mouse.dblclick(1150, 400);
await page.waitForTimeout(300);
await page.screenshot({ path: '/tmp/tri-far.png', clip: { x: 900, y: 150, width: 350, height: 350 } });
await browser.close();
