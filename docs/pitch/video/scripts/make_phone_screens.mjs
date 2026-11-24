// Makes the two images shown on the 3D phone: a lock screen with the scam SMS, and the app's verdict.
import { createRequire } from 'node:module';
import fs from 'node:fs';
const require = createRequire('C:/Users/iV1R3S/Desktop/ScamHisn-AI/Deployable Website Application/apps/api/package.json');
const { chromium } = require('playwright');

const OUT = process.argv[2];
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();

// 1. Lock screen with the scam message (our own design, in the project palette)
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 });
  const page = await ctx.newPage();
  await page.setContent(`<!doctype html><html><body style="margin:0;width:390px;height:844px;background:#14201A;font-family:Nunito,'Segoe UI',sans-serif;color:#FBF8F1;overflow:hidden">
    <div style="position:absolute;top:18px;left:0;right:0;text-align:center;font-size:15px;font-weight:700;opacity:.85">9:41</div>
    <div style="position:absolute;top:92px;left:0;right:0;text-align:center;font-size:19px;font-weight:600;opacity:.8">Tuesday 25 November</div>
    <div style="position:absolute;top:112px;left:0;right:0;text-align:center;font-size:104px;font-weight:800;letter-spacing:-3px;line-height:1.1">9:41</div>
    <div style="position:absolute;left:14px;right:14px;top:330px;background:#FBF8F1;color:#14201A;border-radius:26px;padding:18px 20px 20px">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
        <div style="width:30px;height:30px;border-radius:9px;background:#0E6B47;display:flex;align-items:center;justify-content:center">
          <div style="width:16px;height:12px;border-radius:4px;background:#FBF8F1"></div>
        </div>
        <div style="font-size:14px;font-weight:700;color:#5C6660;letter-spacing:.6px">MESSAGES</div>
        <div style="margin-left:auto;font-size:14px;color:#5C6660">now</div>
      </div>
      <div style="font-size:20px;font-weight:800;margin-bottom:5px">AD-Fines</div>
      <div style="font-size:19.5px;line-height:1.36;font-weight:500">You have an unpaid traffic fine of AED 300. Pay today to avoid a penalty:</div>
      <div style="font-size:19.5px;line-height:1.5;font-weight:800;color:#C8322B">adpolice-fines-pay.top/verify</div>
    </div>
    <div style="position:absolute;bottom:10px;left:50%;margin-left:-70px;width:140px;height:5px;border-radius:3px;background:#FBF8F1;opacity:.55"></div>
  </body></html>`);
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/screen_sms.png` });
  await ctx.close();
  console.log('ok screen_sms');
}

// 2. The app's verdict on a phone (English), from the running build
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 });
  const page = await ctx.newPage();
  await page.goto(process.argv[3] ?? 'http://localhost:3003/', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Fake fine link', exact: true }).click();
  await page.locator('button[type="submit"]').first().click();
  await page.getByText('Evidence').first().waitFor({ timeout: 90000 });
  await page.waitForTimeout(800);
  const band = await page.locator('section.rounded-box').first().boundingBox();
  await page.evaluate((y) => scrollBy(0, y), band.y - 84);
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/screen_app.png` });
  await ctx.close();
  console.log('ok screen_app');
}
await browser.close();
