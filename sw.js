/* ========== Service Worker - نظام تقييم الموظفين ========== */
const CACHE_NAME = 'eval-app-v1';
const urlsToCache = [
  '/EVALUATION-APP/',
  '/EVALUATION-APP/index.html',
  '/EVALUATION-APP/app_icon_v2_72.png',
  '/EVALUATION-APP/app_icon_v2_192.png',
  '/EVALUATION-APP/app_icon_v2_512.png',
  '/EVALUATION-APP/manifest.json'
];

// تثبيت: حفظ الملفات في الذاكرة المؤقتة
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .catch((err) => {
        console.warn('[SW] Cache failed:', err);
      })
  );
  self.skipWaiting();
});

// تفعيل: حذف الذاكرات القديمة
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  self.clients.claim();
});

// جلب: استراتيجية Network First مع fallback للـ cache
self.addEventListener('fetch', (event) => {
  // تجاهل طلبات Firebase وغيرها من الـ APIs
  if (event.request.url.includes('firebase') || 
      event.request.url.includes('google') ||
      event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // نسخة للـ cache
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(() => {
        // fallback للـ cache إذا لا يوجد إنترنت
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // إذا لا يوجد في cache، عرض صفحة offline
          if (event.request.mode === 'navigate') {
            return caches.match('/EVALUATION-APP/index.html');
          }
        });
      })
  );
});

// إشعارات push (للاستخدام المستقبلي)
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
