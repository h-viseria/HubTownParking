const CACHE_NAME = 'hubtownparking-v1';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './service-worker.js',
  './icons/IMG_1365.png',
  './icons/IMG_1366.png'
];

// Install Service Worker
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        return Promise.all(
          urlsToCache.map(url =>
            fetch(url).then(response => {
              if (!response.ok) {
                throw new Error(`Failed to cache: ${url}`);
              }
              return cache.put(url, response);
            })
          )
        );
      })
      .catch(function(error) {
        console.warn('Some files failed to cache:', error);
      })
  );
});

// Activate and Clean Up Old Caches
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch and Serve from Cache
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request).then(function(response) {
      // Return cached response if found
      return response || fetch(event.request);
    }).catch(function() {
      return caches.match('./index.html');
    })
  );
});

// Force Refresh Button (Optional)
self.addEventListener('message', (event) => {
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});
