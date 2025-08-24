import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast.jsx';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUploader } from '@/hooks/useUploader';
import ConversationList from '@/components/chat/ConversationList';
import ChatWindow from '@/components/chat/ChatWindow';
import { Loader2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

const ChatPage = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const { uploadFiles, isUploading: isUploadingFiles, progress } = useUploader();

  const [matches, setMatches] = useState([]);
  const [activeChat, setActiveChat] = useState(() => {
    try {
      const savedChat = sessionStorage.getItem('activeChat');
      return savedChat ? JSON.parse(savedChat) : null;
    } catch (e) {
      return null;
    }
  });
  const [messages, setMessages] = useState([]);
  const [loadingMatches, setLoadingMatches] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const messagesEndRef = useRef(null);
  
  useEffect(() => {
    if (activeChat) {
      sessionStorage.setItem('activeChat', JSON.stringify(activeChat));
    } else {
      sessionStorage.removeItem('activeChat');
    }
  }, [activeChat]);

  const fetchMatches = useCallback(async () => {
    if (!user) return;
    setLoadingMatches(true);
    const { data, error } = await supabase
      .from('matches')
      .select('*, user1:user1_id(id, alias, profile_picture_url, is_vip), user2:user2_id(id, alias, profile_picture_url, is_vip)')
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .eq('estado_match', 'aceptado');

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron cargar tus matches.' });
    } else {
      const formattedMatches = data.map(m => {
        const otherUser = m.user1.id === user.id ? m.user2 : m.user1;
        return { match_id: m.id, ...otherUser };
      });
      setMatches(formattedMatches);
      
      const chatWithUserId = location.state?.openChatWith;
      if (chatWithUserId) {
        const chatToOpen = formattedMatches.find(m => m.id === chatWithUserId);
        if (chatToOpen) {
          handleSelectChat(chatToOpen);
          navigate(location.pathname, { replace: true, state: {} });
        }
      } else if (activeChat) {
         const restoredChat = formattedMatches.find(m => m.match_id === activeChat.match_id);
         if (restoredChat) {
            handleSelectChat(restoredChat);
         } else {
            setActiveChat(null);
         }
      }
    }
    setLoadingMatches(false);
  }, [user, toast, location.state, navigate]);
  
  useEffect(()=>{
      if(user) fetchMatches();
  },[user, fetchMatches])

  const handleSelectChat = async (match) => {
    if (activeChat?.match_id === match.match_id) return;
    setActiveChat(match);
    setLoadingMessages(true);
    setMessages([]);
    const { data, error } = await supabase.from('messages').select('*').eq('match_id', match.match_id).order('sent_at', { ascending: true });
    if (error) toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron cargar los mensajes.' });
    else setMessages(data || []);
    setLoadingMessages(false);
  };
  
  const handleRealtimeMessage = useCallback((payload) => {
    if (payload.new.match_id === activeChat?.match_id) {
      setMessages(current => {
          const tempId = payload.new.temp_id;
          if (tempId && current.some(m => m.id === tempId)) {
              return current.map(m => m.id === tempId ? payload.new : m);
          }
          if (current.some(m => m.id === payload.new.id)) {
              return current;
          }
          return [...current, payload.new];
      });
    }
  }, [activeChat?.match_id]);

  useEffect(() => {
    const channel = supabase.channel('realtime-messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, 
        handleRealtimeMessage
      ).subscribe();
    return () => supabase.removeChannel(channel);
  }, [supabase, handleRealtimeMessage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (messageData) => {
    const tempId = `temp-${uuidv4()}`;
    const optimisticMessage = {
      ...messageData,
      id: tempId,
      temp_id: tempId,
      sent_at: new Date().toISOString(),
      sender_id: user.id,
    };

    setMessages(current => [...current, optimisticMessage]);

    const { error } = await supabase.from('messages').insert({ ...messageData, temp_id: tempId });
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo enviar el mensaje.' });
      setMessages(current => current.filter(m => m.id !== tempId));
    }
  };
  
  const handleFilesUpload = async (files, text) => {
    if (!files || files.length === 0) return;

    const optimisticMessages = files.map(file => {
      const tempId = `temp-${uuidv4()}`;
      return {
        id: tempId,
        temp_id: tempId,
        match_id: activeChat.match_id,
        sender_id: user.id,
        content: text,
        message_type: 'media',
        media_urls: [URL.createObjectURL(file)],
        sent_at: new Date().toISOString(),
        isOptimistic: true,
      };
    });

    // We only show one optimistic message if multiple files are sent with one text
    const representativeOptimisticMessage = {
        ...optimisticMessages[0],
        media_urls: files.map(f => URL.createObjectURL(f)),
        content: text,
    };
    if (files.length > 1) representativeOptimisticMessage.content = text;
    setMessages(current => [...current, representativeOptimisticMessage]);

    
    const urls = await uploadFiles(files, 'media', 'chat-media');
    
    if (urls && urls.length > 0) {
      const { error } = await supabase.from('messages').insert({
        match_id: activeChat.match_id,
        sender_id: user.id,
        content: text,
        message_type: 'media',
        media_urls: urls,
        temp_id: representativeOptimisticMessage.temp_id
      });
       if (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudo enviar el mensaje con archivos.' });
        setMessages(current => current.filter(m => m.id !== representativeOptimisticMessage.id));
      }
    } else {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo completar la subida de archivos.' });
      setMessages(current => current.filter(m => m.id !== representativeOptimisticMessage.id));
    }
  };

  const handleAudioUpload = async (audioBlob, duration) => {
    if (!audioBlob) return;
    const urls = await uploadFiles([audioBlob], 'media', 'chat-audio');
    if (urls && urls.length > 0) {
      await sendMessage({
        match_id: activeChat.match_id,
        sender_id: user.id,
        message_type: 'audio',
        media_urls: urls,
        audio_duration_seconds: Math.round(duration),
      });
    }
  };

  if (loadingMatches) return <div className="flex justify-center items-center h-full"><Loader2 className="w-12 h-12 animate-spin text-primary"/></div>

  return (
    <>
      <Helmet>
        <title>Chat - AGARCH-AR</title>
        <meta name="description" content="Comunícate con tus matches en AGARCH-AR." />
      </Helmet>
      <div className="h-[calc(100vh-88px)] md:h-auto md:aspect-[4/3] max-h-[calc(100vh-100px)] flex flex-col md:flex-row gap-4">
        <ConversationList
          matches={matches}
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
    </>
  );
};

export default ChatPage;