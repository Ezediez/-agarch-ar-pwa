import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Send, Image, Video, MoreVertical, ArrowLeft, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { getChats, saveChat, getMatches } from '@/utils/storage';
import { containsContactInfo, containsProhibitedContent } from '@/utils/validation';

const ChatPage = () => {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const { toast } = useToast();

  useEffect(() => {
    loadChats();
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadChats = () => {
    // Simular carga de chats basados en matches
    setTimeout(() => {
      const matches = getMatches();
      const userMatches = matches.filter(m => m.user1 === user?.id || m.user2 === user?.id);
      
      const mockChats = userMatches.map((match, index) => ({
        id: match.user1 === user?.id ? match.user2 : match.user1,
        name: `Usuario ${index + 1}`,
        lastMessage: 'Hola! ¿Cómo estás?',
        timestamp: new Date().toISOString(),
        unread: Math.random() > 0.5,
        isVip: Math.random() > 0.7,
        online: Math.random() > 0.6
      }));

      setChats(mockChats);
      setLoading(false);
    }, 1000);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;

    // Validar contenido prohibido
    if (containsProhibitedContent(newMessage)) {
      toast({
        title: "Mensaje bloqueado",
        description: "Tu mensaje contiene contenido prohibido y no puede ser enviado.",
        variant: "destructive"
      });
      return;
    }

    // Validar información de contacto
    if (containsContactInfo(newMessage)) {
      toast({
        title: "Mensaje bloqueado",
        description: "No puedes compartir información de contacto en el chat. Espera a pactar un encuentro.",
        variant: "destructive"
      });
      return;
    }

    const message = {
      id: Date.now(),
      text: newMessage,
      sender: user?.id,
      timestamp: new Date().toISOString(),
      type: 'text'
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');

    // Simular respuesta automática
    setTimeout(() => {
      const autoReply = {
        id: Date.now() + 1,
        text: '¡Hola! Gracias por tu mensaje 😊',
        sender: activeChat?.id,
        timestamp: new Date().toISOString(),
        type: 'text'
      };
      setMessages(prev => [...prev, autoReply]);
    }, 1500);
  };

  const openChat = (chat) => {
    setActiveChat(chat);
    // Simular carga de mensajes
    const mockMessages = [
      {
        id: 1,
        text: '¡Hola! Me gustó mucho tu perfil',
        sender: chat.id,
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        type: 'text'
      },
      {
        id: 2,
        text: '¡Hola! Gracias, el tuyo también está genial 😊',
        sender: user?.id,
        timestamp: new Date(Date.now() - 3000000).toISOString(),
        type: 'text'
      },
      {
        id: 3,
        text: '¿Te gustaría que nos conozcamos mejor?',
        sender: chat.id,
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        type: 'text'
      }
    ];
    setMessages(mockMessages);
  };

  const handleMediaUpload = (type) => {
    toast({
      title: "🚧 Esta función no está implementada aún",
      description: "¡Pero no te preocupes! Puedes solicitarla en tu próximo prompt! 🚀"
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="loading-spinner" />
      </div>
    );
  }

  if (!activeChat) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold gradient-text mb-6">Mis Conversaciones</h1>
        
        {chats.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-600 mb-2">No tienes conversaciones</h2>
            <p className="text-gray-500">¡Haz match con alguien para comenzar a chatear!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {chats.map((chat) => (
              <motion.div
                key={chat.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02 }}
                onClick={() => openChat(chat)}
                className="card cursor-pointer hover:shadow-lg transition-all"
              >
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Avatar className="w-16 h-16">
                      <AvatarImage src="" alt={chat.name} />
                      <AvatarFallback className="bg-gradient-to-r from-orange-400 to-green-400 text-white font-bold">
                        {chat.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    {chat.online && <div className="status-indicator" />}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-gray-800">{chat.name}</h3>
                      {chat.isVip && (
                        <div className="vip-badge text-xs">
                          <Crown className="w-3 h-3 inline mr-1" />
                          VIP
                        </div>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm">{chat.lastMessage}</p>
                    <p className="text-gray-400 text-xs">
                      {new Date(chat.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                  
                  {chat.unread && (
                    <div className="w-3 h-3 bg-orange-500 rounded-full" />
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-200px)] flex flex-col">
      {/* Chat Header */}
      <div className="card mb-4 p-4">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveChat(null)}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          
          <div className="relative">
            <Avatar className="w-12 h-12">
              <AvatarImage src="" alt={activeChat.name} />
              <AvatarFallback className="bg-gradient-to-r from-orange-400 to-green-400 text-white font-bold">
                {activeChat.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            {activeChat.online && <div className="status-indicator" />}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <h2 className="font-semibold text-gray-800">{activeChat.name}</h2>
              {activeChat.isVip && (
                <div className="vip-badge text-xs">
                  <Crown className="w-3 h-3 inline mr-1" />
                  VIP
                </div>
              )}
            </div>
            <p className="text-sm text-gray-600">
              {activeChat.online ? 'En línea' : 'Última vez hace 2h'}
            </p>
          </div>
          
          <Button variant="outline" size="sm">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="card flex-1 p-4 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto scrollbar-hide space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === user?.id ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`chat-bubble ${message.sender === user?.id ? 'sent' : 'received'}`}>
                <p>{message.text}</p>
                <p className="text-xs opacity-70 mt-1">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <form onSubmit={handleSendMessage} className="flex items-center space-x-2 mt-4 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleMediaUpload('image')}
          >
            <Image className="w-4 h-4" />
          </Button>
          
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleMediaUpload('video')}
          >
            <Video className="w-4 h-4" />
          </Button>
          
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Escribe un mensaje..."
            className="flex-1 input-field"
          />
          
          <Button type="submit" className="btn-primary">
            <Send className="w-4 h-4" />
          </Button>
        </form>

        <p className="text-xs text-gray-500 mt-2">
          No compartas información de contacto hasta pactar un encuentro. Todas las conversaciones son monitoreadas por seguridad.
        </p>
      </div>
    </div>
  );
};

export default ChatPage;