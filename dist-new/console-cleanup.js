// Script para limpiar errores de consola no críticos
(function() {
  'use strict';
  
  // Interceptar errores de Gravatar (no críticos)
  const originalError = console.error;
  console.error = function(...args) {
    const message = args.join(' ');
    
    // Filtrar errores no críticos
    if (message.includes('gravatar.com') || 
        message.includes('404') ||
        message.includes('hcaptcha.com') ||
        message.includes('b.stripecdn.com') ||
        message.includes('No available adapters') ||
        message.includes('access-control/bb-api')) {
      
      // Solo mostrar en modo desarrollo
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️ Error no crítico filtrado:', message);
      }
      return;
    }
    
    // Mostrar errores reales
    originalError.apply(console, args);
  };
  
  // Interceptar warnings de hCaptcha/Stripe
  const originalWarn = console.warn;
  console.warn = function(...args) {
    const message = args.join(' ');
    
    // Filtrar warnings no críticos
    if (message.includes('No available adapters') ||
        message.includes('hcaptcha') ||
        message.includes('stripe')) {
      return;
    }
    
    // Mostrar warnings reales
    originalWarn.apply(console, args);
  };
  
  // Limpiar errores de Service Worker externos
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'ERROR') {
        // Filtrar errores de SW externos
        if (event.data.message && 
            (event.data.message.includes('cnm-sw') ||
             event.data.message.includes('gravatar') ||
             event.data.message.includes('hcaptcha'))) {
          return;
        }
      }
    });
  }
  
  console.log('🧹 Console cleanup activado - Errores no críticos filtrados');
})();
