const CACHE_NAME = 'island-key-info-v1';
const INFO_API_PREFIX = '/api/info-pages';

// Install: pre-cache all info pages
self.addEventListener('install', (event) => {
  event.waitUntil(
    fetch('/api/info-pages')
      .then(res => res.json())
      .then(pages => {
        if (!Array.isArray(pages)) return;
        return caches.open(CACHE_NAME).then(cache => {
          const urls = [
            '/api/info-pages',
            ...pages.map(p => `/api/info-pages/${p.slug}`),
          ];
          return cache.addAll(urls);
        });
      })
      .catch(() => {/* offline at install time — ok */})
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: cache-first for info-pages API, network-first for everything else
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (url.pathname.startsWith(INFO_API_PREFIX)) {
    // Cache-first strategy for info pages
    event.respondWith(
      caches.open(CACHE_NAME).then(cache =>
        cache.match(event.request).then(cached => {
          // Serve from cache, update in background
          const fetchAndCache = fetch(event.request)
            .then(res => {
              if (res.ok) cache.put(event.request, res.clone());
              return res;
            })
            .catch(() => cached); // offline: return cached

          return cached ?? fetchAndCache;
        })
      )
    );
  }
  // For all other requests, use default network behavior
});
