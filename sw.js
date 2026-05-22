const CACHE_NAME = 'forestry-ar-v1.0.1'; // ← アップデート時はここを書き換える(例: v1.0.2)
const ASSETS = [
  'index.html',
  'manifest.json',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
];

// インストール時にファイルをキャッシュ
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS);
    }).then(() => {
      // 新しいSWがインストールされたら待機せず、即座にアクティベートする
      return self.skipWaiting();
    })
  );
});

// 新しいバージョンが有効になったら、古いバージョンのキャッシュを強制クリア
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('古いキャッシュを削除しました:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => {
      // 制御下のすべてのクライアント（タブ）に即座に新しいSWを適用
      return self.clients.claim();
    })
  );
});

// ネットワーク優先、圏外ならキャッシュを返す（地図タイル用に調整）
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request).then(response => {
      // 地理院地図のタイル画像などは、現場（通信圏内）で一度読み込んだら自動キャッシュされるようにする
      if (event.request.url.includes('cyberjapandata.gsi.go.jp')) {
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseClone);
        });
      }
      return response;
    }).catch(() => {
      // 完全オフライン（圏外）時はキャッシュから返す
      return caches.match(event.request);
    })
  );
});