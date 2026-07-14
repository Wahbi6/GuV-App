const CACHE_NAME = 'guv-app-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Installation des Service Workers
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache).catch(() => {
          // Fehler beim Cachen ignorieren, App funktioniert trotzdem
          return Promise.resolve();
        });
      })
  );
  self.skipWaiting();
});

// Aktivierung des Service Workers
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch-Event - Netzwerk-First Strategie
self.addEventListener('fetch', (event) => {
  // Nur GET-Requests cachen
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Erfolgreiche Response cachen
        if (!response || response.status !== 200) {
          return response;
        }
        
        const responseToCache = response.clone();
        caches.open(CACHE_NAME)
          .then((cache) => {
            cache.put(event.request, responseToCache);
          });
        
        return response;
      })
      .catch(() => {
        // Offline: Gecachte Version laden
        return caches.match(event.request)
          .then((response) => {
            return response || new Response('Offline', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
          });
      })
  );
});
