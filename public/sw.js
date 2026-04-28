const CACHE_NAME = 'pst-v3'; // Increment cache version to force update

const ASSETS_TO_PRECACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg'
  // Add any other critical static assets that are not hashed, e.g., fonts, static images
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching essential assets...');
      return cache.addAll(ASSETS_TO_PRECACHE);
    }).catch(error => {
      console.error('[Service Worker] Pre-caching failed:', error);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim(); // Take control of pages immediately
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // Strategy: Cache-First for static assets, Network-First for API/dynamic content
  // and Navigation fallback for SPA routes

  const requestUrl = new URL(event.request.url);

  // Skip caching for Supabase API calls or other external APIs
  // Adjust this condition if your Supabase URL or other API endpoints differ
  if (requestUrl.hostname.includes('supabase.co') || requestUrl.pathname.startsWith('/api/')) {
    event.respondWith(fetch(event.request)); // Network-only for API calls
    return;
  }

  // For navigation requests (e.g., direct URL entry, refresh on a sub-route)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        return cachedResponse || fetch(event.request).catch(() => {
          return caches.match('/index.html'); // Always serve index.html for SPA routes if offline
        });
      })
    );
    return;
  }

  // For all other GET requests (static assets: JS, CSS, images, etc.)
  // Cache-first, then network, and update cache
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse; // Serve from cache if available
      }

      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse; // Return invalid responses as is
        }
        const responseToCache = networkResponse.clone(); // Clone response for caching
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse; // Return network response
      }).catch(() => {
        // If network fails for a non-navigation request, there's no generic fallback for JS/CSS.
        // The browser will likely show its default error.
        console.warn('[Service Worker] Fetch failed for:', event.request.url);
        return new Response(null, { status: 503, statusText: 'Service Unavailable' });
      });
    })
  );
});