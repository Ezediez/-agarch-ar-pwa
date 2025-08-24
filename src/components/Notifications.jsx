import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { Bell, Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const Notifications = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron cargar las notificaciones.' });
    } else {
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.is_read).length);
    }
    setLoading(false);
  }, [user, toast]);

  useEffect(() => {
    if (user) {
        fetchNotifications();
        const channel = supabase
          .channel('public:notifications')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user?.id}` }, 
            (payload) => {
              fetchNotifications();
              toast({ title: "Nueva notificación", description: payload.new.message });
            }
          )
          .subscribe();
          
        return () => {
          supabase.removeChannel(channel);
        };
    }
  }, [user, fetchNotifications, toast]);

  const handleNotificationClick = async (notification) => {
    if (!notification.is_read) {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notification.id);
      if(!error) {
        setUnreadCount(prev => Math.max(0, prev - 1));
        setNotifications(prev => prev.map(n => n.id === notification.id ? {...n, is_read: true} : n));
      }
    }
    if (notification.type === 'new_message' && notification.link) {
      const parts = notification.link.split('/');
      const otherUserId = parts[parts.length - 1];
      navigate('/chat', { state: { openChatWith: otherUserId } });
    } else if (notification.link) {
      navigate(notification.link);
    }
  };
  
  const markAllAsRead = async () => {
    const { error } = await supabase.from('notifications').update({is_read: true}).eq('user_id', user.id).eq('is_read', false);
    if (!error) {
        fetchNotifications();
    }
  };

  return (
    <DropdownMenu onOpenChange={fetchNotifications}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative">
          <Bell className="h-6 w-6" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 card-glass" align="end">
        <DropdownMenuLabel className="flex justify-between items-center">
          Notificaciones
          {unreadCount > 0 && (
             <Button variant="link" size="sm" onClick={markAllAsRead} className="p-0 h-auto text-xs">Marcar como leídas</Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {loading ? (
            <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>
        ) : notifications.length === 0 ? (
          <p className="text-center text-sm text-text-secondary p-4">No tienes notificaciones.</p>
        ) : (
          notifications.map(n => (
            <DropdownMenuItem key={n.id} onSelect={(e) => { e.preventDefault(); handleNotificationClick(n); }} className={`cursor-pointer focus:bg-accent/80 ${!n.is_read ? 'font-bold' : ''}`}>
              <div className="flex items-start gap-3 py-2">
                 {!n.is_read && <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />}
                 <div className="flex-1">
                    <p className="text-sm text-text-primary">{n.message}</p>
                    <p className="text-xs text-text-secondary">{formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: es })}</p>
                 </div>
              </div>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default Notifications;