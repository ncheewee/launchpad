#!/usr/bin/env node
/*
 * Auto-discovery: finds GitHub Pages repos under the owner that are NOT yet in
 * the Launchpad manifest (build.js APPS) and opens/updates a single tracking
 * issue listing them. Runs weekly via .github/workflows/discover.yml.
 *
 * This does NOT add apps automatically — category, icon and blurb are human
 * choices. It just makes sure a new repo never goes silently missing again.
 */
const { APPS } = require('./build.js');

const OWNER = 'ncheewee';
const REPO = 'launchpad';
const TOKEN = process.env.GITHUB_TOKEN;
const ISSUE_TITLE = '🔎 Unlisted app repos (add to Launchpad?)';

// Repos to never nag about: tooling, backends, dupes, and things deliberately
// left out. Edit this list as your repo collection grows.
const IGNORE = new Set([
  'launchpad',
  'deployer',            // MetrIQ deploy tooling, not an app
  'metriq-v16',          // dupe of MeterIQ
  'metriq',              // dupe of MeterIQ
  'ippt-tracker-gist',   // variant of ippt-tracker
  'initiatives-report',  // intentionally not listed
].map(s => s.toLowerCase()));

async function gh(path, opts = {}) {
  const res = await fetch('https://api.github.com' + path, {
    headers: {
      Authorization: 'Bearer ' + TOKEN,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'launchpad-discover',
    },
    ...opts,
  });
  if (!res.ok) throw new Error(`${opts.method || 'GET'} ${path} -> ${res.status} ${await res.text()}`);
  return res.status === 204 ? null : res.json();
}

(async () => {
  const listed = new Set(APPS.map(a => a.slug.toLowerCase()));

  // all public repos with Pages enabled
  const repos = [];
  for (let page = 1; page <= 5; page++) {
    const batch = await gh(`/users/${OWNER}/repos?per_page=100&page=${page}&sort=created&direction=desc`);
    repos.push(...batch);
    if (batch.length < 100) break;
  }
  const missing = repos.filter(r =>
    r.has_pages &&
    !listed.has(r.name.toLowerCase()) &&
    !IGNORE.has(r.name.toLowerCase())
  );

  // find an existing tracking issue
  const issues = await gh(`/repos/${OWNER}/${REPO}/issues?state=all&per_page=100`);
  const existing = issues.find(i => i.title === ISSUE_TITLE && !i.pull_request);

  if (!missing.length) {
    console.log('No unlisted Pages repos. 🎉');
    if (existing && existing.state === 'open') {
      await gh(`/repos/${OWNER}/${REPO}/issues/${existing.number}`, {
        method: 'PATCH', body: JSON.stringify({ state: 'closed' }),
      });
      console.log('Closed stale tracking issue #' + existing.number);
    }
    return;
  }

  const rows = missing.map(r =>
    `- **${r.name}** — ${r.description || '_(no description)_'}\n  ` +
    `<https://${OWNER}.github.io/${r.name}/> · created ${r.created_at.slice(0, 10)}`
  ).join('\n');

  const body =
    `These GitHub Pages repos aren't in Launchpad's \`build.js\` \`APPS\` yet:\n\n${rows}\n\n` +
    `---\n**To add one:** append an entry to \`APPS\` in \`build.js\` ` +
    `(\`slug, name, cat, icon, url, shipped, desc\`), then push — the build Action screenshots it and rebuilds.\n` +
    `**To silence one:** add its slug to the \`IGNORE\` list in \`discover.js\`.\n\n` +
    `_Auto-generated ${new Date().toISOString().slice(0, 10)} by discover.js._`;

  if (existing) {
    await gh(`/repos/${OWNER}/${REPO}/issues/${existing.number}`, {
      method: 'PATCH', body: JSON.stringify({ body, state: 'open' }),
    });
    console.log(`Updated tracking issue #${existing.number} (${missing.length} unlisted).`);
  } else {
    const created = await gh(`/repos/${OWNER}/${REPO}/issues`, {
      method: 'POST', body: JSON.stringify({ title: ISSUE_TITLE, body }),
    });
    console.log(`Opened tracking issue #${created.number} (${missing.length} unlisted).`);
  }
})().catch(e => { console.error(e.message); process.exit(1); });
