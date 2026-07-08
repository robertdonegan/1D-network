import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://localhost:5173/');
await page.waitForTimeout(500);
const bh = page.locator('[title="Drag up to reveal the Global Animator panel"]');
const bb = await bh.boundingBox();
await page.mouse.move(bb.x+bb.width/2, bb.y+bb.height/2);
await page.mouse.down();
await page.mouse.move(bb.x+bb.width/2, bb.y-150, {steps:8});
await page.mouse.up();
await page.waitForTimeout(200);

const info = await page.evaluate(() => {
  const col = document.querySelectorAll('div[style*="flex-direction: column"]');
  // find the canvas column: has position relative and contains a canvas grid bg
  let canvasColumn = null;
  for (const el of col) {
    if (el.style.position === 'relative' && getComputedStyle(el).flex.includes('1')) { canvasColumn = el; break; }
  }
  const gisRoot = canvasColumn?.children[0];
  const panelSlot = canvasColumn ? Array.from(canvasColumn.children).find(c => c !== gisRoot && c.getBoundingClientRect().height > 20) : null;
  return {
    canvasColumnRect: canvasColumn?.getBoundingClientRect(),
    gisRootRect: gisRoot?.getBoundingClientRect(),
    gisRootStyle: gisRoot ? { height: getComputedStyle(gisRoot).height, flex: getComputedStyle(gisRoot).flex } : null,
    panelSlotRect: panelSlot?.getBoundingClientRect(),
  };
});
console.log(JSON.stringify(info, null, 2));
await browser.close();
