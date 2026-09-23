/**
 * Cuenect Webfront Offline - Progressive Web App Service Worker
 * Provides offline caching for application shell assets, fast loads, and installability.
 */

const CACHE_NAME = 'cuenect-pwa-v1.2.0';

// Core assets to pre-cache on service worker installation
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/favicon-32x32.png',
  '/favicon-16x16.png',
  '/favicon.svg',
  '/apple-touch-icon.png',
  '/icon-192.png',
  '/icon-512.png'
];

// Install Event: Pre-cache static shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => {
        // Activate worker immediately
        return self.skipWaiting();
      })
      .catch((err) => {
        console.warn('[PWA SW] Pre-cache skipped or failed:', err);
      })
  );
});

// Activate Event: Clean up stale caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cache) => {
            if (cache !== CACHE_NAME) {
              return caches.delete(cache);
            }
          })
        );
      })
      .then(() => {
        return self.clients.claim();
      })
  );
});

// Fetch Event: Stale-While-Revalidate for static assets, Network-First for navigation, bypass APIs & WebSockets
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // 1. Bypass non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // 2. Bypass WebSocket connections, Socket.IO polling, ngrok endpoints, and dynamic model streaming APIs
  if (
    url.protocol.startsWith('ws') ||
    url.pathname.startsWith('/socket.io') ||
    url.pathname.startsWith('/api/') ||
    url.hostname.includes('ngrok')
  ) {
    return;
  }

  // 3. For HTML navigation requests: Network-First with Cache fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match('/index.html') || caches.match('/');
        })
    );
    return;
  }

  // 4. For static assets (JS, CSS, images, fonts): Cache-First with background revalidation
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Network failed, nothing to do if cache missed
        });

      return cachedResponse || fetchPromise;
    })
  );
});
