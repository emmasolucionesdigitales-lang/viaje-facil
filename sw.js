// ViajeFácil Service Worker v3
const CACHE = 'viajefacil-v3';
const ARCHIVOS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => {
      // Solo cachear archivos locales, no CDNs externos
      return cache.addAll(ARCHIVOS).catch(err => console.log('Cache parcial:', err));
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => {
        console.log('Eliminando cache viejo:', k);
        return caches.delete(k);
      }))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = e.request.url;
  // NO cachear APIs externas
  if(url.includes('api.groq.com') || 
     url.includes('nominatim') || 
     url.includes('osrm') || 
     url.includes('openstreetmap.org') ||
     url.includes('cdnjs.cloudflare.com')) {
    return fetch(e.request);
  }
  // Para archivos locales: red primero, caché como fallback
  e.respondWith(
    fetch(e.request)
      .then(response => {
        // Actualizar caché con versión fresca
        const clone = response.clone();
        caches.open(CACHE).then(cache => cache.put(e.request, clone));
        return response;
      })
      .catch(() => caches.match(e.request))
  );
});
