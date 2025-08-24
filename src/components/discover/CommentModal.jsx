import React, { useState, useEffect, useCallback, useRef } from 'react';
    import { supabase } from '@/lib/customSupabaseClient';
    import { useAuth } from '@/hooks/useAuth';
    import { useToast } from '@/components/ui/use-toast';
    import { Button } from '@/components/ui/button';
    import { Textarea } from '@/components/ui/textarea';
    import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
    import { X, Send } from 'lucide-react';
    import { formatDistanceToNow } from 'date-fns';
    import { es } from 'date-fns/locale';
    
    const CommentModal = ({ postId, onClose, commentsCount: initialCommentsCount }) => {
      const [comments, setComments] = useState([]);
      const [newComment, setNewComment] = useState('');
      const [loading, setLoading] = useState(true);
      const [isPosting, setIsPosting] = useState(false);
      const [commentsCount, setCommentsCount] = useState(initialCommentsCount);
      const { user, profile } = useAuth();
      const { toast } = useToast();
      const commentsEndRef = useRef(null);
    
      const fetchComments = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
          .from('comentarios')
          .select(`
            *,
            profile:usuario_id (
              alias,
              profile_picture_url
            )
          `)
          .eq('publicacion_id', postId)
          .order('creado_en', { ascending: true });
    
        if (error) {
          console.error('Error fetching comments:', error);
          toast({
            variant: 'destructive',
            title: 'Error al cargar comentarios',
            description: 'No se pudieron obtener los comentarios.',
          });
        } else {
          setComments(data || []);
        }
        setLoading(false);
      }, [postId, toast]);
    
      useEffect(() => {
        fetchComments();
      }, [fetchComments]);
      
      useEffect(() => {
        const channel = supabase
          .channel(`comments-for-post-${postId}`)
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'comentarios', filter: `publicacion_id=eq.${postId}` },
            (payload) => {
              fetchComments();
              if (payload.eventType === 'INSERT') {
                setCommentsCount(prev => (prev || 0) + 1);
              } else if (payload.eventType === 'DELETE') {
                setCommentsCount(prev => Math.max(0, (prev || 0) - 1));
              }
            }
          )
          .subscribe();
    
        return () => {
          supabase.removeChannel(channel);
        };
      }, [postId, fetchComments]);
    
    
      useEffect(() => {
        commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, [comments]);
    
    
      const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim() || isPosting) return;
    
        setIsPosting(true);
    
        const { error } = await supabase
          .from('comentarios')
          .insert({
            publicacion_id: postId,
            usuario_id: user.id,
            texto: newComment,
          });
    
        if (error) {
          console.error('Error posting comment:', error);
          toast({
            variant: 'destructive',
            title: 'Error al publicar',
            description: 'No se pudo enviar tu comentario.',
          });
        } else {
          setNewComment('');
        }
        setIsPosting(false);
      };
    
      return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center" onClick={onClose}>
          <div className="bg-background rounded-2xl shadow-xl w-full max-w-lg h-[90vh] flex flex-col mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-4 border-b border-border">
              <h2 className="text-xl font-bold text-center flex-grow">Comentarios</h2>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-6 w-6" />
              </Button>
            </div>
    
            <div className="flex-grow overflow-y-auto p-4 space-y-4">
              {loading ? (
                <p className="text-center text-text-secondary">Cargando comentarios...</p>
              ) : comments.length > 0 ? (
                comments.map((comment) => (
                  <div key={comment.id} className="flex items-start space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={comment.profile?.profile_picture_url} alt={comment.profile?.alias} />
                      <AvatarFallback>{comment.profile?.alias?.[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="bg-muted p-3 rounded-lg">
                        <p className="font-semibold text-sm">{comment.profile?.alias}</p>
                        <p className="text-text-primary text-sm">{comment.texto}</p>
                      </div>
                      <p className="text-xs text-text-secondary mt-1 ml-2">
                        {formatDistanceToNow(new Date(comment.creado_en), { addSuffix: true, locale: es })}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-text-secondary py-8">Sé el primero en comentar.</p>
              )}
              <div ref={commentsEndRef} />
            </div>
    
            <div className="p-4 border-t border-border mt-auto">
              <form onSubmit={handleSubmit} className="flex items-center space-x-2">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={profile?.profile_picture_url} alt={profile?.alias} />
                  <AvatarFallback>{profile?.alias?.[0]}</AvatarFallback>
                </Avatar>
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Escribe un comentario..."
                  className="flex-grow bg-muted border-none focus-visible:ring-primary"
                  rows={1}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                />
                <Button type="submit" size="icon" disabled={isPosting || !newComment.trim()}>
                  <Send className="h-5 w-5" />
                </Button>
              </form>
            </div>
          </div>
        </div>
      );
    };
    
    export default CommentModal;