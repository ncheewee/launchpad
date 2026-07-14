#!/usr/bin/env node
/*
 * Launchpad auto-add + archive.
 *
 *   node discover.js --apply           Scan the owner's GitHub Pages repos and append any
 *                                       not yet listed to build.js APPS (category "New").
 *   node discover.js --archive <slug>  Remove <slug> from APPS, add it to archive.json,
 *                                       and delete its screenshots — so it is NOT auto-added again.
 *
 * archive.json is the block-list: tooling, duplicate repos, and apps you've removed.
 * Auto-added apps land in the "New" category with the repo description as their blurb —
 * refine category / icon / name / desc by editing the entry in build.js afterwards.
 */
const fs = require('fs');
const path = require('path');
const { APPS } = require('./build.js');

const OWNER = 'ncheewee';
const BUILD = path.join(__dirname, 'build.js');
const OVERRIDES = path.join(__dirname, 'overrides.json');
const THUMBS = path.join(__dirname, 'screenshots', 'thumb');

function readOverrides() {
  try { return JSON.parse(fs.readFileSync(OVERRIDES, 'utf8')); } catch { return { archived: [], category: {} }; }
}
function writeOverrides(ov) {
  ov.archived = [...new Set((ov.archived || []).map(s => s.toLowerCase()))].sort();
  fs.writeFileSync(OVERRIDES, JSON.stringify(ov, null, 2) + '\n');
}
function readArchive() { return readOverrides().archived || []; }
function jsStr(s) { return String(s || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\s+/g, ' ').trim(); }
function prettyName(slug) { return slug.replace(/[-_]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase()); }
function entryLine(a) {
  return `  { slug:'${a.slug}', name:'${jsStr(a.name)}', cat:'${a.cat}', icon:'${a.icon}', url:'${a.url}', shipped:'${a.shipped}', desc:'${jsStr(a.desc)}' },`;
}

async function gh(p) {
  const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'launchpad-discover' };
  if (process.env.GITHUB_TOKEN) headers.Authorization = 'Bearer ' + process.env.GITHUB_TOKEN;
  const res = await fetch('https://api.github.com' + p, { headers });
  if (!res.ok) throw new Error(`GET ${p} -> ${res.status} ${await res.text()}`);
  return res.json();
}

async function apply() {
  const listed = new Set(APPS.map(a => a.slug.toLowerCase()));
  const archived = new Set(readArchive().map(s => s.toLowerCase()));
  const repos = [];
  for (let page = 1; page <= 5; page++) {
    const batch = await gh(`/users/${OWNER}/repos?per_page=100&page=${page}&sort=created&direction=desc`);
    repos.push(...batch);
    if (batch.length < 100) break;
  }
  const fresh = repos.filter(r =>
    r.has_pages &&
    !listed.has(r.name.toLowerCase()) &&
    !archived.has(r.name.toLowerCase())
  );
  if (!fresh.length) { console.log('Auto-add: nothing new to add.'); return; }

  let src = fs.readFileSync(BUILD, 'utf8');
  const anchor = src.split('\n').find(l => /slug:'launchpad'/.test(l)); // keep Launchpad last
  if (!anchor) throw new Error('Could not find the launchpad anchor line in build.js');

  const lines = fresh.map(r => entryLine({
    slug: r.name.toLowerCase(),
    name: prettyName(r.name),
    cat: 'New',
    icon: 'sparkles',
    url: (r.homepage && /github\.io/.test(r.homepage)) ? r.homepage : `https://${OWNER}.github.io/${r.name}/`,
    shipped: (r.created_at || '').slice(0, 10),
    desc: r.description || '',
  }));
  src = src.replace(anchor, lines.join('\n') + '\n' + anchor);
  fs.writeFileSync(BUILD, src);
  console.log('Auto-added (category "New"):', fresh.map(r => r.name).join(', '));
}

// Archive = add to overrides.archived. The build drops archived apps from the
// site and discover won't auto-add them again. Reversible (un-archive by removing
// the slug from overrides.json). We keep the APPS entry + screenshots so it can
// come straight back.
function archiveSlug(raw) {
  const slug = raw.toLowerCase();
  const ov = readOverrides();
  ov.archived = ov.archived || [];
  ov.archived.push(slug);
  writeOverrides(ov);
  console.log(`Archived '${slug}': added to overrides.json — it will drop off the site and won't auto-add again.`);
}

const mode = process.argv[2];
if (mode === '--archive') {
  const slug = (process.argv[3] || '').trim();
  if (!slug) { console.error('usage: node discover.js --archive <slug>'); process.exit(1); }
  archiveSlug(slug);
} else if (mode === '--apply' || !mode) {
  apply().catch(e => { console.error(e.message); process.exit(1); });
} else {
  console.error('unknown mode. use --apply or --archive <slug>'); process.exit(1);
}
