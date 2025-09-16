import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { db, auth, storage } from '@/lib/firebase'; // 🔥 Firebase client
import { collection, query, where, orderBy, limit, getDocs, addDoc, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast.jsx';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUploader } from '@/hooks/useUploader';
import ConversationList from '@/components/chat/ConversationList';
import ChatWindow from '@/components/chat/ChatWindow';
import { Loader2, MessageCircle } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

/**
 * ChatPage - Sistema de chat directo sin matches
 * Características:
 * - Mensajes directos usando recipient_id
 * - Realtime con Firebase
 * - Optimistic updates
 * - Manejo de archivos y audio
 * - Error handling robusto
 */
const ChatPage = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const { uploadFiles, isUploading: isUploadingFiles, progress } = useUploader();

  // Estados principales
  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(() => {
    try {
      const savedChat = localStorage.getItem('agarch-active-chat');
      return savedChat ? JSON.parse(savedChat) : null;
    } catch {
      return null;
    }
  });
  const [messages, setMessages] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  
  // Referencias
  const messagesEndRef = useRef(null);
  const realtimeChannelRef = useRef(null);
  const debounceTimeoutRef = useRef(null);
  
  // Persistir chat activo en localStorage
  useEffect(() => {
    if (activeChat) {
      localStorage.setItem('agarch-active-chat', JSON.stringify(activeChat));
    } else {
      localStorage.removeItem('agarch-active-chat');
    }
  }, [activeChat]);

  /**
   * Obtener conversaciones basadas en mensajes enviados/recibidos
   * Agrupa por usuarios únicos y obtiene sus perfiles
   */
  const fetchConversations = useCallback(async () => {
    if (!user?.uid) return;
    
    setLoadingConversations(true);
    
    try {
      // Obtener todos los mensajes del usuario desde Firebase
      const messagesRef = collection(db, 'messages');
      const messagesQuery = query(
        messagesRef,
        where('sender_id', '==', user.uid),
        orderBy('sent_at', 'desc'),
        limit(500)
      );
      
      const messagesSnapshot = await getDocs(messagesQuery);
      const sentMessages = messagesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Obtener mensajes recibidos
      const receivedMessagesQuery = query(
        messagesRef,
        where('recipient_id', '==', user.uid),
        orderBy('sent_at', 'desc'),
        limit(500)
      );
      
      const receivedSnapshot = await getDocs(receivedMessagesQuery);
      const receivedMessages = receivedSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Combinar y agrupar por usuarios únicos
      const allMessages = [...sentMessages, ...receivedMessages];
      const userMap = new Map();
      
      allMessages.forEach(msg => {
        const otherUserId = msg.sender_id === user.uid ? msg.recipient_id : msg.sender_id;
        if (otherUserId && !userMap.has(otherUserId)) {
          userMap.set(otherUserId, msg.sent_at);
        }
      });

      const uniqueUserIds = Array.from(userMap.keys());
      
      if (uniqueUserIds.length === 0) {
        setConversations([]);
        return;
      }

      // Obtener perfiles de usuarios desde Firebase
      const profilesData = [];
      for (const userId of uniqueUserIds) {
        try {
          const profileRef = doc(db, 'profiles', userId);
          const profileSnap = await getDoc(profileRef);
          if (profileSnap.exists()) {
            profilesData.push({ id: profileSnap.id, ...profileSnap.data() });
          }
        } catch (error) {
          console.error('Error fetching profile for user:', userId, error);
        }
      }

      // Ordenar por última interacción
      const sortedConversations = profilesData
        .map(profile => ({
          ...profile,
          lastMessageAt: userMap.get(profile.id)
        }))
        .sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));

      setConversations(sortedConversations);

      // Abrir chat específico si viene del state
      const chatWithUserId = location.state?.openChatWith;
      if (chatWithUserId) {
        const chatToOpen = sortedConversations.find(c => c.id === chatWithUserId);
        if (chatToOpen) {
          handleSelectChat(chatToOpen);
          // Limpiar state para evitar re-abrir
          navigate(location.pathname, { replace: true, state: {} });
        }
      }

    } catch (error) {
      console.error('Unexpected error in fetchConversations:', error);
      toast({ 
        variant: 'destructive', 
        title: 'Error', 
        description: 'No se pudieron cargar las conversaciones.' 
      });
      setConversations([]);
    } finally {
      setLoadingConversations(false);
    }
  }, [user?.id, location.state, navigate, toast]);

  // Cargar conversaciones al montar y cuando cambie el usuario
  useEffect(() => {
    if (user?.id) {
      fetchConversations();
    }
  }, [fetchConversations]);

  /**
   * Seleccionar chat activo y cargar mensajes
   */
  const handleSelectChat = useCallback(async (conversation) => {
    if (!user?.id || !conversation?.id) return;
    if (activeChat?.id === conversation.id) return;

    setActiveChat(conversation);
    setLoadingMessages(true);
    setMessages([]);

    try {
      // Obtener mensajes enviados por el usuario actual al otro usuario
      const sentMessagesQuery = query(
        collection(db, 'messages'),
        where('sender_id', '==', user.uid),
        where('recipient_id', '==', conversation.id),
        orderBy('sent_at', 'asc')
      );
      
      const sentSnapshot = await getDocs(sentMessagesQuery);
      const sentMessages = sentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Obtener mensajes recibidos del otro usuario
      const receivedMessagesQuery = query(
        collection(db, 'messages'),
        where('sender_id', '==', conversation.id),
        where('recipient_id', '==', user.uid),
        orderBy('sent_at', 'asc')
      );
      
      const receivedSnapshot = await getDocs(receivedMessagesQuery);
      const receivedMessages = receivedSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Combinar y ordenar mensajes
      const allMessages = [...sentMessages, ...receivedMessages];
      allMessages.sort((a, b) => new Date(a.sent_at) - new Date(b.sent_at));
      
      setMessages(allMessages);
    } catch (error) {
      console.error('Unexpected error loading messages:', error);
      toast({ 
        variant: 'destructive', 
        title: 'Error', 
        description: 'No se pudieron cargar los mensajes.' 
      });
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  }, [user?.id, activeChat?.id, toast]);

  /**
   * Manejar mensajes en tiempo real
   */
  const handleRealtimeMessage = useCallback((payload) => {
    if (!user?.id || !activeChat?.id || !payload?.new) return;

    const newMessage = payload.new;
    const isForActiveChat = 
      (newMessage.sender_id === user.id && newMessage.recipient_id === activeChat.id) ||
      (newMessage.sender_id === activeChat.id && newMessage.recipient_id === user.id);

    if (!isForActiveChat) return;

    // Debounce para evitar cascada de actualizaciones
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      setMessages(currentMessages => {
        // Si es un mensaje optimista siendo reemplazado
        const tempId = newMessage.temp_id;
        if (tempId) {
          const existingIndex = currentMessages.findIndex(m => m.id === tempId || m.temp_id === tempId);
          if (existingIndex !== -1) {
            const updated = [...currentMessages];
            updated[existingIndex] = newMessage;
            return updated;
          }
        }

        // Evitar duplicados
        if (currentMessages.some(m => m.id === newMessage.id)) {
          return currentMessages;
        }

        return [...currentMessages, newMessage];
      });
    }, 100);
  }, [user?.id, activeChat?.id]);

  /**
   * Configurar suscripción en tiempo real con Firebase
   */
  useEffect(() => {
    if (!user?.id) return;

    // Limpiar suscripción anterior
    if (realtimeChannelRef.current) {
      realtimeChannelRef.current();
    }

    // Crear nueva suscripción a mensajes
    const unsubscribe = onSnapshot(
      collection(db, 'messages'),
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const newMessage = { id: change.doc.id, ...change.doc.data() };
            handleRealtimeMessage({ new: newMessage });
          }
        });
      },
      (error) => {
        console.error('Error en suscripción de mensajes:', error);
      }
    );

    realtimeChannelRef.current = unsubscribe;

    return () => {
      if (realtimeChannelRef.current) {
        realtimeChannelRef.current();
      }
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [user?.id, handleRealtimeMessage]);

  /**
   * Auto-scroll a los nuevos mensajes
   */
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [messages]);

  /**
   * Enviar mensaje de texto
   */
  const sendMessage = useCallback(async (messageData) => {
    if (!user?.id || !activeChat?.id) return;

    const tempId = `temp-${uuidv4()}`;
    const optimisticMessage = {
      ...messageData,
      id: tempId,
      temp_id: tempId,
      sent_at: new Date().toISOString(),
      sender_id: user.id,
      recipient_id: activeChat.id,
      isOptimistic: true
    };

    // Agregar mensaje optimista
    setMessages(current => [...current, optimisticMessage]);

    try {
      const messageToSave = {
        ...messageData, 
        sender_id: user.id,
        recipient_id: activeChat.id,
        temp_id: tempId,
        sent_at: new Date().toISOString()
      };

      await addDoc(collection(db, 'messages'), messageToSave);
      
    } catch (error) {
      console.error('Unexpected error sending message:', error);
      toast({ 
        variant: 'destructive', 
        title: 'Error', 
        description: 'No se pudo enviar el mensaje.' 
      });
      // Remover mensaje optimista fallido
      setMessages(current => current.filter(m => m.id !== tempId));
    }
  }, [user?.id, activeChat?.id, toast]);

  /**
   * Subir archivos y enviar mensaje multimedia
   */
  const handleFilesUpload = useCallback(async (files, text = '') => {
    if (!files?.length || !user?.id || !activeChat?.id) return;

    const tempId = `temp-${uuidv4()}`;
    const optimisticMessage = {
      id: tempId,
      temp_id: tempId,
      recipient_id: activeChat.id,
      sender_id: user.id,
      contenido: text,
      message_type: 'media',
      media_urls: files.map(file => URL.createObjectURL(file)),
      sent_at: new Date().toISOString(),
      isOptimistic: true
    };

    setMessages(current => [...current, optimisticMessage]);

    try {
      const uploadedUrls = await uploadFiles(files, 'media', 'chat-media');
      
      if (uploadedUrls?.length > 0) {
        const messageToSave = {
          recipient_id: activeChat.id,
          sender_id: user.id,
          contenido: text,
          message_type: 'media',
          media_urls: uploadedUrls,
          temp_id: tempId,
          sent_at: new Date().toISOString()
        };

        await addDoc(collection(db, 'messages'), messageToSave);
      } else {
        toast({ 
          variant: 'destructive', 
          title: 'Error', 
          description: 'Error al subir archivos.' 
        });
        setMessages(current => current.filter(m => m.id !== tempId));
      }
    } catch (error) {
      console.error('Error uploading files:', error);
      toast({ 
        variant: 'destructive', 
        title: 'Error', 
        description: 'No se pudo enviar el mensaje con archivos.' 
      });
      setMessages(current => current.filter(m => m.id !== tempId));
    }
  }, [user?.id, activeChat?.id, uploadFiles, toast]);

  /**
   * Subir audio y enviar mensaje de audio
   */
  const handleAudioUpload = useCallback(async (audioBlob, duration) => {
    if (!audioBlob || !user?.id || !activeChat?.id) return;

    try {
      const uploadedUrls = await uploadFiles([audioBlob], 'media', 'chat-audio');
      
      if (uploadedUrls?.length > 0) {
        await sendMessage({
          message_type: 'audio',
          media_urls: uploadedUrls,
          audio_duration_seconds: Math.round(duration || 0)
        });
      } else {
        toast({ 
          variant: 'destructive', 
          title: 'Error', 
          description: 'Error al subir audio.' 
        });
      }
    } catch (error) {
      console.error('Error uploading audio:', error);
      toast({ 
        variant: 'destructive', 
        title: 'Error', 
        description: 'Error al subir audio.' 
      });
    }
  }, [user?.id, activeChat?.id, uploadFiles, sendMessage, toast]);

  // Loading state
  if (loadingConversations) {
    return (
      <div className="flex flex-col justify-center items-center h-[calc(100vh-88px)] gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="text-muted-foreground">Cargando conversaciones...</p>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Chat - AGARCH-AR</title>
        <meta name="description" content="Comunícate directamente con otros usuarios en AGARCH-AR." />
      </Helmet>
      
      <div className="h-[calc(100vh-88px)] md:h-auto md:aspect-[4/3] max-h-[calc(100vh-100px)] flex flex-col md:flex-row gap-4">
        <ConversationList
          conversations={conversations}
          activeChat={activeChat}
          handleSelectChat={handleSelectChat}
        />
        
        <ChatWindow 
          activeChat={activeChat}
          setActiveChat={setActiveChat}
          loadingMessages={loadingMessages}
          messages={messages}
          messagesEndRef={messagesEndRef}
          profile={profile}
          handleAudioUpload={handleAudioUpload}
          handleFilesUpload={handleFilesUpload}
          isUploading={isUploadingFiles}
          uploadProgress={progress}
          sendMessage={sendMessage}
        />
      </div>

      {/* Estado vacío cuando no hay conversaciones */}
      {!loadingConversations && conversations.length === 0 && !activeChat && (
        <div className="flex flex-col items-center justify-center h-full text-center p-8">
          <MessageCircle className="w-16 h-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No tienes conversaciones</h3>
          <p className="text-muted-foreground">
            Envía "Me gusta" a otros usuarios desde Descubrir para comenzar a chatear.
          </p>
        </div>
      )}
    </>
  );
};

export default ChatPage;
