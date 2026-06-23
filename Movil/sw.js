const CACHE = 'palmeras-gym-v1';
const PRECACHE = [
  'movil.html',
  'manifest.json',
  'icons/icon.svg',
  'icons/png/android-chrome-192x192.png',
  'icons/png/android-chrome-512x512.png',
  'icons/png/apple-touch-icon-120x120.png',
  'icons/png/apple-touch-icon-152x152.png',
  'icons/png/apple-touch-icon-167x167.png',
  'icons/png/apple-touch-icon-180x180.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
});

self.addEventListener('fetch', (e) => {
  const { request } = e;
  const url = new URL(request.url);

  // CDN resources: cache first, network fallback
  if (url.origin !== self.location.origin) {
    e.respondWith(
      caches.match(request).then((cached) => cached || fetch(request).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((cache) => cache.put(request, copy));
        return res;
      }).catch(() => new Response('', { status: 503 })))
    );
    return;
  }

  // API calls: network only
  if (url.pathname.startsWith('/api/')) {
    e.respondWith(fetch(request).catch(() => new Response(JSON.stringify({ error: 'offline' }), {
      status: 503, headers: { 'Content-Type': 'application/json' }
    })));
    return;
  }

  // App shell: network first, cache fallback
  e.respondWith(
    fetch(request).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((cache) => cache.put(request, copy));
      return res;
    }).catch(() => caches.match(request).then((cached) => cached || new Response('', { status: 404 })))
  );
});
