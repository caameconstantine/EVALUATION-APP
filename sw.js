/* ========== Service Worker v2 - نظام تقييم الموظفين ========== */
const CACHE_NAME = 'eval-app-v2';
const urlsToCache = [
  '/EVALUATION-APP/',
  '/EVALUATION-APP/index.html',
  '/EVALUATION-APP/manifest.json',
  '/EVALUATION-APP/sw.js',
  '/EVALUATION-APP/offline.html',
  '/EVALUATION-APP/app_icon_v2_72.png',
  '/EVALUATION-APP/app_icon_v2_192.png',
  '/EVALUATION-APP/app_icon_v2_512.png'
];

// تثبيت: حفظ الملفات في الكاش
self.addEventListener('install', (event) => {
  console.log('[SW v2] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
      .catch((err) => console.warn('[SW v2] Cache failed:', err))
  );
  self.skipWaiting();
});

// تفعيل: حذف الكاش القديم
self.addEventListener('activate', (event) => {
  console.log('[SW v2] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW v2] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  self.clients.claim();
});

// جلب: استراتيجية Cache First مع fallback
self.addEventListener('fetch', (event) => {
  // تجاهل طلبات Firebase وغيرها
  if (event.request.url.includes('firebase') || 
      event.request.url.includes('google') ||
      event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // إذا موجود في الكاش، ارجعه مباشرة
      if (cachedResponse) {
        return cachedResponse;
      }
      // إذا لا يوجد، حاول من الإنترنت
      return fetch(event.request).then((response) => {
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });
        return response;
      }).catch(() => {
        // إذا لا يوجد إنترنت ولا كاش
        if (event.request.mode === 'navigate') {
          return caches.match('/EVALUATION-APP/index.html');
        }
      });
    })
  );
});

// إشعارات push
self.addEventListener('push', (event) => {
  const title = 'نظام تقييم الموظفين';
  const options = {
    body: event.data ? event.data.text() : 'تذكير بتقييم الموظفين!',
    icon: '/EVALUATION-APP/app_icon_v2_192.png',
    badge: '/EVALUATION-APP/app_icon_v2_72.png',
    dir: 'rtl',
    lang: 'ar'
  };
  event.waitUntil(self.registration.showNotification(title, options));
});
