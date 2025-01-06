self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open('hubtownparking-v1').then(function(cache) {
      return cache.addAll([
        './',
        './index.html',
        './manifest.json',
        './service-worker.js',
        './icon/icon-192.png',
        './icon/icon-512.png'
      ]).catch(function(error) {
        console.error('Cache addAll failed:', error);
      });
    })
  );
    console.log('Service Worker Installed');
    self.skipWaiting();    
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        fetch(event.request).catch(() => caches.match(event.request))
    );
});
