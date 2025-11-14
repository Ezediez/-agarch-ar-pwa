import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, addDoc, deleteDoc } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { useNotificationManager } from '@/hooks/useNotificationManager';
import { ArrowLeft, Loader2, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getTemplateById } from '@/constants/postTemplates';

const PostPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useNotificationManager();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [likesCount, setLikesCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    const fetchPost = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const postRef = doc(db, 'posts', id);
        const postSnap = await getDoc(postRef);
        
        if (postSnap.exists()) {
          const postData = { id: postSnap.id, ...postSnap.data() };
          
          // Obtener perfil del autor
          try {
            const profileRef = doc(db, 'profiles', postData.user_id);
            const profileSnap = await getDoc(profileRef);
            if (profileSnap.exists()) {
              postData.author = { id: profileSnap.id, ...profileSnap.data() };
            }
          } catch (error) {
            console.error('Error fetching profile:', error);
          }

          // Obtener likes del post
          try {
            const likesRef = collection(db, 'post_likes');
            const likesQuery = query(likesRef, where('post_id', '==', postData.id));
            const likesSnapshot = await getDocs(likesQuery);
            const likesData = likesSnapshot.docs.map(likeDoc => ({ id: likeDoc.id, ...likeDoc.data() }));
            
            setLikesCount(likesData.length);
            setIsLiked(likesData.some(like => like.user_id === user?.uid));
          } catch (error) {
            console.error('Error fetching likes:', error);
            setLikesCount(0);
            setIsLiked(false);
          }
          
          setPost(postData);
        } else {
          navigate('/discover');
        }
      } catch (error) {
        console.error('Error fetching post:', error);
        navigate('/discover');
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id, navigate, user?.uid]);

  const templateData = post?.template_id ? getTemplateById(post.template_id) : null;
  const templateTextColor = post?.text_color || templateData?.defaultTextColor || '#f5f5f5';
  const hasMedia = Boolean(post?.image_url || post?.video_url);
  const showTemplate = !hasMedia && templateData;

  const handleLike = async () => {
    if (!user?.uid || !post) return;
    
    try {
      // Verificar si ya le dio like
      const likesRef = collection(db, 'post_likes');
      const likeQuery = query(likesRef, where('post_id', '==', post.id), where('user_id', '==', user.uid));
      const existingLike = await getDocs(likeQuery);
      
      if (existingLike.empty) {
        // Dar like
        await addDoc(likesRef, {
          post_id: post.id,
          user_id: user.uid,
          created_at: new Date().toISOString()
        });
        setLikesCount(prev => prev + 1);
        setIsLiked(true);
        toast({
          title: "❤️ Like agregado",
          description: "Tu like ha sido registrado",
        });
      } else {
        // Quitar like
        const likeDoc = existingLike.docs[0];
        await deleteDoc(doc(db, 'post_likes', likeDoc.id));
        setLikesCount(prev => prev - 1);
        setIsLiked(false);
        toast({
          title: "💔 Like removido",
          description: "Tu like ha sido removido",
        });
      }
    } catch (error) {
      console.error('Error handling like:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo procesar el like'
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-text-secondary">Cargando post...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-secondary mb-4">Post no encontrado</p>
          <Button onClick={() => navigate('/discover')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al feed
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Post - {post.author?.alias || 'Usuario'} | AGARCH-AR</title>
        <meta name="description" content="Ver post completo en AGARCH-AR" />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/discover')}
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Volver
              </Button>
              <h1 className="text-lg font-semibold">Post</h1>
              <div className="w-10" /> {/* Spacer */}
            </div>
          </div>
        </div>

        {/* Post Content */}
        <div className="container mx-auto px-4 py-6">
          <div className="max-w-2xl mx-auto">
            {/* Author Info */}
            <div className="flex items-center gap-3 mb-4">
              <img 
                src={post.author?.profile_picture_url || '/pwa-512x512.png'} 
                alt={post.author?.alias}
                className="w-12 h-12 rounded-full object-cover"
                loading="lazy"
                decoding="async"
              />
              <div>
                <h3 className="font-semibold">{post.author?.alias || 'Usuario'}</h3>
                <p className="text-sm text-text-secondary">
                  {post.created_at ? new Date(post.created_at).toLocaleDateString() : 'Fecha no disponible'}
                </p>
              </div>
            </div>

            {/* Post Text */}
            {post.text && !showTemplate && (
              <div className="mb-4">
                <p className="text-base leading-relaxed">{post.text}</p>
              </div>
            )}

            {/* Template Background for text-only posts */}
            {showTemplate && (
              <div
                className="mb-4 rounded-2xl min-h-[240px] flex items-center justify-center text-center p-6"
                style={{
                  background: templateData.background,
                  color: templateTextColor,
                }}
              >
                <p className="text-2xl font-semibold whitespace-pre-wrap break-words">
                  {post.text || 'Publicación de texto'}
                </p>
              </div>
            )}

            {/* Post Media */}
            {post.image_url && (
              <div className="mb-4">
                <img 
                  src={post.image_url} 
                  alt="Post" 
                  className="w-full rounded-lg object-cover max-h-[500px]"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            )}

            {post.video_url && (
              <div className="mb-4">
                <video 
                  src={post.video_url} 
                  className="w-full rounded-lg max-h-[500px]"
                  preload="metadata"
                  playsInline
                  controls
                />
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-4 pt-4 border-t">
              <Button 
                variant="ghost" 
                size="sm" 
                className={`flex items-center gap-2 ${isLiked ? 'text-red-500' : 'text-gray-400'} hover:text-red-500 transition-colors`}
                onClick={handleLike}
              >
                <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                <span>{likesCount}</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PostPage;
