// Service Worker para AGARCH-AR PWA
const CACHE_NAME = 'agarch-ar-v1';
const urlsToCache = [
  '/',
  '/manifest.webmanifest',
  '/pwa-512x512.png'
];

// Instalar Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('SW: Cache abierto');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('SW: Error al cachear recursos:', error);
      })
  );
});

// Activar Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('SW: Eliminando cache viejo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Interceptar requests
self.addEventListener('fetch', (event) => {
  // Solo cachear requests GET
  if (event.request.method !== 'GET') {
    return;
  }

  // Evitar errores con Response null
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Si está en cache, devolverlo
        if (response) {
          return response;
        }

        // Si no está en cache, hacer fetch
        return fetch(event.request)
          .then((response) => {
            // Verificar que la respuesta es válida
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clonar la respuesta
            const responseToCache = response.clone();

            // Cachear solo recursos estáticos
            if (event.request.url.includes('/assets/') || 
                event.request.url.includes('.js') || 
                event.request.url.includes('.css') ||
                event.request.url.includes('.png') ||
                event.request.url.includes('.jpg') ||
                event.request.url.includes('.jpeg') ||
                event.request.url.includes('.webp')) {
              
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                })
                .catch((error) => {
                  console.error('SW: Error al cachear:', error);
                });
            }

            return response;
          })
          .catch((error) => {
            console.error('SW: Error en fetch:', error);
            // En caso de error, devolver respuesta vacía válida
            return new Response('', {
              status: 200,
              statusText: 'OK',
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
          });
      })
      .catch((error) => {
        console.error('SW: Error general:', error);
        // Respuesta de fallback válida
        return new Response('', {
          status: 200,
          statusText: 'OK',
          headers: new Headers({
            'Content-Type': 'text/plain'
          })
        });
      })
  );
});

// Manejar mensajes
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('SW: Service Worker cargado correctamente');
