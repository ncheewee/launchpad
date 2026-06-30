#!/usr/bin/env node
/*
 * Launchpad build script.
 * Holds the app data (APPS) and category tokens (CATS), reads template.html,
 * embeds each app's screenshot thumbnail as a base64 data URI, substitutes the
 * "__DATA_JSON__" placeholder, and writes index.html.
 *
 * To add app #N:
 *   1. Add one entry to APPS below (set `shipped` to the YYYY-MM-DD ship date).
 *   2. git push.  The GitHub Action screenshots the live URL, rebuilds, and commits.
 * Locally you can also just run:  node build.js   (uses whatever screenshots exist)
 *
 * `shipped` is a date, not a day count — build.js computes "Xd ago" at build time,
 * so the daily cron keeps every label correct without you touching anything.
 */
const fs = require('fs');
const path = require('path');

// ---- category color tokens (kept in sync with template.html CSS vars) ----
const CATS = {
  Personal:   { label: 'Personal',          accent: '#7c6cff' },
  Fun:        { label: 'Fun & experiments',  accent: '#f5a524' },
  Work:       { label: 'Work',               accent: '#3b82f6' },
};

// ---- the data: one entry per shipped app ----
const APPS = [
  { slug:'splitlah',                  name:'SplitLah',                  cat:'Personal',   icon:'receipt',   url:'https://ncheewee.github.io/splitlah/',                   shipped:'2026-06-13', desc:'Split trip expenses with friends without the group-chat math. Add a trip, log who paid for what, and it settles up who owes who.' },
  { slug:'second-brain-manager',      name:'Second Brain Manager',      cat:'Personal',   icon:'idea',      url:'https://ncheewee.github.io/second-brain-manager/',       shipped:'2026-06-10', desc:'A frontend for browsing and editing entries in the personal Second Brain knowledge base.' },
  { slug:'sg-ev-tco-calculator',      name:'SG EV TCO Calculator',      cat:'Personal',   icon:'bolt',      url:'https://ncheewee.github.io/sg-ev-tco-calculator/',       shipped:'2026-06-22', desc:'Total cost of ownership calculator for EVs in Singapore — COE, road tax, and charging costs included.' },
  { slug:'sg-ev-decision-lab',        name:'SG EV Decision Lab',        cat:'Personal',   icon:'car',       url:'https://ncheewee.github.io/sg-ev-decision-lab/',         shipped:'2026-06-28', desc:'Singapore EV comparison, dealer checklist, and 10-year decision lab for the buy-vs-renew call.' },
  { slug:'inspectpro',                name:'InspectPro',                cat:'Work',       icon:'clipboard', url:'https://ncheewee.github.io/inspectPro/',                 shipped:'2026-06-13', desc:'Manage property inspection checklists end to end, from scheduling a walkthrough to filing the final report.' },
  { slug:'meteriq',                   name:'MeterIQ',                   cat:'Work',       icon:'gauge',     url:'https://ncheewee.github.io/MeterIQ/',                    shipped:'2026-05-23', desc:'Smart utility meter reader — capture a meter photo and log the reading without manual entry.' },
  { slug:'wc2026-predictor',          name:'WC2026 Prediction Net',     cat:'Fun',        icon:'ball',      url:'https://ncheewee.github.io/wc2026-predictor/',           shipped:'2026-06-28', desc:"World Cup 2026 predictor running Elo ratings through a Monte Carlo simulation to forecast each team's title odds." },
  { slug:'oracle-26',                 name:'Oracle 26',                 cat:'Fun',        icon:'trend',     url:'https://ncheewee.github.io/oracle-26/',                  shipped:'2026-06-28', desc:'A data-backed World Cup intelligence dashboard — live tournament odds, model readiness, and match-by-match forecasts.' },
  { slug:'enigma-print',              name:'Enigma Print',              cat:'Fun',        icon:'box',       url:'https://ncheewee.github.io/enigma-print/',               shipped:'2026-06-07', desc:'Companion mobile dashboard for a 3D-printed puzzle box.' },
  { slug:'lift-report',               name:'Lift Performance Reporting',cat:'Work',       icon:'building',  url:'https://ncheewee.github.io/lift-report/',                shipped:'2026-06-27', desc:'Monthly lift breakdown and mantrap reporting across the portfolio, with trend charts and AI-generated insights.' },
  { slug:'gpm-asset-performance-pane',name:'GPM Asset Performance Pane',cat:'Work',       icon:'tower',     url:'https://ncheewee.github.io/gpm-asset-performance-pane/',  shipped:'2026-06-08', desc:'Asset performance dashboard for the GPM portfolio.' },
  { slug:'japan-team-pulse-survey',   name:'Japan Team Pulse Survey',   cat:'Work',       icon:'message',   url:'https://ncheewee.github.io/japan-team-pulse-survey/',     shipped:'2026-04-04', desc:'Bilingual EN/JP pulse survey tool for the Japan team.' },
  { slug:'launchpad',                 name:'Launchpad',                 cat:'Personal',   icon:'rocket',    url:'https://ncheewee.github.io/launchpad/',                  shipped:'2026-06-28', desc:"The personal app store you're looking at right now — a living index of all 100 app ideas, one shipped tile at a time." },
];

// ---- helpers ----
function daysSince(shipped) {
  const ms = Date.now() - Date.parse(shipped + 'T00:00:00Z');
  return Math.max(0, Math.floor(ms / 86400000));
}
function relativeDays(days) {
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  return days + 'd ago';
}
function fileToB64(p) {
  const ext = p.toLowerCase().endsWith('.png') ? 'png' : 'jpeg';
  return 'data:image/' + ext + ';base64,' + fs.readFileSync(p).toString('base64');
}
// Card/featured hero (base64-inlined). A custom cover (screenshots/custom/<file>)
// overrides the auto screenshot — use it for apps whose live page is a boring
// login/empty screen.
function heroFor(a) {
  if (a.cover) {
    const c = path.join(__dirname, 'screenshots', 'custom', a.cover);
    if (fs.existsSync(c)) return fileToB64(c);
    console.warn('  ! cover declared but missing for ' + a.slug + ': ' + a.cover);
  }
  const t = path.join(__dirname, 'screenshots', 'thumb', a.slug + '.jpg');
  if (fs.existsSync(t)) return fileToB64(t);
  console.warn('  ! no hero image yet for ' + a.slug + ' (the Action will capture it)');
  return '';
}
// Modal carousel images, as relative URLs (NOT base64 — keeps index.html small;
// loaded on demand when the preview opens). Order: cover, hero, extra frames.
function galleryFor(a) {
  const g = [];
  const push = rel => { if (fs.existsSync(path.join(__dirname, rel))) g.push(rel); };
  if (a.cover) push('screenshots/custom/' + a.cover);
  push('screenshots/thumb/' + a.slug + '.jpg');
  push('screenshots/thumb/' + a.slug + '-2.jpg');
  push('screenshots/thumb/' + a.slug + '-3.jpg');
  return g;
}

function build() {
  const data = APPS.map(a => {
    const days = daysSince(a.shipped);
    return { slug:a.slug, name:a.name, cat:a.cat, icon:a.icon, url:a.url,
             desc:a.desc, days, last:relativeDays(days),
             shot:heroFor(a), gallery:galleryFor(a) };
  });
  const template = fs.readFileSync(path.join(__dirname, 'template.html'), 'utf8');
  const html = template.replace('__DATA_JSON__', JSON.stringify(data));
  fs.writeFileSync(path.join(__dirname, 'index.html'), html);
  console.log(`Built index.html — ${data.length} apps, ${Math.round(data.length)}% of 100.`);
}

// Only build when run directly (so screenshots.js can require this for the app list
// without triggering a build).
if (require.main === module) build();

module.exports = { APPS, CATS, daysSince, relativeDays };
