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
await drawPoly([[750, 300], [900, 300], [900, 420], [750, 420]]); // rectangle A (move/rotate/reverse test)
await drawPoly([[750, 500], [900, 500], [900, 620], [750, 620]]); // rectangle B (delete test)
await page.keyboard.press('p'); // disarm pen

// 1. Click Shape split-tool main body -> should default to Move shape
const shapeBtn = page.getByTitle(/Move shape — drag/);
await shapeBtn.click();
await page.waitForTimeout(200);
await page.screenshot({ path: '/tmp/shape-move-default.png', clip: { x: 700, y: 250, width: 300, height: 200 } });

// vertices shown but non-interactive: try dragging a vertex dot directly -> shape shouldn't distort, only whole-shape move should work
await page.mouse.move(750, 300); // top-left vertex of rect A
await page.mouse.down();
await page.mouse.move(650, 250, { steps: 6 });
await page.mouse.up();
await page.waitForTimeout(200);
await page.screenshot({ path: '/tmp/shape-move-vertex-drag.png', clip: { x: 550, y: 150, width: 500, height: 350 } });

// 2. Move shape body (center) -> whole shape should move
await page.mouse.move(825, 360); // center of rect A
await page.mouse.down();
await page.mouse.move(825, 260, { steps: 6 }); // up 100
await page.mouse.up();
await page.waitForTimeout(200);
await page.screenshot({ path: '/tmp/shape-move-body.png', clip: { x: 550, y: 100, width: 500, height: 400 } });

console.log('errors after move test:', errors);
await browser.close();
