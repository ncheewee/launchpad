#!/usr/bin/env node
/*
 * Captures an 800x500 thumbnail of each app's live URL into screenshots/thumb/<slug>.jpg.
 * Used by the GitHub Action. Run modes:
 *   node screenshots.js                 -> (re)capture every app
 *   node screenshots.js --missing-only  -> only capture apps with no thumbnail yet
 * Requires: playwright, sharp  (installed in CI).
 */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const sharp = require('sharp');
const { APPS } = require('./build.js');

const MISSING_ONLY = process.argv.includes('--missing-only');
const OUT = path.join(__dirname, 'screenshots', 'thumb');
fs.mkdirSync(OUT, { recursive: true });

// Per-app "get past the login/empty screen" recipes, so the captured thumbnail
// shows a real in-app view instead of a sign-in form. Each runs after the page
// loads and before the screenshot. Keep them defensive — a failed recipe just
// falls back to whatever is on screen.
const RECIPES = {
  // GPM: the login validates password === selected role value (it even tells you
  // "use the role name as the starter password"). Pick the first role and submit.
  'gpm-asset-performance-pane': async (page) => {
    await page.waitForSelector('#loginUser option', { timeout: 10000 }).catch(() => {});
    await page.evaluate(() => {
      const sel = document.querySelector('#loginUser');
      if (!sel || !sel.options.length) return;
      const role = (sel.value || sel.options[0].value);
      sel.value = role;
      const pw = document.querySelector('#loginPassword'); if (pw) pw.value = role;
      const f = document.querySelector('#loginForm');
      if (f) (f.requestSubmit ? f.requestSubmit() : f.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
    });
    await page.waitForTimeout(1800);
  },
  // MeterIQ: ships demo users (Admin/111111). Drive its own login: select the
  // user, key the PIN via lpk(), then doLogin() to reach the populated dashboard.
  'meteriq': async (page) => {
    await page.waitForTimeout(800);
    await page.evaluate(() => {
      try {
        if (typeof selectLoginUser === 'function') selectLoginUser('Admin');
        if (typeof lpk === 'function') { for (const d of '111111') lpk(d); }
        if (typeof doLogin === 'function') doLogin();
      } catch (e) {}
    });
    await page.waitForTimeout(2000);
  },
};

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1200, height: 750 }, deviceScaleFactor: 2 });
  let shot = 0, skipped = 0, failed = 0;
  for (const a of APPS) {
    const dest = path.join(OUT, a.slug + '.jpg');
    if (MISSING_ONLY && fs.existsSync(dest)) { console.log('skip (exists):', a.slug); skipped++; continue; }
    const page = await ctx.newPage();
    try {
      await page.goto(a.url, { waitUntil: 'load', timeout: 45000 });
      await page.waitForTimeout(3000); // let charts / fonts settle
      if (RECIPES[a.slug]) {
        try { await RECIPES[a.slug](page); console.log('  · ran login recipe:', a.slug); }
        catch (e) { console.warn('  · recipe failed:', a.slug, '-', e.message); }
      }
      const grab = async (file) => {
        const buf = await page.screenshot(); // current viewport, 2400x1500 px at 2x DPI
        await sharp(buf).resize(800, 500, { fit: 'cover', position: 'top' }).jpeg({ quality: 80 }).toFile(path.join(OUT, file));
      };
      // frame 1 = top of page (also the card/featured hero)
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(250);
      await grab(a.slug + '.jpg');
      // extra carousel frames, only if the page is tall enough to have more content
      const { sh, vh } = await page.evaluate(() => ({ sh: document.body.scrollHeight, vh: window.innerHeight }));
      let frame = 2;
      for (const mult of [0.92, 1.84]) {
        if (sh > (mult + 0.85) * vh) {
          await page.evaluate(y => window.scrollTo(0, y), Math.round(mult * vh));
          await page.waitForTimeout(800);
          await grab(`${a.slug}-${frame}.jpg`);
          frame++;
        }
      }
      // remove any stale extra frames from a previous (taller) capture
      for (let k = frame; k <= 3; k++) {
        const f = path.join(OUT, `${a.slug}-${k}.jpg`);
        if (fs.existsSync(f)) fs.unlinkSync(f);
      }
      console.log(`shot: ${a.slug} (${frame - 1} frame${frame - 1 > 1 ? 's' : ''})`);
      shot++;
    } catch (e) {
      console.warn('FAILED:', a.slug, '-', e.message);
      failed++;
    } finally {
      await page.close();
    }
  }
  await browser.close();
  console.log(`\nDone. captured=${shot} skipped=${skipped} failed=${failed}`);
})();
