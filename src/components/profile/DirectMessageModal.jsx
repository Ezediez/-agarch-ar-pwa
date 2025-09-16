import React, { useState } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast.jsx';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { X, Send, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { startConversation } from '@/utils/chatUtils';

const DirectMessageModal = ({ profile, onClose }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSendMessage = async () => {
    if (!message.trim()) {
      toast({ variant: 'destructive', title: 'El mensaje no puede estar vacío.' });
      return;
    }
    
    if (!user?.id || !profile?.id) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo identificar al usuario o destinatario.' });
      return;
    }
    
    setSending(true);
    
    try {
      // Verificar si ya existe una conversación
      const conversationsRef = collection(db, 'conversations');
      const existingConvQuery = query(
        conversationsRef,
        where('members', 'array-contains', user.id)
      );
      
      const existingSnapshot = await getDocs(existingConvQuery);
      let conversationId = null;
      
      // Buscar conversación existente con este usuario
      for (const doc of existingSnapshot.docs) {
        const data = doc.data();
        if (data.members.includes(profile?.id)) {
          conversationId = doc.id;
          break;
        }
      }
      
      // Si no existe conversación, crear una nueva
      if (!conversationId) {
        const newConversation = {
          members: [user.id, profile?.id],
          lastMessage: message.slice(0, 80),
          lastSenderId: user.id,
          updatedAt: serverTimestamp(),
        };
        const convRef = await addDoc(collection(db, 'conversations'), newConversation);
        conversationId = convRef.id;
      }
      
      // Enviar el mensaje
      await addDoc(collection(db, 'conversations', conversationId, 'messages'), {
        authorId: user.id,
        type: 'text',
        text: message,
        media: [],
        createdAt: serverTimestamp(),
      });
      
      // Actualizar última conversación
      const convRef = doc(db, 'conversations', conversationId);
      await updateDoc(convRef, {
        lastMessage: message.slice(0, 80),
        lastSenderId: user.id,
        updatedAt: serverTimestamp(),
      });
      
      toast({ title: 'Éxito', description: 'Mensaje enviado correctamente' });
      onClose();
      navigate(`/chat/${conversationId}`);
      
    } catch (error) {
      console.error('Error sending message:', error);
      toast({ variant: 'destructive', title: 'Error al enviar mensaje', description: error.message });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center" onClick={onClose}>
      <div className="card-glass rounded-2xl shadow-xl w-full max-w-md flex flex-col mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b border-border-color">
          <h2 className="text-xl font-bold">Enviar mensaje a {profile?.alias || 'Usuario'}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-6 w-6" />
          </Button>
        </div>
        <div className="p-4">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Escribe tu primer mensaje..."
            className="input-glass min-h-[120px]"
            rows={4}
          />
        </div>
        <div className="p-4 border-t border-border-color flex justify-end">
          <Button onClick={handleSendMessage} disabled={sending} className="btn-action">
            {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            {sending ? 'Enviando...' : 'Enviar'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DirectMessageModal;
