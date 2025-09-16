// Registrar Service Worker optimizado para Firebase - AGARCH-AR PWA
if ('serviceWorker' in navigator) {
  // Limpiar Service Workers viejos primero
  navigator.serviceWorker.getRegistrations().then(regs => {
    regs.forEach(r => {
      console.log('🗑️ Desregistrando SW viejo:', r.scope);
      r.unregister();
    });
  }).then(() => {
    // Registrar nuevo Service Worker
    navigator.serviceWorker.register('/sw-config.js', {
      scope: '/'
    }).then(registration => {
      console.log('✅ Service Worker registrado exitosamente:', registration.scope);
      
      // Forzar actualización inmediata
      registration.update();
      
      // Escuchar actualizaciones
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('🔄 Nueva versión disponible, recargando...');
            window.location.reload();
          }
        });
      });
      
    }).catch(error => {
      console.log('❌ Error registrando Service Worker:', error);
    });
  }).catch(error => {
    console.log('❌ Error limpiando Service Workers viejos:', error);
  });
}
