import React, { useState } from 'react';
import { db, auth, storage } from '@/lib/firebase'; // 🔥 Firebase client
import { collection, addDoc } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast.jsx';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { X, Send, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
    setSending(true);
    
    console.log('🔥🔥🔥 ENVIANDO MENSAJE VIA FIREBASE');
    
    try {
      // Crear mensaje directo en Firebase
      await addDoc(collection(db, 'messages'), {
        sender_id: user.id,
        recipient_id: profile.id,
        contenido: message,
        message_type: 'text',
        sent_at: new Date().toISOString(),
        read: false
      });
      
      toast({ title: 'Éxito', description: 'Mensaje enviado correctamente' });
      onClose();
      navigate('/chat', { state: { openChatWith: profile.id } });
    } catch (error) {
      console.error('🔥🔥🔥 ERROR FIREBASE:', error);
      toast({ variant: 'destructive', title: 'Error al enviar mensaje', description: error.message });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center" onClick={onClose}>
      <div className="card-glass rounded-2xl shadow-xl w-full max-w-md flex flex-col mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b border-border-color">
          <h2 className="text-xl font-bold">Enviar mensaje a {profile.alias}</h2>
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
