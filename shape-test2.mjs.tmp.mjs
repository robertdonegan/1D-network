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
// Rectangle for rotate test — non-square so rotation is visible
await drawPoly([[700, 300], [950, 300], [950, 380], [700, 380]]);
// Rectangle for reverse test
await drawPoly([[700, 450], [900, 450], [900, 550], [700, 550]]);
// Rectangle for delete test
await drawPoly([[700, 620], [850, 620], [850, 700], [700, 700]]);
await page.keyboard.press('p');

// --- Rotate: freeform ---
await page.getByTitle(/Move shape — drag/).click();
await page.waitForTimeout(150);
await page.getByTitle('More options').nth(1).click(); // shape split-tool chevron
await page.waitForTimeout(150);
await page.getByText('Rotate shape', { exact: true }).click();
await page.waitForTimeout(150);
await page.mouse.move(950, 300); // grab the right edge of rect A, away from centroid (~825,340)
await page.mouse.down();
await page.mouse.move(950, 500, { steps: 10 }); // sweep down -> free rotation
await page.mouse.up();
await page.waitForTimeout(200);
await page.screenshot({ path: '/tmp/shape-rotate-free.png', clip: { x: 600, y: 150, width: 500, height: 500 } });

// --- Rotate: shift-constrained 15deg steps ---
// re-grab and rotate with shift held; should snap to a clean 15deg multiple
await page.mouse.move(825, 340); // approx centroid area after prior rotation - reacquire a corner instead
// Just start a new drag from wherever the shape currently is: query is hard headlessly,
// so instead verify constrained behavior on a FRESH shape.
await drawPoly([[1050, 300], [1200, 300], [1200, 350], [1050, 350]]);
await page.mouse.move(1200, 300); // right edge
await page.keyboard.down('Shift');
await page.mouse.down();
await page.mouse.move(1200, 260, { steps: 3 }); // small angle, should snap to nearest 15deg (likely 0 or 15)
await page.mouse.up();
await page.keyboard.up('Shift');
await page.waitForTimeout(200);
await page.screenshot({ path: '/tmp/shape-rotate-shift.png', clip: { x: 950, y: 150, width: 400, height: 300 } });

console.log('errors after rotate test:', errors);
await browser.close();
