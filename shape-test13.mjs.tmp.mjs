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
// asymmetric right-triangle, well clear of the seed shape (x >= 1000)
await drawPoly([[1000, 250], [1000, 400], [1250, 400]]);
// second shape for delete test
await drawPoly([[1000, 500], [1150, 500], [1150, 580], [1000, 580]]);
await page.keyboard.press('p');

await page.getByTitle(/Move shape — drag/).click();
await page.waitForTimeout(150);
await page.getByTitle('More options').nth(1).click();
await page.waitForTimeout(150);
await page.getByText('Reverse shape', { exact: true }).click();
await page.waitForTimeout(150);
await page.screenshot({ path: '/tmp/f-rev-before.png', clip: { x: 950, y: 200, width: 350, height: 250 } });
await page.mouse.click(1080, 350); // inside triangle, default click = horizontal flip
await page.waitForTimeout(200);
await page.screenshot({ path: '/tmp/f-rev-after-h.png', clip: { x: 950, y: 200, width: 350, height: 250 } });
await page.keyboard.down('Alt');
await page.mouse.click(1080, 320);
await page.keyboard.up('Alt');
await page.waitForTimeout(200);
await page.screenshot({ path: '/tmp/f-rev-after-v.png', clip: { x: 950, y: 200, width: 350, height: 250 } });

await page.getByTitle('More options').nth(1).click();
await page.waitForTimeout(150);
await page.getByText('Delete shape', { exact: true }).click();
await page.waitForTimeout(150);
await page.mouse.click(1075, 540); // inside 2nd rectangle
await page.waitForTimeout(150);
await page.screenshot({ path: '/tmp/f-del-selected.png', clip: { x: 950, y: 450, width: 300, height: 200 } });
await page.keyboard.press('Delete');
await page.waitForTimeout(200);
await page.screenshot({ path: '/tmp/f-del-after.png', clip: { x: 950, y: 450, width: 300, height: 200 } });

console.log('errors:', errors);
await browser.close();
