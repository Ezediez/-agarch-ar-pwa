export function askNotificationPermissionIfSupported() {
  try {
    if (typeof window === 'undefined') return;
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'default') return;

    // Solicitar permiso tras un breve retraso para evitar bloquear la carga
    setTimeout(() => {
      Notification.requestPermission().catch(() => {});
    }, 1000);
  } catch (_) {
    // Ignorar errores en navegadores no compatibles
  }
}


