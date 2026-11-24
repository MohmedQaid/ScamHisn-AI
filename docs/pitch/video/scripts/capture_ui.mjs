// Cuts the real app interface into separate transparent PNG pieces, with a manifest of where
// each piece sits on the page, so After Effects can rebuild the screen and move pieces on their own.
import { createRequire } from 'node:module';
import fs from 'node:fs';
const require = createRequire('C:/Users/iV1R3S/Desktop/ScamHisn-AI/Deployable Website Application/apps/api/package.json');
const { chromium } = require('playwright');

const BASE = process.argv[2] ?? 'http://localhost:3003/';
const OUT = process.argv[3];
fs.mkdirSync(OUT, { recursive: true });
const SCALE = 3;
const manifest = {};
const browser = await chromium.launch();

async function newPage() {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: SCALE });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.addStyleTag({ content: 'html,body,#root,header{background:transparent !important} *{caret-color:transparent !important}' });
  // The video shows the normal state: no "paused" tags
  await page.evaluate(() => {
    for (const el of document.querySelectorAll('span,small,em')) if (/^paused$/i.test(el.textContent.trim())) el.style.display = 'none';
  });
  return { ctx, page };
}

async function cap(page, name, locator, pad = 0) {
  try {
    const el = locator.first();
    await el.scrollIntoViewIfNeeded();
    const box = await el.boundingBox();
    const sy = await page.evaluate(() => scrollY);
    if (pad) {
      await page.screenshot({ path: `${OUT}/${name}.png`, omitBackground: true, clip: { x: box.x - pad, y: box.y - pad, width: box.width + 2 * pad, height: box.height + 2 * pad } });
      manifest[name] = { x: box.x - pad, y: box.y + sy - pad, w: box.width + 2 * pad, h: box.height + 2 * pad };
    } else {
      await el.screenshot({ path: `${OUT}/${name}.png`, omitBackground: true });
      manifest[name] = { x: box.x, y: box.y + sy, w: box.width, h: box.height };
    }
    console.log('ok  ', name, JSON.stringify(manifest[name]));
  } catch (e) {
    console.log('FAIL', name, String(e.message).split('\n')[0]);
  }
}
const round = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, typeof v === 'number' ? Math.round(v * 100) / 100 : v]));

// ---------------------------------------------------------------- home (English)
{
  const { ctx, page } = await newPage();
  await cap(page, 'home_header', page.locator('header'));
  await cap(page, 'home_h1', page.locator('main h1'), 6);
  await cap(page, 'home_form_empty', page.locator('form > div'), 4);
  const tabs = page.locator('section button.group');
  for (let i = 0; i < 4; i++) await cap(page, `home_tab_${i}`, tabs.nth(i));
  await cap(page, 'home_samples', page.getByRole('button', { name: 'Fake fine link', exact: true }).locator('..'), 4);
  // hero copy and the fort drawing, each on its own
  const sub = page.locator('main h1 + p, main h1 ~ p').first();
  await cap(page, 'home_sub', sub, 4);
  const fort = await page.evaluateHandle(() => {
    let best = null;
    let area = 0;
    for (const svg of document.querySelectorAll('main svg')) {
      const r = svg.getBoundingClientRect();
      if (r.width * r.height > area) {
        area = r.width * r.height;
        best = svg;
      }
    }
    return best;
  });
  const fb = await fort.asElement().boundingBox();
  await fort.asElement().screenshot({ path: `${OUT}/home_fort.png`, omitBackground: true });
  manifest.home_fort = { x: fb.x, y: fb.y, w: fb.width, h: fb.height };
  console.log('ok   home_fort', JSON.stringify(manifest.home_fort));

  // the same form with the fake link typed in
  await page.getByRole('button', { name: 'Fake fine link', exact: true }).click();
  await page.waitForTimeout(250);
  await cap(page, 'home_form_filled', page.locator('form > div'), 4);
  const ib = await page.locator('form input').first().boundingBox();
  manifest.home_input_text = { x: ib.x, y: ib.y, w: ib.width, h: ib.height };
  manifest.home_check_button = await page.locator('form button[type="submit"]').first().boundingBox();

  // ---------------------------------------------------------------- result (English)
  await page.locator('button[type="submit"]').first().click();
  await page.getByText('Evidence').first().waitFor({ timeout: 90000 });
  await page.waitForTimeout(900);
  await page.evaluate(() => {
    for (const el of document.querySelectorAll('span,small,em')) if (/^paused$/i.test(el.textContent.trim())) el.style.display = 'none';
  });
  await cap(page, 'res_h1', page.locator('main h1'), 6);
  await cap(page, 'res_form', page.locator('form > div'), 4);
  for (let i = 0; i < 4; i++) await cap(page, `res_tab_${i}`, page.locator('section button.group').nth(i));
  await cap(page, 'res_verdict', page.locator('section.rounded-box'));
  // the same band with the big number hidden, so the number can count up as live text
  const score = await page.evaluateHandle(() => {
    let best = null;
    let size = 0;
    for (const el of document.querySelectorAll('section.rounded-box *')) {
      if (/^\d+\s*%$/.test(el.textContent.trim())) {
        const s = parseFloat(getComputedStyle(el).fontSize);
        if (s >= size) {
          size = s;
          best = el;
        }
      }
    }
    return best;
  });
  if (score.asElement()) {
    const sb = await score.asElement().boundingBox();
    const sy = await page.evaluate(() => scrollY);
    const st = await score.asElement().evaluate((el) => {
      const c = getComputedStyle(el);
      return { fontSize: parseFloat(c.fontSize), fontFamily: c.fontFamily, fontWeight: c.fontWeight, color: c.color, text: el.textContent.trim() };
    });
    manifest.res_score = { x: sb.x, y: sb.y + sy, w: sb.width, h: sb.height, ...st };
    await score.asElement().evaluate((el) => (el.style.visibility = 'hidden'));
    await cap(page, 'res_verdict_noscore', page.locator('section.rounded-box'));
    await score.asElement().evaluate((el) => (el.style.visibility = ''));
    console.log('score', JSON.stringify(manifest.res_score));
  } else console.log('FAIL score element not found');
  await cap(page, 'res_notice', page.locator('main p.w-fit'));
  await cap(page, 'res_evidence_title', page.locator('main h2').nth(0), 4);
  const rows = page.locator('main ul > li');
  const n = await rows.count();
  for (let i = 0; i < Math.min(n, 4); i++) await cap(page, `res_row_${i}`, rows.nth(i));
  await cap(page, 'res_link_title', page.locator('main h2').nth(1), 4);
  await cap(page, 'res_link_box', page.locator('div.box').filter({ hasText: 'Copy link' }));
  await cap(page, 'res_btn_report_pdf', page.getByRole('button', { name: /Download evidence report/ }));
  await cap(page, 'res_btn_police', page.getByRole('button', { name: /Report to Abu Dhabi Police/ }));

  // the Aman panel that opens from the police button
  const before = await page.evaluate(() => document.querySelectorAll('main *').length);
  await page.getByRole('button', { name: /Report to Abu Dhabi Police/ }).click();
  await page.waitForTimeout(700);
  const panel = await page.evaluateHandle(() => {
    const hits = [...document.querySelectorAll('body *')].filter((el) => /800\s?2626/.test(el.textContent) && parseFloat(getComputedStyle(el).borderTopLeftRadius) >= 12);
    return hits[hits.length - 1] ?? null;
  });
  if (panel.asElement()) {
    await panel.asElement().scrollIntoViewIfNeeded();
    const pb = await panel.asElement().boundingBox();
    const sy = await page.evaluate(() => scrollY);
    await panel.asElement().screenshot({ path: `${OUT}/res_aman.png`, omitBackground: true });
    manifest.res_aman = { x: pb.x, y: pb.y + sy, w: pb.width, h: pb.height };
    console.log('ok   res_aman', JSON.stringify(manifest.res_aman), 'elements before', before);
  } else console.log('FAIL aman panel not found');

  // ---------------------------------------------------------------- result (Arabic)
  await page.evaluate(() => scrollTo(0, 0));
  await page.locator('header button').filter({ hasText: 'العربية' }).first().click();
  await page.waitForTimeout(900);
  await page.evaluate(() => {
    for (const el of document.querySelectorAll('span,small,em')) if (/^(paused|متوقف.*)$/i.test(el.textContent.trim())) el.style.display = 'none';
  });
  await cap(page, 'ar_header', page.locator('header'));
  await cap(page, 'ar_verdict', page.locator('section.rounded-box'));
  await cap(page, 'ar_notice', page.locator('main p.w-fit'));
  const arRows = page.locator('main ul > li');
  for (let i = 0; i < Math.min(await arRows.count(), 3); i++) await cap(page, `ar_row_${i}`, arRows.nth(i));
  await cap(page, 'ar_form', page.locator('form > div'), 4);
  await ctx.close();
}

for (const k of Object.keys(manifest)) manifest[k] = round(manifest[k]);
fs.writeFileSync(`${OUT}/manifest.json`, JSON.stringify({ scale: SCALE, page: { w: 1280 }, pieces: manifest }, null, 1));
await browser.close();
console.log('pieces:', Object.keys(manifest).length);
