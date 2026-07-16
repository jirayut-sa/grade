const CACHE_NAME = 'kokpradu-score-v1';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './logo.png',
  './chart.min.js'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .catch((err) => console.warn('SW precache failed:', err))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // อย่า cache การเรียก API (Google Apps Script) — ต้องได้ข้อมูลสดเสมอ
  if (url.origin.includes('script.google.com') || url.origin.includes('googleusercontent.com')) {
    return;
  }

  // เฉพาะ GET request เท่านั้นที่เข้า cache ได้
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request)
        .then((res) => {
          if (res && res.status === 200) {
            const resClone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
          }
          return res;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
