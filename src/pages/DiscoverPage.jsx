import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast.jsx';
import { Loader2, Frown, WifiOff, RefreshCw } from 'lucide-react';
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
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const POSTS_PER_PAGE = 10;

  const fetchPosts = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
      setPage(0);
    } else {
      setLoading(true);
    }
    setError(null);
    
    try {
      const from = isRefresh ? 0 : page * POSTS_PER_PAGE;
      const to = from + POSTS_PER_PAGE - 1;

      // Primero obtener los posts
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, to);

      if (postsError) {
        throw postsError;
      }

      // Si no hay posts, devolver array vacío
      if (!postsData || postsData.length === 0) {
        if (isRefresh) {
          setPosts([]);
        }
        setHasMore(false);
        return;
      }

      // Luego obtener los perfiles para cada post
      const postsWithProfiles = await Promise.all(
        postsData.map(async (post) => {
          // Obtener perfil del usuario (obligatorio)
          const { data: profileData } = await supabase
            .from('profiles')
            .select('id, alias, profile_picture_url, is_vip, is_verified')
            .eq('id', post.user_id)
            .single();

          // Obtener likes del post (opcional, no bloquear si falla)
          let likesData = [];
          try {
            const { data } = await supabase
              .from('post_likes')
              .select('id, user_id')
              .eq('post_id', post.id);
            likesData = data || [];
          } catch (error) {
            console.log('Post likes not found for post:', post.id);
          }

          // Obtener comentarios (opcional, no bloquear si falla)
          let commentsData = [];
          try {
            const { data } = await supabase
              .from('comentarios')
              .select('id, usuario_id, texto, creado_en')
              .eq('publicacion_id', post.id);
            commentsData = data || [];
          } catch (error) {
            console.log('Comments not found for post:', post.id);
          }

          return {
            ...post,
            profiles: profileData,
            likes: likesData,
            comentarios: commentsData
          };
        })
      );

      const data = postsWithProfiles;
      
      if (isRefresh) {
        setPosts(data || []);
      } else {
        setPosts(prev => [...prev, ...(data || [])]);
      }
      
      setHasMore((data || []).length === POSTS_PER_PAGE);

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
      setRefreshing(false);
    }
  }, [toast, page]);

  // Memoizar los posts para evitar re-renders innecesarios
  const memoizedPosts = useMemo(() => posts, [posts]);

  useEffect(() => {
    fetchPosts(true);
  }, []);

  // Configurar realtime con debounce para evitar demasiadas actualizaciones
  useEffect(() => {
    let timeoutId;
    const channel = supabase
      .channel('public-posts-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => {
        // Debounce las actualizaciones
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          fetchPosts(true);
        }, 1000);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'post_likes' }, () => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          fetchPosts(true);
        }, 500);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comentarios' }, () => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          fetchPosts(true);
        }, 500);
      })
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
      clearTimeout(timeoutId);
      supabase.removeChannel(channel);
    };
  }, [fetchPosts]);

  const handlePostCreated = useCallback(() => {
    fetchPosts(true);
  }, [fetchPosts]);
  
  const handleLikeToggle = useCallback((postId, is_liked, likes_count) => {
    setPosts(currentPosts =>
      currentPosts.map(p =>
        p.id === postId ? { ...p, is_liked, likes_count } : p
      )
    );
  }, []);

  const handleLoadMore = useCallback(() => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
      fetchPosts();
    }
  }, [loading, hasMore, fetchPosts]);

  const renderContent = () => {
    if (loading && !refreshing) {
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
          <Button onClick={() => fetchPosts(true)} className="mt-4 btn-action">
            <RefreshCw className="w-4 h-4 mr-2" />
            Reintentar
          </Button>
        </div>
      );
    }

    if (memoizedPosts.length > 0) {
      return (
        <div className="space-y-4">
          {memoizedPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onLikeToggle={handleLikeToggle}
            />
          ))}
          {hasMore && (
            <div className="text-center py-4">
              <Button 
                onClick={handleLoadMore} 
                disabled={loading}
                variant="outline"
                className="btn-outline-action"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Cargando...
                  </>
                ) : (
                  'Cargar más'
                )}
              </Button>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="text-center py-10 card-glass">
        <Frown className="mx-auto h-12 w-12 text-text-secondary" />
        <h3 className="mt-2 text-lg font-semibold text-text-primary">No hay publicaciones</h3>
        <p className="mt-1 text-sm text-text-secondary">Sé el primero en compartir algo.</p>
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