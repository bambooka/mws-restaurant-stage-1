const CACHE = 'network-or-cache-v1';

// Put into cache
self.addEventListener('fetch', (event) => {
    event.waitUntil(
        caches.open(CACHE).then((cache) => cache.addAll([
                event.request
            ])
        ));
});