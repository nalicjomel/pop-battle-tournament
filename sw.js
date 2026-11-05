// Bump this version every time you update the game so phones fetch the new files.
const CACHE = 'pop-tournament-v4';
const CORE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', e => {
  // cache:'reload' = laging kunin ang bagong file mula sa GitHub, hindi sa lumang browser cache
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(CORE.map(u => fetch(new Request(u, { cache: 'reload' })).then(r => c.put(u, r))))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);

  // Google Fonts: cache on first load so the font works offline later
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(
      caches.open(CACHE).then(async c => {
        const hit = await c.match(e.request);
        const net = fetch(e.request).then(r => { c.put(e.request, r.clone()); return r; }).catch(() => hit);
        return hit || net;
      })
    );
    return;
  }

  if (url.origin !== location.origin) return;

  // Own files: network first (so updates show up), fall back to cache offline
  e.respondWith(
    fetch(e.request, { cache: 'no-cache' })
      .then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return r; })
      .catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
  );
});
