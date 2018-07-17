if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').then(function () {
        console.log('Service worker registered');
    }).catch(function (error) {
        console.log('Error register service worker: ' + error);
    });
} else {
    console.log('Browser does not support service worker');
}
