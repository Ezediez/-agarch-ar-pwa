import React from 'react';
    import { motion, AnimatePresence } from 'framer-motion';
    import { Input } from '@/components/ui/input';
    import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
    import { Search, MessageCircle, Crown, CheckCheck, Check } from 'lucide-react';
    import { formatDistanceToNow } from 'date-fns';
    import { es } from 'date-fns/locale';

    const ConversationItem = ({ convo, onSelect, isActive }) => {
      const isVip = convo.membership_type === 'vip' || convo.is_verified;
      const lastMessageTime = convo.lastMessageAt ? new Date(convo.lastMessageAt) : null;
      const isRecent = lastMessageTime && (Date.now() - lastMessageTime.getTime()) < 24 * 60 * 60 * 1000; // Últimas 24h
      
      const formatTime = (date) => {
        if (!date) return '';
        
        const now = new Date();
        const diffInHours = (now - date) / (1000 * 60 * 60);
        
        if (diffInHours < 1) {
          return 'ahora';
        } else if (diffInHours < 24) {
          return formatDistanceToNow(date, { locale: es, addSuffix: false });
        } else {
          return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
        }
      };

      return (
        <motion.div 
          layout 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }} 
          exit={{ opacity: 0 }} 
          className={`flex items-center p-3 hover:bg-surface/80 cursor-pointer transition-colors ${isActive ? 'bg-primary/10 border-r-4 border-primary' : ''} ${isRecent ? 'bg-green-50/20' : ''}`} 
          onClick={onSelect}
        >
          <div className="relative">
            <Avatar className={isVip ? 'ring-2 ring-yellow-500' : ''}>
              <AvatarImage src={convo.profile_picture_url} alt={convo.alias}/>
              <AvatarFallback>{convo.alias?.[0]}</AvatarFallback>
            </Avatar>
            
            {isVip && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center">
                <Crown className="w-3 h-3 text-white" />
              </div>
            )}
            
            {isRecent && (
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background"></div>
            )}
          </div>
          
          <div className="ml-3 flex-grow min-w-0">
            <div className="flex items-center justify-between">
              <h4 className={`font-semibold truncate ${isRecent ? 'text-text-primary' : 'text-text-secondary'}`}>
                {convo.alias}
                {isVip && <span className="ml-1 text-yellow-500 text-xs">👑</span>}
              </h4>
              {lastMessageTime && (
                <span className={`text-xs ${isRecent ? 'text-primary font-medium' : 'text-text-secondary'}`}>
                  {formatTime(lastMessageTime)}
                </span>
              )}
            </div>
            
            <div className="flex items-center justify-between mt-1">
              <p className={`text-sm truncate ${isRecent ? 'text-text-primary' : 'text-text-secondary'}`}>
                {convo.lastMessage || 'Toca para enviar un mensaje'}
              </p>
              
              {convo.unreadCount > 0 && (
                <div className="bg-primary text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                  {convo.unreadCount > 99 ? '99+' : convo.unreadCount}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      );
    };

    const ConversationList = ({ conversations, activeChat, handleSelectChat }) => {
      // Separar conversaciones por actividad reciente
      const recentChats = conversations.filter(convo => {
        const lastMessageTime = convo.lastMessageAt ? new Date(convo.lastMessageAt) : null;
        return lastMessageTime && (Date.now() - lastMessageTime.getTime()) < 24 * 60 * 60 * 1000;
      });
      
      const olderChats = conversations.filter(convo => {
        const lastMessageTime = convo.lastMessageAt ? new Date(convo.lastMessageAt) : null;
        return !lastMessageTime || (Date.now() - lastMessageTime.getTime()) >= 24 * 60 * 60 * 1000;
      });

      return (
        <motion.div layout initial={{ x: -300 }} animate={{ x: 0 }} className={`w-full md:w-1/3 card-glass flex-col ${activeChat && 'hidden md:flex'}`}>
          <div className="p-4 border-b border-border-color">
            <h2 className="text-2xl font-bold text-primary">Chats</h2>
            <div className="relative mt-4">
              <Input placeholder="Buscar chats..." className="input-glass pl-10" />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary w-4 h-4" />
            </div>
          </div>
          
          <div className="flex-grow overflow-y-auto scrollbar-hide">
            <AnimatePresence>
              {conversations.length > 0 ? (
                <>
                  {/* Chats Recientes */}
                  {recentChats.length > 0 && (
                    <>
                      <div className="px-4 py-2 bg-green-50/30">
                        <h3 className="text-sm font-semibold text-green-700 flex items-center">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                          Activos Hoy ({recentChats.length})
                        </h3>
                      </div>
                      {recentChats.map(convo => (
                        <ConversationItem 
                          key={convo.id} 
                          convo={convo} 
                          onSelect={() => handleSelectChat(convo)} 
                          isActive={activeChat?.id === convo.id} 
                        />
                      ))}
                    </>
                  )}
                  
                  {/* Chats Anteriores */}
                  {olderChats.length > 0 && (
                    <>
                      {recentChats.length > 0 && (
                        <div className="px-4 py-2 bg-gray-50/30 border-t border-border-color">
                          <h3 className="text-sm font-semibold text-text-secondary flex items-center">
                            <div className="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
                            Anteriores ({olderChats.length})
                          </h3>
                        </div>
                      )}
                      {olderChats.map(convo => (
                        <ConversationItem 
                          key={convo.id} 
                          convo={convo} 
                          onSelect={() => handleSelectChat(convo)} 
                          isActive={activeChat?.id === convo.id} 
                        />
                      ))}
                    </>
                  )}
                </>
              ) : (
                <div className="text-center p-8 text-text-secondary">
                  <MessageCircle className="w-12 h-12 mx-auto mb-2" />
                  <p>No tienes conversaciones aún.</p>
                  <p className="text-xs mt-2">Envía "Me gusta" para empezar a chatear</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      );
    };

    export default ConversationList;
