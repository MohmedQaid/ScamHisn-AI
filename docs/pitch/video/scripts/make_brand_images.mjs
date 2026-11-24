// Large logo mark and the Arabic name as transparent PNGs for the video.
import { createRequire } from 'node:module';
import fs from 'node:fs';
const require = createRequire('C:/Users/iV1R3S/Desktop/ScamHisn-AI/Deployable Website Application/apps/api/package.json');
const { chromium } = require('playwright');

const OUT = process.argv[2];
const svg = fs.readFileSync('C:/Users/iV1R3S/Desktop/ScamHisn-AI/Deployable Website Application/apps/web/public/favicon.svg', 'utf8');
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1200, height: 800 }, deviceScaleFactor: 2 })).newPage();
await page.setContent(`<html><body style="margin:0;background:transparent">
  <div id="logo" style="width:512px;height:512px;display:inline-block">${svg.replace('width="48" height="48"', 'width="512" height="512"')}</div>
  <div id="ar" style="display:inline-block;padding:10px 20px;font:700 120px 'Segoe UI',Tahoma,sans-serif;color:#0E6B47;direction:rtl">حصن الاحتيال</div>
</body></html>`);
await page.waitForTimeout(300);
await page.locator('#logo').screenshot({ path: `${OUT}/logo_1024.png`, omitBackground: true });
await page.locator('#ar').screenshot({ path: `${OUT}/brand_ar.png`, omitBackground: true });
const ab = await page.locator('#ar').boundingBox();
console.log('logo 1024, arabic', Math.round(ab.width * 2), 'x', Math.round(ab.height * 2));
await browser.close();
