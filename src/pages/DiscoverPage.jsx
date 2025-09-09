import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { db } from '@/lib/firebase'; // 🔥 Firebase Firestore
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast.jsx';
import { Loader2, Frown, WifiOff, RefreshCw } from 'lucide-react';
import PostCard from '@/components/discover/PostCard';
import CreatePost from '@/components/discover/CreatePost';
import Stories from '@/components/discover/Stories';
import AdCard from '@/components/discover/AdCard';
import { Button } from '@/components/ui/button';

const DiscoverPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState([]);
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const POSTS_PER_PAGE = 10;

  const fetchAds = useCallback(async () => {
    try {
      // Simular anuncios mientras se configura Firebase
      const mockAds = [
        {
          id: 'ad-1',
          title: 'Restaurante El Buen Sabor',
          description: 'Comida casera y tradicional. Los mejores sabores de la región con ingredientes frescos y naturales.',
          category: 'Restaurante',
          company_info: 'Más de 20 años sirviendo a la comunidad con amor y dedicación.',
          contact_phone: '+54 11 1234-5678',
          contact_email: 'contacto@elbuensabor.com',
          contact_website: 'https://elbuensabor.com',
          cover_image: null,
          duration: '30days'
        },
        {
          id: 'ad-2', 
          title: 'Tienda Fashion Style',
          description: 'Ropa moderna y accesorios de última moda. Encuentra tu estilo único con nosotros.',
          category: 'Moda',
          company_info: 'Especialistas en tendencias y estilo personal.',
          contact_phone: '+54 11 9876-5432',
          contact_email: 'info@fashionstyle.com',
          cover_image: null,
          duration: 'once'
        },
        {
          id: 'ad-3',
          title: 'Servicios de Plomería Express',
          description: 'Reparaciones rápidas y confiables. Disponibles 24/7 para emergencias.',
          category: 'Servicios',
          company_info: 'Técnicos certificados con más de 15 años de experiencia.',
          contact_phone: '+54 11 5555-0000',
          contact_email: 'urgencias@plomeriaexpress.com',
          cover_image: null,
          duration: '30days'
        }
      ];
      
      setAds(mockAds);
    } catch (error) {
      console.error('Error fetching ads:', error);
    }
  }, []);

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
        setLoading(false);
        setRefreshing(false);
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
            author: profileData, // Cambiar profiles por author para compatibilidad con PostCard
            profiles: profileData, // Mantener profiles por compatibilidad
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

  // Función para intercalar anuncios cada 8 posts
  const createMixedContent = useCallback((posts, ads) => {
    if (!posts.length) return [];
    
    const mixedContent = [];
    let adIndex = 0;
    
    posts.forEach((post, index) => {
      mixedContent.push({ type: 'post', data: post, key: `post-${post.id}` });
      
      // Intercalar anuncio cada 8 posts (índices 7, 15, 23, etc.)
      if ((index + 1) % 8 === 0 && ads.length > 0) {
        const ad = ads[adIndex % ads.length];
        mixedContent.push({ 
          type: 'ad', 
          data: ad, 
          key: `ad-${ad.id}-${Math.floor(index / 8)}`,
          adIndex: adIndex % ads.length
        });
        adIndex++;
      }
    });
    
    return mixedContent;
  }, []);

  // Memoizar el contenido mixto para evitar re-renders innecesarios
  const memoizedContent = useMemo(() => createMixedContent(posts, ads), [posts, ads, createMixedContent]);

  useEffect(() => {
    fetchPosts(true);
    fetchAds();
  }, [fetchAds]);

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
      db.removeChannel(channel);
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

    if (memoizedContent.length > 0) {
      return (
        <div className="space-y-4">
          {memoizedContent.map((item) => {
            if (item.type === 'post') {
              return (
                <PostCard
                  key={item.key}
                  post={item.data}
                  onLikeToggle={handleLikeToggle}
                />
              );
            } else if (item.type === 'ad') {
              return (
                <AdCard
                  key={item.key}
                  ad={item.data}
                  index={item.adIndex}
                />
              );
            }
            return null;
          })}
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
