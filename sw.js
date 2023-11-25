var zAppVersion = 'sw2023-11-25';
var WTV = './231125';

self.addEventListener('install', function(event) {
  event.waitUntil(caches.open(zAppVersion).then(function(cache) {
    return cache.addAll([
        './favicon.png'
      , './favicon.svg'
      , './favicon256.png'
      , './appmanifest'
      , './231125.css '
      , WTV + '_ldr.js'
      , WTV + '_1.js'
      , WTV + '_2.js'
      , WTV + '_3.js'
      , './images/StewVed.jpg'
      , './images/1425710397e.svg'
      , './images/imgSprites_160429.png'
      , './images/webtop-screen.gif'
      , './jscavern/index.html'
      , './jscavern/210507.js'
      , './jscavern/style.css'
      , './jscavern/images/jscSprites2.png'
      , './jscavern/images/OverallMap.png'
      , './jscavern/audio/Death.ogg'
      , './jscavern/audio/Diamond.ogg'
      , './jscavern/audio/Heart.ogg'
      , './jscavern/audio/Jetpack.ogg'
      , './wordsearch/index.html'
      , './wordsearch/190508.js'
      , './wordsearch/190508.css'
      , './'
    ])
  }))
  console.log('Webtop files cached.');
  // activate without user having to close/open.
  self.skipWaiting();
});
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request).then(function(cacheResponse) {
      return cacheResponse || fetch(event.request).then(function(netResponse) {
        return caches.open(zAppVersion).then(function(cache) {
          cache.put(event.request, netResponse.clone());
          console.log(event.request.url + ' added to Webtop cache.');
          return netResponse;
        });
      });
    })
  );
});
self.addEventListener('activate', function(event) {
  //make the new serviceworker take over now:
  event.waitUntil(clients.claim());
  //delete any old file caches for this app:
  var zAppPrefix = zAppVersion.slice(0, 2);
  event.waitUntil(caches.keys().then(function(cacheNames) {
    return Promise.all(cacheNames.map(function(cacheName) {
      if (cacheName.slice(0, 2) === zAppPrefix) {
        if (cacheName !== zAppVersion) {
          return caches.delete(cacheName);
        }
      }
    }))
  }));
});
