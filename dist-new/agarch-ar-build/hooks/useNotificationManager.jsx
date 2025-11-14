import { useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast.jsx';

// Hook para interceptar toasts y convertirlos en notificaciones de la campanita
export const useNotificationManager = () => {
  const { toast } = useToast();

  // Función para agregar notificación a la campanita en lugar de toast
  const addNotificationToBell = (notification) => {
    // Crear una notificación que se guarde en localStorage para la campanita
    const notifications = JSON.parse(localStorage.getItem('bell-notifications') || '[]');
    const newNotification = {
      id: `notification-${Date.now()}`,
      type: notification.type || 'success',
      title: notification.title,
      message: notification.description,
      created_at: new Date().toISOString(),
      read: false,
      avatar: null
    };
    
    notifications.unshift(newNotification);
    localStorage.setItem('bell-notifications', JSON.stringify(notifications.slice(0, 50))); // Máximo 50 notificaciones
    
    // Trigger custom event para actualizar la campanita
    window.dispatchEvent(new CustomEvent('bell-notification-added', { 
      detail: newNotification 
    }));
  };

  // Interceptar toasts específicos y redirigirlos a la campanita
  const smartToast = (notification) => {
    const { title, description, variant } = notification;
    
    // Si es una notificación de éxito/acción, usar la campanita
    if (title === 'Me gusta' || 
        title === 'Perfil guardado' || 
        title === '¡Éxito!' ||
        title === '¡Publicación creada con éxito!' ||
        title?.includes('subido') ||
        title?.includes('Mensaje enviado')) {
      
      addNotificationToBell({
        type: variant === 'destructive' ? 'error' : 'success',
        title,
        description
      });
      
      // No mostrar toast tradicional
      return;
    }
    
    // Para errores, seguir mostrando toast tradicional
    toast(notification);
  };

  return { toast: smartToast, addNotificationToBell };
};
