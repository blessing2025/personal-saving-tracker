const CACHE_NAME = 'pst-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  // Simple pass-through for online-first/offline-sync architecture
  // Your current Dexie + SyncManager handles the data; 
  // the SW just satisfies the browser's PWA requirement.
  event.respondWith(fetch(event.request));
});