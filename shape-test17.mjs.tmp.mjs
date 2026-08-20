import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
await page.goto('http://localhost:5179/', { waitUntil: 'networkidle' });
await page.getByTitle(/Live Edit/).click();
await page.waitForTimeout(300);
await page.keyboard.press('p');
await page.waitForTimeout(150);
async function drawPoly(pts) {
  for (let i = 0; i < pts.length - 1; i++) { await page.mouse.click(pts[i][0], pts[i][1]); await page.waitForTimeout(80); }
  const last = pts[pts.length - 1];
  await page.mouse.dblclick(last[0], last[1]);
  await page.waitForTimeout(200);
}
// right angle at TOP-LEFT: (850,250)-(850,400)-(1100,400)
await drawPoly([[850, 250], [850, 400], [1100, 400]]);
await page.keyboard.press('p');
await page.getByTitle(/Move shape — drag/).click();
await page.waitForTimeout(150);
await page.getByTitle('More options').nth(1).click();
await page.waitForTimeout(150);
await page.getByText('Reverse shape', { exact: true }).click();
await page.waitForTimeout(150);
await page.screenshot({ path: '/tmp/vflip-before.png', clip: { x: 800, y: 200, width: 350, height: 250 } });

// deep-interior point, well away from any edge, for a reliable hit
await page.keyboard.down('Alt');
await page.mouse.click(1000, 350);
await page.keyboard.up('Alt');
await page.waitForTimeout(200);
await page.screenshot({ path: '/tmp/vflip-after.png', clip: { x: 800, y: 200, width: 350, height: 250 } });
console.log('errors:', errors);
await browser.close();
