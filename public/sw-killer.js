// Service Worker Killer - Se desregistra a sí mismo
self.addEventListener('install', function(event) {
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    self.registration.unregister().then(function() {
      console.log('Service Worker eliminado correctamente');
    })
  );
});
