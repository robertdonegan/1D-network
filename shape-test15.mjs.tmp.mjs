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
await drawPoly([[850, 250], [850, 400], [1100, 400]]);
await page.keyboard.press('p');
await page.getByTitle(/Move shape — drag/).click();
await page.waitForTimeout(150);
await page.getByTitle('More options').nth(1).click();
await page.waitForTimeout(150);
await page.getByText('Reverse shape', { exact: true }).click();
await page.waitForTimeout(150);

async function bbox() {
  return await page.evaluate(() => {
    const paths = document.querySelectorAll('svg path[fill-rule="evenodd"]');
    const p = paths[paths.length - 1]; // last-drawn shape
    const b = p.getBBox();
    return { x: b.x, y: b.y, w: b.width, h: b.height };
  });
}
console.log('before:', JSON.stringify(await bbox()));
await page.mouse.click(950, 350); // horizontal flip
await page.waitForTimeout(150);
console.log('after horizontal:', JSON.stringify(await bbox()));
await page.keyboard.down('Alt');
await page.mouse.click(950, 350);
await page.keyboard.up('Alt');
await page.waitForTimeout(150);
console.log('after vertical:', JSON.stringify(await bbox()));
console.log('errors:', errors);
await browser.close();
