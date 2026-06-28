#!/usr/bin/env node
/*
 * Captures a 480x300 thumbnail of each app's live URL into screenshots/thumb/<slug>.jpg.
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

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1200, height: 750 }, deviceScaleFactor: 1 });
  let shot = 0, skipped = 0, failed = 0;
  for (const a of APPS) {
    const dest = path.join(OUT, a.slug + '.jpg');
    if (MISSING_ONLY && fs.existsSync(dest)) { console.log('skip (exists):', a.slug); skipped++; continue; }
    const page = await ctx.newPage();
    try {
      await page.goto(a.url, { waitUntil: 'load', timeout: 45000 });
      await page.waitForTimeout(3000); // let charts / fonts settle
      const buf = await page.screenshot({ clip: { x: 0, y: 0, width: 1200, height: 750 } });
      await sharp(buf).resize(480, 300, { fit: 'cover', position: 'top' }).jpeg({ quality: 82 }).toFile(dest);
      console.log('shot:', a.slug);
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
