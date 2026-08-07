/* Launchpad service worker.
   index.html is rebuilt daily by CI, so navigations are network-first and
   fall back to the cached copy only when offline. Static assets are
   stale-while-revalidate. Cross-origin requests (the apps themselves,
   raw.githubusercontent, api.github) are never intercepted. */

const VERSION = 'lp-v1';
const SHELL   = VERSION + '-shell';
const ASSETS  = VERSION + '-assets';

const SCOPE = new URL(self.registration.scope).pathname; // "/launchpad/"
const INDEX = SCOPE;

const PRECACHE = [
  SCOPE + 'manifest.webmanifest',
  SCOPE + 'favicon.svg',
  SCOPE + 'icons/icon-192.png',
  SCOPE + 'icons/icon-512.png',
  SCOPE + 'icons/icon-maskable-192.png',
  SCOPE + 'icons/icon-maskable-512.png',
  SCOPE + 'icons/apple-touch-icon.png',
  SCOPE + 'icons/favicon-32.png',
];

const OFFLINE_HTML = `<!doctype html><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Launchpad — offline</title>
<style>body{font-family:-apple-system,system-ui,sans-serif;background:#f5f5f7;color:#1d1d1f;
display:grid;place-items:center;height:100vh;margin:0;text-align:center;padding:24px}
p{color:#86868b;max-width:320px;line-height:1.6}</style>
<div><h1>Offline</h1><p>Launchpad hasn't been opened online on this device yet, so there's nothing cached to show.</p></div>`;

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const assets = await caches.open(ASSETS);
    await Promise.allSettled(PRECACHE.map(u => assets.add(new Request(u, { cache: 'reload' }))));
    // seed the shell so a first-run offline launch still works
    try {
      const res = await fetch(new Request(INDEX, { cache: 'reload' }));
      if (res.ok) (await caches.open(SHELL)).put(INDEX, res.clone());
    } catch (_) {}
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => !k.startsWith(VERSION)).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

async function networkFirst(request) {
  try {
    const res = await fetch(request);
    if (res && res.ok) {
      const cache = await caches.open(SHELL);
      cache.put(INDEX, res.clone());          // normalise: one shell entry
    }
    return res;
  } catch (_) {
    const cached = await caches.match(INDEX);
    return cached || new Response(OFFLINE_HTML, {
      status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(ASSETS);
  const cached = await cache.match(request);
  const network = fetch(request).then(res => {
    if (res && res.ok) cache.put(request, res.clone());
    return res;
  }).catch(() => null);
  return cached || (await network) || Response.error();
}

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;     // other apps, GitHub API
  if (!url.pathname.startsWith(SCOPE)) return;

  // never cache the Manage panel's live reads
  if (url.pathname.endsWith('manage-secret.json')) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
    return;
  }
  event.respondWith(staleWhileRevalidate(request));
});
