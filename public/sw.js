// ChillWithYT Progressive Web App (PWA) Service Worker
const CACHE_NAME = 'chillwithyt-shell-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.png',
  '/favicon.ico'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('SW cache pre-warm skipped non-critical item:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests, never intercept YouTube audio/video or Supabase/Firebase API requests
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  // Bypass third-party audio streams, YouTube APIs, Firebase, and Supabase
  if (
    url.hostname.includes('youtube.com') ||
    url.hostname.includes('googlevideo.com') ||
    url.hostname.includes('ytimg.com') ||
    url.hostname.includes('supabase.co') ||
    url.hostname.includes('firebaseio.com') ||
    url.hostname.includes('googleapis.com')
  ) {
    return;
  }

  // Network-first strategy with cache fallback for app navigation (SPA deep-link reload fix)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        // Try cache first for index.html
        const cachedIndex = await caches.match('/index.html') || await caches.match('/');
        try {
          const networkResponse = await fetch(event.request);
          // If we got a valid HTML response, return it
          if (networkResponse.ok) return networkResponse;
          // Non-OK (e.g. 404 from server on deep route) → serve the SPA shell
          return cachedIndex || networkResponse;
        } catch {
          // Offline → serve cached SPA shell
          return cachedIndex || new Response('Offline — please reconnect', { status: 503 });
        }
      })()
    );
    return;
  }

  // Cache-first for local static assets
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return response;
      });
    })
  );
});
