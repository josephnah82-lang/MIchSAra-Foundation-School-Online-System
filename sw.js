// MICHSARA Foundation School — offline app-shell cache.
// This makes the app itself (the page, styles, and code) open with no
// internet connection. It never touches the school-data sync, which is
// handled separately inside index.html.

const CACHE = 'michsara-shell-v1';
const SHELL = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Never intercept the school-data sync calls — those must always hit the
  // real network so the app's own online/offline handling can work.
  if (url.hostname.indexOf('script.google.com') !== -1) return;

  // Only handle simple GET requests for the app shell / fonts.
  if (e.request.method !== 'GET') return;

  e.respondWith(
    caches.match(e.request).then((cached) => {
      const network = fetch(e.request)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(e.request, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
