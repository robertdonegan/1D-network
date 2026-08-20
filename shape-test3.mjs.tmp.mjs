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
await drawPoly([[700, 300], [950, 300], [950, 380], [700, 380]]); // rect, centroid ~ (825,340)
await page.keyboard.press('p');
await page.getByTitle(/Move shape — drag/).click();
await page.waitForTimeout(150);
await page.getByTitle('More options').nth(1).click();
await page.waitForTimeout(150);
await page.getByText('Rotate shape', { exact: true }).click();
await page.waitForTimeout(150);

// grab clearly INSIDE the body (not on a vertex), well off-centroid so angle change is visible
await page.mouse.move(900, 320); // inside, near right edge but not on the corner
await page.mouse.down();
await page.mouse.move(900, 450, { steps: 10 }); // drag down -> should rotate
await page.mouse.up();
await page.waitForTimeout(200);
await page.screenshot({ path: '/tmp/shape-rotate-free2.png', clip: { x: 600, y: 150, width: 500, height: 500 } });
console.log('errors:', errors);
await browser.close();
