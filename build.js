#!/usr/bin/env node
/*
 * Launchpad build script.
 * Holds the app data (APPS) and category tokens (CATS), reads template.html,
 * embeds each app's screenshot thumbnail as a base64 data URI, substitutes the
 * "__DATA_JSON__" placeholder, and writes index.html.
 *
 * To add app #13..100: drop a 480x300 jpg at screenshots/thumb/<slug>.jpg,
 * add one entry to APPS below, then run:  node build.js
 */
const fs = require('fs');
const path = require('path');

// ---- category color tokens (kept in sync with template.html CSS vars) ----
const CATS = {
  Personal:   { label: 'Personal',          accent: '#7c6cff' },
  PropTechIP: { label: 'PropTech IP',        accent: '#16b8a6' },
  Fun:        { label: 'Fun & experiments',  accent: '#f5a524' },
  Work:       { label: 'Work',               accent: '#3b82f6' },
};

// ---- the data: one entry per shipped app ----
// days = days since shipped (used to pick the "Latest ship" hero + the "shipped X" label)
const APPS = [
  { slug:'splitlah',                  name:'SplitLah',                  cat:'Personal',   icon:'receipt',   url:'https://ncheewee.github.io/splitlah/',                   days:15, desc:'Split trip expenses with friends without the group-chat math. Add a trip, log who paid for what, and it settles up who owes who.' },
  { slug:'second-brain-manager',      name:'Second Brain Manager',      cat:'Personal',   icon:'idea',      url:'https://ncheewee.github.io/second-brain-manager/',       days:18, desc:'A frontend for browsing and editing entries in the personal Second Brain knowledge base.' },
  { slug:'sg-ev-tco-calculator',      name:'SG EV TCO Calculator',      cat:'Personal',   icon:'bolt',      url:'https://ncheewee.github.io/sg-ev-tco-calculator/',       days:6,  desc:'Total cost of ownership calculator for EVs in Singapore — COE, road tax, and charging costs included.' },
  { slug:'inspectpro',                name:'InspectPro',                cat:'PropTechIP', icon:'clipboard', url:'https://ncheewee.github.io/inspectPro/',                 days:15, desc:'Manage property inspection checklists end to end, from scheduling a walkthrough to filing the final report.' },
  { slug:'meteriq',                   name:'MeterIQ',                   cat:'PropTechIP', icon:'gauge',     url:'https://ncheewee.github.io/MeterIQ/',                    days:36, desc:'Smart utility meter reader — capture a meter photo and log the reading without manual entry.' },
  { slug:'wc2026-predictor',          name:'WC2026 Prediction Net',     cat:'Fun',        icon:'ball',      url:'https://ncheewee.github.io/wc2026-predictor/',           days:0,  desc:"World Cup 2026 predictor running Elo ratings through a Monte Carlo simulation to forecast each team's title odds." },
  { slug:'oracle-26',                 name:'Oracle 26',                 cat:'Fun',        icon:'trend',     url:'https://ncheewee.github.io/oracle-26/',                  days:0,  desc:'A data-backed World Cup intelligence dashboard — live tournament odds, model readiness, and match-by-match forecasts.' },
  { slug:'enigma-print',              name:'Enigma Print',              cat:'Fun',        icon:'box',       url:'https://ncheewee.github.io/enigma-print/',               days:21, desc:'Companion mobile dashboard for a 3D-printed puzzle box.' },
  { slug:'lift-report',               name:'Lift Performance Reporting',cat:'Work',       icon:'building',  url:'https://ncheewee.github.io/lift-report/',                days:1,  desc:'Monthly lift breakdown and mantrap reporting across the portfolio, with trend charts and AI-generated insights.' },
  { slug:'gpm-asset-performance-pane',name:'GPM Asset Performance Pane',cat:'Work',       icon:'tower',     url:'https://ncheewee.github.io/gpm-asset-performance-pane/',  days:20, desc:'Asset performance dashboard for the GPM portfolio.' },
  { slug:'japan-team-pulse-survey',   name:'Japan Team Pulse Survey',   cat:'Work',       icon:'message',   url:'https://ncheewee.github.io/japan-team-pulse-survey/',     days:85, desc:'Bilingual EN/JP pulse survey tool for the Japan team.' },
  { slug:'launchpad',                 name:'Launchpad',                 cat:'Personal',   icon:'rocket',    url:'https://ncheewee.github.io/launchpad/',                  days:0,  desc:"The personal app store you're looking at right now — a living index of all 100 app ideas, one shipped tile at a time." },
];

// ---- helpers ----
function relativeDays(days) {
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  return days + 'd ago';
}
function embedShot(slug) {
  const p = path.join(__dirname, 'screenshots', 'thumb', slug + '.jpg');
  if (!fs.existsSync(p)) {
    console.warn('  ! missing screenshot for ' + slug + ' (' + p + ')');
    return '';
  }
  return 'data:image/jpeg;base64,' + fs.readFileSync(p).toString('base64');
}

// ---- build ----
const data = APPS.map(a => ({
  slug: a.slug, name: a.name, cat: a.cat, icon: a.icon, url: a.url,
  desc: a.desc, days: a.days, last: relativeDays(a.days),
  shot: embedShot(a.slug),
}));

const template = fs.readFileSync(path.join(__dirname, 'template.html'), 'utf8');
const html = template.replace('__DATA_JSON__', JSON.stringify(data));

fs.writeFileSync(path.join(__dirname, 'index.html'), html);
console.log(`Built index.html — ${data.length} apps, ${Math.round(data.length / 100 * 100)}% of 100.`);
module.exports = { APPS, CATS };
