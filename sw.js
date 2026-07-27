/* ========== Service Worker - نظام تقييم الموظفين ========== */
const CACHE_NAME = 'eval-app-v2';
const urlsToCache = [
  './',
  './index.html',
  './offline.html',
  './manifest.json',
  './app_icon_v2_72.png',
  './app_icon_v2_192.png',
  './app_icon_v2_512.png'
];

self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => { console.log('[SW] Caching app shell'); return cache.addAll(urlsToCache); })
      .catch((err) => { console.warn('[SW] Cache failed:', err); })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(cacheNames.filter((name) => name !== CACHE_NAME).map((name) => {
        console.log('[SW] Deleting old cache:', name);
        return caches.delete(name);
      }));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('firebase') || event.request.url.includes('google') ||
      event.request.url.includes('gstatic') || event.request.url.includes('cdnjs') ||
      event.request.method !== 'GET') { return; }
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => { cache.put(event.request, responseClone); });
        }
        return networkResponse;
      }).catch(() => { return cachedResponse; });
      return cachedResponse || fetchPromise;
    }).catch(() => {
      if (event.request.mode === 'navigate') { return caches.match('./offline.html'); }
    })
  );
});

self.addEventListener('push', (event) => {
  const title = 'نظام تقييم الموظفين';
  const options = {
    body: event.data ? event.data.text() : 'تذكير بتقييم الموظفين!',
    icon: './app_icon_v2_192.png',
    badge: './app_icon_v2_72.png',
    dir: 'rtl', lang: 'ar'
  };
  event.waitUntil(self.registration.showNotification(title, options));
});
