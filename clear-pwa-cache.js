// SCRIPT PARA LIMPIAR CACHE PWA Y FORZAR ACTUALIZACIÓN
// Ejecutar en la consola del navegador en agarch-ar.com

console.log('🧹 INICIANDO LIMPIEZA COMPLETA DE CACHE PWA...');

async function clearAllCaches() {
    try {
        // 1. Limpiar Service Worker Cache
        console.log('1️⃣ Limpiando Service Worker Cache...');
        if ('caches' in window) {
            const cacheNames = await caches.keys();
            console.log('Caches encontrados:', cacheNames);
            
            for (const cacheName of cacheNames) {
                await caches.delete(cacheName);
                console.log(`✅ Cache eliminado: ${cacheName}`);
            }
        }

        // 2. Limpiar LocalStorage
        console.log('2️⃣ Limpiando LocalStorage...');
        const localStorageKeys = Object.keys(localStorage);
        console.log('LocalStorage keys:', localStorageKeys);
        
        // Mantener solo los esenciales (auth)
        const keepKeys = ['supabase.auth.token', 'sb-'];
        localStorageKeys.forEach(key => {
            if (!keepKeys.some(keepKey => key.includes(keepKey))) {
                localStorage.removeItem(key);
                console.log(`✅ LocalStorage eliminado: ${key}`);
            }
        });

        // 3. Limpiar SessionStorage
        console.log('3️⃣ Limpiando SessionStorage...');
        sessionStorage.clear();
        console.log('✅ SessionStorage limpio');

        // 4. Limpiar IndexedDB
        console.log('4️⃣ Limpiando IndexedDB...');
        if ('indexedDB' in window) {
            // Listar bases de datos
            const databases = await indexedDB.databases();
            console.log('IndexedDB encontradas:', databases);
            
            for (const db of databases) {
                if (db.name && !db.name.includes('supabase')) {
                    const deleteRequest = indexedDB.deleteDatabase(db.name);
                    await new Promise((resolve, reject) => {
                        deleteRequest.onsuccess = () => {
                            console.log(`✅ IndexedDB eliminada: ${db.name}`);
                            resolve();
                        };
                        deleteRequest.onerror = reject;
                    });
                }
            }
        }

        // 5. Desregistrar Service Worker
        console.log('5️⃣ Desregistrando Service Worker...');
        if ('serviceWorker' in navigator) {
            const registrations = await navigator.serviceWorker.getRegistrations();
            console.log('Service Workers encontrados:', registrations.length);
            
            for (const registration of registrations) {
                await registration.unregister();
                console.log('✅ Service Worker desregistrado');
            }
        }

        // 6. Limpiar cookies no esenciales
        console.log('6️⃣ Limpiando cookies...');
        document.cookie.split(";").forEach(cookie => {
            const eqPos = cookie.indexOf("=");
            const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
            
            // Mantener cookies esenciales de auth
            if (!name.includes('supabase') && !name.includes('auth') && name !== '') {
                document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
                console.log(`✅ Cookie eliminada: ${name}`);
            }
        });

        console.log('✨ LIMPIEZA COMPLETA TERMINADA');
        console.log('🔄 Recargando página en 3 segundos...');
        
        // Esperar y recargar
setTimeout(() => {
  window.location.reload(true);
        }, 3000);
        
    } catch (error) {
        console.error('❌ Error durante la limpieza:', error);
    }
}

// Función para verificar el estado actual
function checkCacheStatus() {
    console.log('📊 ESTADO ACTUAL DEL CACHE:');
    
    // LocalStorage
    console.log('LocalStorage items:', Object.keys(localStorage).length);
    Object.keys(localStorage).forEach(key => {
        console.log(`  - ${key}: ${localStorage.getItem(key)?.substring(0, 50)}...`);
    });
    
    // SessionStorage
    console.log('SessionStorage items:', Object.keys(sessionStorage).length);
    
    // Service Worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
            console.log('Service Workers activos:', registrations.length);
            registrations.forEach((reg, index) => {
                console.log(`  - SW ${index + 1}: ${reg.scope}`);
            });
        });
    }
    
    // Caches
    if ('caches' in window) {
        caches.keys().then(cacheNames => {
            console.log('Caches activos:', cacheNames.length);
            cacheNames.forEach(name => {
                console.log(`  - ${name}`);
            });
        });
    }
}

// Función para forzar actualización del SW
async function forceServiceWorkerUpdate() {
    console.log('🔄 FORZANDO ACTUALIZACIÓN DE SERVICE WORKER...');
    
    if ('serviceWorker' in navigator) {
        try {
            const registrations = await navigator.serviceWorker.getRegistrations();
            
            for (const registration of registrations) {
                console.log('Actualizando Service Worker...');
                await registration.update();
                
                if (registration.waiting) {
                    console.log('Activando nuevo Service Worker...');
                    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
                }
            }
            
            console.log('✅ Service Worker actualizado');
            window.location.reload(true);
        } catch (error) {
            console.error('❌ Error actualizando Service Worker:', error);
        }
    }
}

// Ejecutar automáticamente
console.log('🚀 Ejecutando limpieza automática...');
console.log('📋 Comandos disponibles:');
console.log('  - clearAllCaches() : Limpieza completa');
console.log('  - checkCacheStatus() : Verificar estado');
console.log('  - forceServiceWorkerUpdate() : Forzar actualización SW');

// Ejecutar verificación inicial
checkCacheStatus();

// Preguntar al usuario
if (confirm('¿Quieres limpiar completamente el cache PWA? Esto forzará una recarga.')) {
    clearAllCaches();
} else {
    console.log('ℹ️ Limpieza cancelada. Ejecuta clearAllCaches() manualmente cuando quieras.');
}