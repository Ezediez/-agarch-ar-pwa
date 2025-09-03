// SCRIPT PARA LIMPIAR CACHÉ PWA COMPLETAMENTE
// Ejecutar en consola del navegador (F12)

// 1) Desregistrar Service Worker
navigator.serviceWorker.getRegistrations().then(function(registrations) {
  for(let registration of registrations) {
    registration.unregister();
    console.log('Service Worker desregistrado:', registration);
  }
});

// 2) Limpiar todos los cachés
caches.keys().then(function(cacheNames) {
  return Promise.all(
    cacheNames.map(function(cacheName) {
      console.log('Eliminando caché:', cacheName);
      return caches.delete(cacheName);
    })
  );
}).then(function() {
  console.log('Todos los cachés eliminados');
});

// 3) Limpiar localStorage
localStorage.clear();
sessionStorage.clear();
console.log('Storage limpiado');

// 4) Forzar recarga completa
setTimeout(() => {
  window.location.reload(true);
}, 2000);
