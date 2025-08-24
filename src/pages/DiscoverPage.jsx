import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast.jsx';
import { Loader2, Frown, WifiOff } from 'lucide-react';
import PostCard from '@/components/discover/PostCard';
import CreatePost from '@/components/discover/CreatePost';
import Stories from '@/components/discover/Stories';
import { Button } from '@/components/ui/button';

const DiscoverPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: rpcError } = await supabase.rpc('get_posts_with_details');

      if (rpcError) {
        throw rpcError;
      }
      
      setPosts(data);

    } catch (err) {
      console.error("Error fetching posts:", err);
      setError(err);
      toast({
        variant: "destructive",
        title: "Error de Conexión",
        description: "No se pudieron cargar las publicaciones. Revisa tu conexión e inténtalo de nuevo.",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchPosts();
    const channel = supabase
      .channel('public-posts-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, fetchPosts)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'likes' }, fetchPosts)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comentarios' }, fetchPosts)
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Realtime channel connected for posts.');
        }
        if (status === 'CHANNEL_ERROR') {
          console.error('Realtime channel error.');
          setError(new Error("Error de conexión en tiempo real."));
        }
      });
      
    return () => {
        supabase.removeChannel(channel);
    };

  }, [fetchPosts]);

  const handlePostCreated = () => {
    fetchPosts();
  };
  
  const handleLikeToggle = (postId, is_liked, likes_count) => {
    setPosts(currentPosts =>
      currentPosts.map(p =>
        p.id === postId ? { ...p, is_liked, likes_count } : p
      )
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-10 card-glass">
          <WifiOff className="mx-auto h-12 w-12 text-destructive" />
          <h3 className="mt-2 text-lg font-semibold text-text-primary">Error de Conexión</h3>
          <p className="mt-1 text-sm text-text-secondary">No se pudieron cargar las publicaciones.</p>
          <Button onClick={fetchPosts} className="mt-4">Reintentar</Button>
        </div>
      );
    }

    if (posts.length > 0) {
      return (
        <div className="space-y-6">
          {posts.map(post => (
            <PostCard 
              key={post.id} 
              post={post}
              onLikeToggle={handleLikeToggle}
            />
          ))}
        </div>
      );
    }

    return (
      <div className="text-center py-10 card-glass">
        <Frown className="mx-auto h-12 w-12 text-text-secondary" />
        <h3 className="mt-2 text-sm font-semibold text-text-primary">No hay publicaciones</h3>
        <p className="mt-1 text-sm text-text-secondary">¡Sé el primero en publicar algo!</p>
      </div>
    );
  };

  return (
    <>
      <Helmet>
        <title>Descubrir - AGARCH-AR</title>
        <meta name="description" content="Descubre publicaciones de otros usuarios en AGARCH-AR." />
      </Helmet>
      <div className="max-w-2xl mx-auto space-y-6">
        <Stories />
        <CreatePost onPostCreated={handlePostCreated} />
        {renderContent()}
      </div>
    </>
  );
};

export default DiscoverPage;