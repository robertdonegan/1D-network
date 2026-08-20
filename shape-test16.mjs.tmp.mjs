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

async function verts() {
  return await page.evaluate(() => {
    // vertex circles are the small r=5/6 orange dots; grab their cx/cy
    const circles = [...document.querySelectorAll('svg circle')].filter(c => {
      const fill = c.getAttribute('fill') || '';
      return fill.includes('orange') || getComputedStyle(c).fill.includes('254, 126, 0') || c.getAttribute('r') === '5';
    });
    return circles.slice(-3).map(c => [Number(c.getAttribute('cx')), Number(c.getAttribute('cy'))]);
  });
}
console.log('before:', JSON.stringify(await verts()));
await page.mouse.click(950, 350, { clickCount: 1 });
await page.waitForTimeout(200);
console.log('after H click at (950,350):', JSON.stringify(await verts()));
await browser.close();
