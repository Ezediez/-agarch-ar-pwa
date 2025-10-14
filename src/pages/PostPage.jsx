import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, Loader2, Heart, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PostPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

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
  }, [id, navigate]);

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
              />
              <div>
                <h3 className="font-semibold">{post.author?.alias || 'Usuario'}</h3>
                <p className="text-sm text-text-secondary">
                  {post.created_at ? new Date(post.created_at).toLocaleDateString() : 'Fecha no disponible'}
                </p>
              </div>
            </div>

            {/* Post Text */}
            {post.text && (
              <div className="mb-4">
                <p className="text-base leading-relaxed">{post.text}</p>
              </div>
            )}

            {/* Post Media */}
            {post.image_url && (
              <div className="mb-4">
                <img 
                  src={post.image_url} 
                  alt="Post" 
                  className="w-full rounded-lg object-cover max-h-[500px]"
                />
              </div>
            )}

            {post.video_url && (
              <div className="mb-4">
                <video 
                  src={post.video_url} 
                  className="w-full rounded-lg max-h-[500px]"
                  controls
                />
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-4 pt-4 border-t">
              <Button variant="ghost" size="sm" className="flex items-center gap-2">
                <Heart className="w-5 h-5" />
                <span>Like</span>
              </Button>
              <Button variant="ghost" size="sm" className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                <span>Comentar</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PostPage;
