/* Service Worker para CreaMYD PWA - v2.0 */
var CACHE = 'creamyd-v2-' + (new Date()).getFullYear();
var ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './logo-192.png',
  './logo-512.png',
  './apple-touch-icon.png',
  './favicon-32.png',
  './og-image.png'
];

/* Instalación: precachea los assets esenciales */
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(c) {
      return c.addAll(ASSETS).catch(function(err) {
        console.warn('[SW] Algunos assets no se pudieron cachear:', err);
      });
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

/* Activación: limpia caches viejos */
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE; })
            .map(function(k) { return caches.delete(k); })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

/* Fetch: network-first para HTML, cache-first para assets estáticos */
self.addEventListener('fetch', function(e) {
  if (e.request.method !== 'GET') return;

  var url = new URL(e.request.url);

  // Solo interceptar peticiones same-origin (ignora Supabase externo)
  if (url.origin !== location.origin) return;

  var isHTML = e.request.mode === 'navigate' ||
               (e.request.headers.get('accept') || '').includes('text/html');

  if (isHTML) {
    // Network-first para HTML (siempre la versión más reciente)
    e.respondWith(
      fetch(e.request).then(function(r) {
        var clone = r.clone();
        caches.open(CACHE).then(function(c) { c.put(e.request, clone); });
        return r;
      }).catch(function() {
        return caches.match(e.request).then(function(m) {
          return m || caches.match('./index.html');
        });
      })
    );
  } else {
    // Cache-first para imágenes, CSS, JS, etc.
    e.respondWith(
      caches.match(e.request).then(function(m) {
        if (m) return m;
        return fetch(e.request).then(function(r) {
          if (r && r.ok) {
            var clone = r.clone();
            caches.open(CACHE).then(function(c) { c.put(e.request, clone); });
          }
          return r;
        }).catch(function() {
          return new Response('', { status: 404 });
        });
      })
    );
  }
});

/* Permitir que el SW tome control inmediatamente */
self.addEventListener('message', function(e) {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});
