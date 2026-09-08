import { chromium } from 'playwright-core';

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 900, height: 500 } });
await page.goto('http://localhost:5183/', { waitUntil: 'networkidle' });
await page.waitForTimeout(1000);

// Switch to FM 1D mode to reproduce narrow-ribbon overflow like the screenshot
const modeBtn = page.locator('button:has-text("FM 1D")').first();
await modeBtn.click();
await page.waitForTimeout(500);

// shrink viewport further to force overflow button to appear
await page.setViewportSize({ width: 700, height: 500 });
await page.waitForTimeout(500);

await page.screenshot({ path: '/tmp/ribbon_before.png' });

// find and click the overflow "more" button
const moreBtn = page.locator('button[title="More ribbon items"]');
const count = await moreBtn.count();
console.log('overflow buttons found:', count);
if (count > 0) {
  await moreBtn.first().click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: '/tmp/ribbon_open.png' });
}

// Check computed overflow styles on ancestors of the ribbon bar
const info = await page.evaluate(() => {
  const btn = document.querySelector('button[title="More ribbon items"]');
  if (!btn) return 'no button';
  let el = btn;
  const chain = [];
  for (let i = 0; i < 8 && el; i++) {
    const cs = getComputedStyle(el);
    chain.push({
      tag: el.tagName, cls: el.className?.toString().slice(0,40),
      overflow: cs.overflow, overflowX: cs.overflowX, overflowY: cs.overflowY,
      zIndex: cs.zIndex, position: cs.position, height: cs.height,
    });
    el = el.parentElement;
  }
  return chain;
});
console.log(JSON.stringify(info, null, 2));

await browser.close();
