self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open('static-v1').then((cache) => {
            return cache.addAll([
                './index.html',
                './style.css',
                './manifest.json',
                './icons/IMG_1366.png'
            ]);
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
