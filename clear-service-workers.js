// Script para limpiar completamente todos los Service Workers registrados
// Ejecutar en la consola del navegador para limpiar caches y SWs

console.log('🧹 Iniciando limpieza completa de Service Workers...');

// Función para limpiar todos los Service Workers
async function clearAllServiceWorkers() {
  if ('serviceWorker' in navigator) {
    try {
      // Obtener todas las registraciones
      const registrations = await navigator.serviceWorker.getRegistrations();
      
      console.log(`📋 Encontrados ${registrations.length} Service Workers registrados`);
      
      // Desregistrar todos los Service Workers
      for (const registration of registrations) {
        console.log(`🗑️ Desregistrando SW: ${registration.scope}`);
        await registration.unregister();
      }
      
      console.log('✅ Todos los Service Workers han sido desregistrados');
      
      // Limpiar todos los caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        console.log(`📦 Encontrados ${cacheNames.length} caches`);
        
        for (const cacheName of cacheNames) {
          console.log(`🗑️ Eliminando cache: ${cacheName}`);
          await caches.delete(cacheName);
        }
        
        console.log('✅ Todos los caches han sido eliminados');
      }
      
      console.log('🎉 Limpieza completa finalizada');
      console.log('💡 Recarga la página para aplicar los cambios');
      
    } catch (error) {
      console.error('❌ Error durante la limpieza:', error);
    }
  } else {
    console.log('⚠️ Service Workers no soportados en este navegador');
  }
}

// Ejecutar limpieza automáticamente
clearAllServiceWorkers();

// También exportar la función para uso manual
window.clearAllServiceWorkers = clearAllServiceWorkers;