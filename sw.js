const CACHE = 'network-or-cache-v1';

// Put into cache
self.addEventListener('fetch', (event) => {
    event.waitUntil(
        caches.open(CACHE).then((cache) => cache.addAll([
                event.request
            ])
        ));
});

// Extract from cache
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then(function (response) {
            if (response) return response;
            return fetch(event.request);
        })
    )
})