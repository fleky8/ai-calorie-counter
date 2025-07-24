// Nombre del cache
const CACHE_NAME = 'ai-calorie-counter-v1';

// Archivos a cachear inicialmente
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/static/js/main.chunk.js',
  '/static/js/0.chunk.js',
  '/static/js/bundle.js',
  '/static/css/main.chunk.css',
  '/favicon.ico'
];

// Instalación del Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache abierto');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('Error durante la instalación del cache:', error);
      })
  );
});

// Activación del Service Worker
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            // Eliminar caches antiguos que no estén en la whitelist
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Estrategia de cache: Network First, fallback to cache
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Si la respuesta es válida, clonarla y guardarla en el cache
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
        }
        return response;
      })
      .catch(() => {
        // Si falla la red, intentar servir desde el cache
        return caches.match(event.request);
      })
  );
});

// Manejo de mensajes (para actualizaciones)
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Sincronización en segundo plano (para enviar datos cuando se recupera la conexión)
self.addEventListener('sync', event => {
  if (event.tag === 'sync-nutrition-data') {
    event.waitUntil(syncNutritionData());
  }
});

// Función para sincronizar datos pendientes
async function syncNutritionData() {
  try {
    // Aquí iría la lógica para sincronizar datos pendientes
    // cuando se recupera la conexión a internet
    console.log('Sincronizando datos nutricionales pendientes');
  } catch (error) {
    console.error('Error al sincronizar datos:', error);
  }
}