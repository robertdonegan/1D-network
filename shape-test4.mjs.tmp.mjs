import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
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
// Shape 1: rotate w/ shift-snap. Shape 2: reverse test. Shape 3: delete test.
await drawPoly([[700, 250], [950, 250], [950, 330], [700, 330]]); // centroid ~ (825,290)
await drawPoly([[700, 420], [900, 420], [900, 520], [700, 520]]);
await drawPoly([[700, 600], [850, 600], [850, 680], [700, 680]]);
await page.keyboard.press('p');

// --- Shift-constrained rotate on shape 1 ---
await page.getByTitle(/Move shape — drag/).click();
await page.waitForTimeout(150);
await page.getByTitle('More options').nth(1).click();
await page.waitForTimeout(150);
await page.getByText('Rotate shape', { exact: true }).click();
await page.waitForTimeout(150);
await page.mouse.move(900, 260); // inside shape 1, off-centroid
await page.keyboard.down('Shift');
await page.mouse.down();
await page.mouse.move(900, 420, { steps: 10 }); // big sweep, should snap to a clean 15deg multiple
await page.mouse.up();
await page.keyboard.up('Shift');
await page.waitForTimeout(200);
await page.screenshot({ path: '/tmp/shape-rotate-shift2.png', clip: { x: 600, y: 100, width: 500, height: 400 } });

// --- Reverse: default click = horizontal flip ---
await page.getByTitle('More options').nth(1).click();
await page.waitForTimeout(150);
await page.getByText('Reverse shape', { exact: true }).click();
await page.waitForTimeout(150);
await page.screenshot({ path: '/tmp/shape-reverse-before.png', clip: { x: 650, y: 380, width: 350, height: 200 } });
await page.mouse.click(800, 470); // inside shape 2 (rect 700-900,420-520)
await page.waitForTimeout(200);
await page.screenshot({ path: '/tmp/shape-reverse-after-h.png', clip: { x: 650, y: 380, width: 350, height: 200 } });
// Alt+click = vertical flip
await page.keyboard.down('Alt');
await page.mouse.click(800, 470);
await page.keyboard.up('Alt');
await page.waitForTimeout(200);
await page.screenshot({ path: '/tmp/shape-reverse-after-v.png', clip: { x: 650, y: 380, width: 350, height: 200 } });

// --- Delete: select then Delete/Backspace ---
await page.getByTitle('More options').nth(1).click();
await page.waitForTimeout(150);
await page.getByText('Delete shape', { exact: true }).click();
await page.waitForTimeout(150);
await page.mouse.click(775, 640); // inside shape 3 (rect 700-850,600-680)
await page.waitForTimeout(150);
await page.screenshot({ path: '/tmp/shape-delete-selected.png', clip: { x: 650, y: 560, width: 300, height: 200 } });
await page.keyboard.press('Delete');
await page.waitForTimeout(200);
await page.screenshot({ path: '/tmp/shape-delete-after.png', clip: { x: 650, y: 560, width: 300, height: 200 } });

console.log('page errors:', errors);
await browser.close();
