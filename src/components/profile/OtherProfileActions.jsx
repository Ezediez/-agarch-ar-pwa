import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { db, auth, storage } from '@/lib/firebase'; // 🔥 Firebase client
import { collection, query, where, getDocs, addDoc, deleteDoc } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast.jsx';
import { Button } from '@/components/ui/button';
import { MessageSquare, Heart, Loader2 } from 'lucide-react';
import DirectMessageModal from './DirectMessageModal';

const OtherProfileActions = ({ profile }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [likeStatus, setLikeStatus] = useState(null);
  const [loadingLike, setLoadingLike] = useState(true);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);

  useEffect(() => {
    const checkLikeStatus = async () => {
      if (!user?.id || !profile?.id) return;
      setLoadingLike(true);
      const likesRef = collection(db, 'user_likes');
      const likesQuery = query(
        likesRef,
        where('user_id', '==', user.id),
        where('liked_user_id', '==', profile.id)
      );
      
      const snapshot = await getDocs(likesQuery);
      const likeData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      setLikeStatus(likeData.length > 0 ? likeData[0] : null);
      setLoadingLike(false);
    };
    checkLikeStatus();
  }, [user, profile]);

  const handleLikeAction = async () => {
    if (!user?.id || !profile?.id) return;
    
    setLoadingLike(true);
    try {
      if (likeStatus) {
        // Unlike - buscar y eliminar el like existente
        const likesRef = collection(db, 'user_likes');
        const likesQuery = query(
          likesRef,
          where('user_id', '==', user.id),
          where('liked_user_id', '==', profile.id)
        );
        
        const snapshot = await getDocs(likesQuery);
        for (const likeDoc of snapshot.docs) {
          await deleteDoc(likeDoc.ref);
        }
        
        setLikeStatus(null);
        toast({ title: "Me gusta removido" });
      } else {
        // Like - agregar nuevo like
        await addDoc(collection(db, 'user_likes'), {
          user_id: user.id,
          liked_user_id: profile.id,
          created_at: new Date().toISOString()
        });
        
        setLikeStatus({ user_id: user.id, liked_user_id: profile.id });
        toast({ title: "¡Me gusta enviado!" });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Ocurrió un error al procesar la solicitud." });
    } finally {
      setLoadingLike(false);
    }
  };

  if (loadingLike) {
    return <div className="mt-6 flex justify-center"><Button disabled><Loader2 className="mr-2 h-4 w-4 animate-spin" />Cargando...</Button></div>;
  }

  return (
    <>
      <motion.div
        className="mt-6 flex flex-wrap gap-2 justify-center w-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Button onClick={() => setIsMessageModalOpen(true)} className="flex-1 bg-green-500 hover:bg-green-600">
          <MessageSquare className="mr-2 h-4 w-4" /> Mensaje
        </Button>

        <Button 
          onClick={handleLikeAction} 
          className={`flex-1 ${likeStatus ? 'bg-red-500 hover:bg-red-600' : ''}`}
        >
          <Heart className={`mr-2 h-4 w-4 ${likeStatus ? 'fill-current' : ''}`} />
          {likeStatus ? 'Quitar ❤️' : 'Me gusta'}
        </Button>
      </motion.div>
      {isMessageModalOpen && (
        <DirectMessageModal 
          profile={profile} 
          onClose={() => setIsMessageModalOpen(false)}
        />
      )}
    </>
  );
};

export default OtherProfileActions;
