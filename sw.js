const CACHE_NAME = 'inventario-pwa-v6';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting()) // activa la nueva versión sin esperar a cerrar pestañas
  );
});

// Antes no existía este listener: los cachés de versiones anteriores (v1, v2, v3...)
// se quedaban acumulados para siempre en el dispositivo. Aquí se borran los que ya
// no correspondan a la versión activa.
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  // Ignorar las llamadas a la API de Google Apps Script para que no rompan el caché de red
  if (e.request.url.includes('script.google.com')) return;

  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;
      return fetch(e.request).catch(() => {
        // Sin caché y sin red: si es una navegación (el usuario abrió la app),
        // se sirve el shell principal desde caché en vez de dejar el error del navegador.
        if (e.request.mode === 'navigate') return caches.match('./index.html');
      });
    })
  );
});
