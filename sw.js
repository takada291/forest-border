const CACHE_NAME = 'forestry-ar-v2.5.0'; 
const ASSETS = [
  'index.html',
  'manifest.json',
  'forestry-ar-icon.png',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return Promise.all(ASSETS.map(url => {
        return fetch(url).then(response => {
          if (response.ok) return cache.put(url, response);
        }).catch(err => console.warn('Skip:', url));
      }));
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(cacheNames.map(cache => {
        if (cache !== CACHE_NAME) return caches.delete(cache);
      }));
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request).then(response => {
      if (event.request.url.includes('cyberjapandata.gsi.go.jp')) {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
      }
      return response;
    }).catch(() => caches.match(event.request))
  );
});
