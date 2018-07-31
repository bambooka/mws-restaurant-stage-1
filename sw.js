const CACHE = 'cache';
var toCache = [
    'index.html',
    'restaurant.html?id=1',
    'restaurant.html?id=2',
    'restaurant.html?id=3',
    'restaurant.html?id=4',
    'restaurant.html?id=5',
    'restaurant.html?id=6',
    'restaurant.html?id=7',
    'restaurant.html?id=8',
    'restaurant.html?id=9',
    'restaurant.html?id=10',
    './css/beautify_detailed_view.css',
    './css/orientation_landscape.css',
    './js/index.js',
    './js/main.js',
    './js/restaurant_info.js',
    './js/dbhelper.js',
    './img/placeholder.jpg',
    './img/1.jpg',
    './img/2.jpg',
    './img/3.jpg',
    './img/4.jpg',
    './img/5.jpg',
    './img/6.jpg',
    './img/7.jpg',
    './img/8.jpg',
    './img/9.jpg',
    './img/10.jpg',
    './img/smallplaceholder.jpg',
    './img/small1.jpg',
    './img/small2.jpg',
    './img/small3.jpg',
    './img/small4.jpg',
    './img/small5.jpg',
    './img/small6.jpg',
    './img/small7.jpg',
    './img/small9.jpg',
    './img/small9.jpg',
    './img/small10.jpg'
]

// Install and put into cache
self.addEventListener('install', function (event) {

    event.waitUntil(
        caches.open(CACHE)
            .then(function (cache) {
                return cache.addAll(toCache);
            })
    );
});

// Activate
self.addEventListener('activate', function (event) {
    event.waitUntil(
        caches.keys().then(function (cacheNames) {
            return Promise.all(
                cacheNames.filter(function (cacheName) {
                    return cacheName.startsWith('cache') &&
                        cacheName != CACHE;
                }).map(function (cacheName) {
                    return caches.delete(cacheName);
                })
            );
        })
    );
});

// Extract from cache
self.addEventListener('fetch', function (event) {

    event.respondWith(
        caches.match(event.request).then(function (response) {
            return response || fetch(event.request);
        })
    );
});


self.addEventListener('message', function (event) {
    if (event.data.action === 'skipWaiting') {
        self.skipWaiting();
    }
});