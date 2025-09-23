import React, { useState, useEffect, useRef } from 'react';
import { Bell, Heart, MessageCircle, User, X, CheckCircle, Upload, Image } from 'lucide-react';
import { db, auth, storage } from '@/lib/firebase'; // 🔥 Firebase client
import { collection, query, where, getDocs, orderBy, limit, doc, getDoc } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast.jsx';

const NotificationBell = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (user?.id) {
      fetchNotifications();
      setupRealtimeSubscription();
    }

    // Escuchar notificaciones de la campanita desde localStorage
    const handleBellNotification = () => {
      fetchNotifications();
    };

    window.addEventListener('bell-notification-added', handleBellNotification);

    // Cerrar dropdown al hacer clic fuera
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('bell-notification-added', handleBellNotification);
    };
  }, [user?.id]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      
      // Validar que user.id existe
      if (!user?.id) {
        console.log('❌ No hay usuario autenticado');
        setNotifications([]);
        setUnreadCount(0);
        return;
      }
      
      // Crear notificaciones virtuales basadas en likes y mensajes recientes
      const notifications = [];
      
      // 1. Notificaciones de nuevos likes (últimas 24 horas)
      const likesRef = collection(db, 'user_likes');
      const likesQuery = query(
        likesRef,
        where('liked_user_id', '==', user.id),
        orderBy('created_at', 'desc'),
        limit(10)
      );
      
      const likesSnapshot = await getDocs(likesQuery);
      const likesData = likesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      for (const like of likesData) {
        try {
          const profileRef = doc(db, 'profiles', like.user_id);
          const profileSnap = await getDoc(profileRef);
          if (profileSnap.exists()) {
            const profileData = profileSnap.data();
            notifications.push({
              id: `like-${like.id}`,
              type: 'like',
              title: 'Nuevo Me Gusta',
              message: `A ${profileData.alias} le gustó tu perfil`,
              avatar: profileData.profile_picture_url,
              created_at: like.created_at,
              user_id: like.user_id,
              read: false
            });
          }
        } catch (error) {
          console.error('Error fetching profile for like:', error);
        }
      }

      // 2. Notificaciones de nuevos mensajes (últimas 24 horas)
      const messagesRef = collection(db, 'messages');
      const messagesQuery = query(
        messagesRef,
        where('recipient_id', '==', user.id),
        orderBy('sent_at', 'desc'),
        limit(10)
      );
      
      const messagesSnapshot = await getDocs(messagesQuery);
      const messagesData = messagesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      for (const message of messagesData) {
        try {
          const profileRef = doc(db, 'profiles', message.sender_id);
          const profileSnap = await getDoc(profileRef);
          if (profileSnap.exists()) {
            const profileData = profileSnap.data();
            notifications.push({
              id: `message-${message.id}`,
              type: 'message',
              title: 'Nuevo Mensaje',
              message: message.message_type === 'text' 
                ? `${profileData.alias}: ${message.contenido?.substring(0, 50)}${message.contenido?.length > 50 ? '...' : ''}`
                : `${profileData.alias} te envió ${message.message_type === 'media' ? 'una imagen' : 'un archivo'}`,
              avatar: profileData.profile_picture_url,
              created_at: message.sent_at,
              user_id: message.sender_id,
              read: false
            });
          }
        } catch (error) {
          console.error('Error fetching profile for message:', error);
        }
      }

      // Agregar notificaciones del localStorage (campanita)
      const localNotifications = JSON.parse(localStorage.getItem('bell-notifications') || '[]');
      notifications.push(...localNotifications);

      // Ordenar por fecha y limitar
      notifications.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      const limitedNotifications = notifications.slice(0, 15);
      
      setNotifications(limitedNotifications);
      setUnreadCount(limitedNotifications.length);
      
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    // Firebase realtime subscriptions serán implementadas cuando el chat esté funcionando
    // Por ahora solo mostramos notificaciones estáticas
    console.log('🔔 Notificaciones en tiempo real deshabilitadas temporalmente');
    return () => {};
  };

  const handleNotificationClick = (notification) => {
    // Marcar como leída
    setNotifications(prev =>
      prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));

    // Navegar según el tipo
    if (notification.type === 'like') {
      navigate(`/profile/${notification.user_id}`);
    } else if (notification.type === 'message') {
      navigate(`/chat?user=${notification.user_id}`);
    }
    
    setIsOpen(false);
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const clearNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
    // Limpiar también localStorage
    localStorage.removeItem('bell-notifications');
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'like':
        return <Heart className="w-4 h-4 text-red-500" />;
      case 'message':
        return <MessageCircle className="w-4 h-4 text-blue-500" />;
      case 'upload':
        return <Upload className="w-4 h-4 text-green-500" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'image':
        return <Image className="w-4 h-4 text-purple-500" />;
      default:
        return <User className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Ahora';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}d`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-muted-foreground hover:text-primary transition-colors"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-lg shadow-lg z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Notificaciones</h3>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-primary hover:underline"
                  >
                    Marcar leídas
                  </button>
                )}
                <button
                  onClick={clearNotifications}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-64 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No hay notificaciones</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-3 border-b border-border last:border-b-0 cursor-pointer hover:bg-muted/50 transition-colors ${
                    !notification.read ? 'bg-primary/5' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="relative">
                      <img
                        src={notification.avatar || '/default-avatar.png'}
                        alt=""
                        className="w-8 h-8 rounded-full object-cover"
                        onError={(e) => {
                          e.target.src = '/default-avatar.png';
                        }}
                      />
                      <div className="absolute -bottom-1 -right-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-foreground">
                          {notification.title}
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {formatTimeAgo(notification.created_at)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {notification.message}
                      </p>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-primary rounded-full mt-1"></div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
