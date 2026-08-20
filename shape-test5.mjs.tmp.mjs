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
  for (let i = 0; i < pts.length - 1; i++) { await page.mouse.click(pts[i][0], pts[i][1]); await page.waitForTimeout(60); }
  const last = pts[pts.length - 1];
  await page.mouse.dblclick(last[0], last[1]);
  await page.waitForTimeout(200);
}
// asymmetric right-triangle-ish shape: right angle at bottom-left, so flips are visually obvious
await drawPoly([[700, 400], [700, 550], [950, 550], [700, 400]]);
await page.keyboard.press('p');
await page.getByTitle(/Move shape — drag/).click();
await page.waitForTimeout(150);
await page.getByTitle('More options').nth(1).click();
await page.waitForTimeout(150);
await page.getByText('Reverse shape', { exact: true }).click();
await page.waitForTimeout(150);
await page.screenshot({ path: '/tmp/rev-before.png', clip: { x: 600, y: 300, width: 450, height: 350 } });
await page.mouse.click(800, 500); // click default -> horizontal flip
await page.waitForTimeout(200);
await page.screenshot({ path: '/tmp/rev-after-h.png', clip: { x: 600, y: 300, width: 450, height: 350 } });
await page.keyboard.down('Alt');
await page.mouse.click(800, 500); // alt+click -> vertical flip
await page.keyboard.up('Alt');
await page.waitForTimeout(200);
await page.screenshot({ path: '/tmp/rev-after-v.png', clip: { x: 600, y: 300, width: 450, height: 350 } });
console.log('errors:', errors);
await browser.close();
