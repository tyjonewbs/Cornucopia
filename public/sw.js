// Service Worker for Cornucopia
// Provides offline capability and improved caching

const CACHE_NAME = 'cornucopia-v4';
const STATIC_CACHE = 'cornucopia-static-v4';
const DYNAMIC_CACHE = 'cornucopia-dynamic-v4';

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS.filter(url => !url.includes('undefined')));
    })
  );
  self.skipWaiting();
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Fetch event - network first with cache fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome extensions
  if (url.protocol === 'chrome-extension:') {
    return;
  }

  // Skip third-party requests (Google Maps, fonts, analytics, etc.)
  // Let the browser handle these directly to avoid CSP connect-src issues
  if (url.origin !== self.location.origin) {
    return;
  }

  // API requests - network only
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(request));
    return;
  }

  // RSC (React Server Components) requests - network only, don't cache
  if (url.searchParams.has('_rsc')) {
    event.respondWith(fetch(request));
    return;
  }

  // Images - cache first with network fallback
  if (request.destination === 'image') {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) {
          return cached;
        }
        return fetch(request).then((response) => {
          // Cache successful image responses
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        });
      })
    );
    return;
  }

  // Static assets - cache first
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        return cached || fetch(request).then((response) => {
          const responseClone = response.clone();
          caches.open(STATIC_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        });
      })
    );
    return;
  }

  // HTML pages - network first with cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cache successful HTML responses
        if (response.status === 200 && request.headers.get('accept')?.includes('text/html')) {
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // If network fails, try cache
        return caches.match(request).then((cached) => {
          if (cached) {
            return cached;
          }
          // Return offline page for HTML requests
          if (request.headers.get('accept')?.includes('text/html')) {
            return caches.match('/offline');
          }
        });
      })
  );
});
