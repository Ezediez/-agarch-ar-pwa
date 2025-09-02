import React, { useState, useEffect } from 'react';
    import { motion } from 'framer-motion';
    import { supabase } from '@/lib/customSupabaseClient';
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
          if (!user || !profile) return;
          setLoadingLike(true);
          const { data, error } = await supabase
            .from('likes')
            .select('id, user_id, liked_user_id')
            .eq('user_id', user.id)
            .eq('liked_user_id', profile.id)
            .maybeSingle();
          
          if (error) {
            console.error("Error checking like status:", error);
          } else {
            setLikeStatus(data);
          }
          setLoadingLike(false);
        };
        checkLikeStatus();
      }, [user, profile]);

      const handleLikeAction = async () => {
        setLoadingLike(true);
        try {
          if (likeStatus) {
            // Unlike
            const { error } = await supabase
              .from('likes')
              .delete()
              .eq('user_id', user.id)
              .eq('liked_user_id', profile.id);
            
            if (error) throw error;
            setLikeStatus(null);
            toast({ title: "Me gusta removido" });
          } else {
            // Like
            const { error } = await supabase
              .from('likes')
              .insert({
                user_id: user.id,
                liked_user_id: profile.id
              });
            
            if (error) throw error;
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
                {likeStatus ? 'Me gusta' : 'Me gusta'}
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