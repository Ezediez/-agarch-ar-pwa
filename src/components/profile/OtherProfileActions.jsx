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
      const [matchStatus, setMatchStatus] = useState(null);
      const [loadingMatch, setLoadingMatch] = useState(true);
      const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);

      useEffect(() => {
        const checkMatchStatus = async () => {
          if (!user || !profile) return;
          setLoadingMatch(true);
          const { data, error } = await supabase
            .from('matches')
            .select('id, estado_match, user1_id, user2_id')
            .or(`(user1_id.eq.${user.id},user2_id.eq.${profile.id}),(user1_id.eq.${profile.id},user2_id.eq.${user.id})`)
            .maybeSingle();
          
          if (error) {
            console.error("Error checking match status:", error);
          } else {
            setMatchStatus(data);
          }
          setLoadingMatch(false);
        };
        checkMatchStatus();
      }, [user, profile]);

      const handleMatchAction = async () => {
        setLoadingMatch(true);
        const { data, error } = await supabase.rpc('handle_user_interaction', { target_user_id: profile.id });
        setLoadingMatch(false);

        if (error) {
          toast({ variant: "destructive", title: "Error", description: "Ocurrió un error al procesar la solicitud." });
        } else {
          const [status, message] = data.split(':');
          toast({ title: message });
          const { data: newStatus } = await supabase
            .from('matches')
            .select('id, estado_match, user1_id, user2_id')
            .or(`(user1_id.eq.${user.id},user2_id.eq.${profile.id}),(user1_id.eq.${profile.id},user2_id.eq.${user.id})`)
            .maybeSingle();
          setMatchStatus(newStatus);
        }
      };

      if (loadingMatch) {
        return <div className="mt-6 flex justify-center"><Button disabled><Loader2 className="mr-2 h-4 w-4 animate-spin" />Cargando...</Button></div>;
      }
      
      const isPendingRequest = matchStatus?.estado_match === 'pendiente';
      const iSentRequest = isPendingRequest && matchStatus.user1_id === user.id;

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

              {matchStatus?.estado_match !== 'aceptado' && (
                <Button onClick={handleMatchAction} disabled={iSentRequest} className="flex-1">
                  <Heart className="mr-2 h-4 w-4" />
                  {iSentRequest ? 'Solicitud Enviada' : 'Hacer Match'}
                </Button>
              )}
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