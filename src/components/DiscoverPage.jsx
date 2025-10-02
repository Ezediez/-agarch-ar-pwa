import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, limit, getDocs, doc, getDoc, where } from 'firebase/firestore';
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
      // Obtener anuncios activos desde Firebase
      const adsRef = collection(db, 'advertisements');
      const adsQuery = query(
        adsRef,
        where('status', '==', 'active'),
        orderBy('created_at', 'desc'),
        limit(10)
      );
      
      const adsSnapshot = await getDocs(adsQuery);
      const adsData = adsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Si no hay anuncios en Firebase, usar anuncios promocionales de nuestra app
      if (adsData.length === 0) {
        const mockAds = [
          {
            id: 'agarch-vip',
            title: '¡Hazte VIP en AGARCH-AR!',
            description: 'Desbloquea todas las funciones premium: historias ilimitadas, perfil destacado, acceso prioritario y mucho más.',
            category: 'Premium',
            company_info: 'Únete a la comunidad VIP y lleva tu experiencia al siguiente nivel.',
            contact_phone: null,
            contact_email: null,
            contact_website: '/payments',
            cover_image: null,
            duration: 'premium',
            is_app_promo: true,
            promo_type: 'vip'
          },
          {
            id: 'automarket-app', 
            title: 'AUTOMARKET - Tu App de Autos',
            description: 'Encuentra, vende y compra autos de forma fácil y segura. Miles de vehículos disponibles.',
            category: 'Automóviles',
            company_info: 'La plataforma líder en compraventa de autos en Argentina.',
            contact_phone: '+54 11 1234-5678',
            contact_email: 'info@auto-market.pro',
            contact_website: 'https://auto-market.pro',
            cover_image: null,
            duration: 'premium',
            is_app_promo: true,
            promo_type: 'automarket'
          }
        ];
        setAds(mockAds);
      } else {
        setAds(adsData);
      }
    } catch (error) {
      console.error('Error fetching ads:', error);
      // En caso de error, usar anuncios promocionales de nuestra app
      const mockAds = [
        {
          id: 'agarch-vip',
          title: '¡Hazte VIP en AGARCH-AR!',
          description: 'Desbloquea todas las funciones premium: historias ilimitadas, perfil destacado, acceso prioritario y mucho más.',
          category: 'Premium',
          company_info: 'Únete a la comunidad VIP y lleva tu experiencia al siguiente nivel.',
          contact_phone: null,
          contact_email: null,
          contact_website: '/payments',
          cover_image: null,
          duration: 'premium',
          is_app_promo: true,
          promo_type: 'vip'
        },
        {
          id: 'automarket-app', 
          title: 'AUTOMARKET - Tu App de Autos',
          description: 'Encuentra, vende y compra autos de forma fácil y segura. Miles de vehículos disponibles.',
          category: 'Automóviles',
          company_info: 'La plataforma líder en compraventa de autos en Argentina.',
          contact_phone: '+54 11 1234-5678',
          contact_email: 'info@auto-market.pro',
          contact_website: 'https://auto-market.pro',
          cover_image: null,
          duration: 'premium',
          is_app_promo: true,
          promo_type: 'automarket'
        }
      ];
      setAds(mockAds);
    }
  }, []);

  const fetchPosts = useCallback(async (isRefresh = false) => {
    if (!user) return;
    
    try {
      setError(null);
      if (isRefresh) {
        setRefreshing(true);
      } else {
    setLoading(true);
      }

      const from = isRefresh ? 0 : page * POSTS_PER_PAGE;

      // Obtener posts desde Firebase
      const postsRef = collection(db, 'posts');
      const postsQuery = query(
        postsRef,
        orderBy('created_at', 'desc'),
        limit(POSTS_PER_PAGE)
      );
      const postsSnapshot = await getDocs(postsQuery);
      const postsData = postsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      if (!postsData || postsData.length === 0) {
        setHasMore(false);
        if (isRefresh) {
          setPosts([]);
        }
        return;
      }

      // Obtener perfiles para cada post
      const postsWithProfiles = await Promise.all(
        postsData.map(async (post) => {
          try {
            // Obtener perfil del usuario
            const profileRef = doc(db, 'profiles', post.user_id);
            const profileSnap = await getDoc(profileRef);
            const profileData = profileSnap.exists() ? profileSnap.data() : null;

            // Obtener likes del post
            let likesData = [];
            try {
              const likesRef = collection(db, 'post_likes');
              const likesQuery = query(likesRef, where('post_id', '==', post.id));
              const likesSnapshot = await getDocs(likesQuery);
              likesData = likesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            } catch (error) {
              console.log('Post likes not found for post:', post.id);
            }

            // Obtener comentarios
            let commentsData = [];
            try {
              const commentsRef = collection(db, 'comentarios');
              const commentsQuery = query(commentsRef, where('publicacion_id', '==', post.id));
              const commentsSnapshot = await getDocs(commentsQuery);
              commentsData = commentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            } catch (error) {
              console.log('Comments not found for post:', post.id);
            }

            return {
              ...post,
              profile: profileData,
              likes: likesData,
              comments: commentsData,
              likes_count: likesData.length,
              comments_count: commentsData.length
            };
          } catch (error) {
            console.error('Error processing post:', post.id, error);
            return {
              ...post,
              profile: null,
              likes: [],
              comments: [],
              likes_count: 0,
              comments_count: 0
            };
          }
        })
      );

      // Filtrar posts que tienen perfil válido
      const validPosts = postsWithProfiles.filter(post => post.profile);

      if (isRefresh) {
        setPosts(validPosts);
        setPage(1);
      } else {
        setPosts(prevPosts => [...prevPosts, ...validPosts]);
        setPage(prevPage => prevPage + 1);
      }

      if (validPosts.length < POSTS_PER_PAGE) {
        setHasMore(false);
      }

    } catch (error) {
      console.error('Error fetching posts:', error);
      setError('Error al cargar los posts. Intenta nuevamente.');
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar los posts. Verifica tu conexión.",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, page, toast]);

  useEffect(() => {
    if (user) {
      fetchPosts();
      fetchAds();
    }
  }, [user, fetchPosts, fetchAds]);

  const handleRefresh = useCallback(() => {
    setPage(0);
    setHasMore(true);
    fetchPosts(true);
  }, [fetchPosts]);

  const handleLoadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchPosts();
    }
  }, [loading, hasMore, fetchPosts]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Frown className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Inicia sesión para ver contenido</h2>
          <p className="text-muted-foreground">Necesitas estar autenticado para acceder a esta sección.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Descubrir - AGARCH-AR</title>
        <meta name="description" content="Descubre nuevas personas y contenido interesante en AGARCH-AR" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <div className="max-w-md mx-auto bg-background">
          {/* Header */}
          <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
            <div className="flex items-center justify-between p-4">
              <h1 className="text-xl font-bold">Descubrir</h1>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                </Button>
              </div>
          </div>

          {/* Stories */}
          <Stories />

          {/* Create Post */}
          <div className="p-4">
            <CreatePost onPostCreated={handleRefresh} />
      </div>

          {/* Posts y Ads intercalados */}
          <div className="px-4 pb-20">
            {loading && posts.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Cargando posts...</span>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <WifiOff className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Error de conexión</h3>
                <p className="text-muted-foreground mb-4">{error}</p>
                <Button onClick={handleRefresh} variant="outline">
                  Intentar nuevamente
                </Button>
      </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-8">
                <Frown className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No hay posts</h3>
                <p className="text-muted-foreground">Sé el primero en crear contenido.</p>
    </div>
            ) : (
              <>
                <div className="space-y-4">
                  {posts.map((post, index) => {
                    // Mostrar banner cada 6 posts (posts 5, 11, 17, etc.)
                    const shouldShowBanner = (index + 1) % 6 === 0 && ads.length > 0;
                    const adIndex = Math.floor((index + 1) / 6) - 1;
                    const ad = ads[adIndex % ads.length];
                    
                    return (
                      <div key={post.id}>
                        <PostCard 
                          post={post} 
                          onLike={() => handleRefresh()}
                          onComment={() => handleRefresh()}
                        />
                        {shouldShowBanner && (
                          <div className="my-4">
                            <AdCard key={`ad-${adIndex}`} ad={ad} index={adIndex} />
                          </div>
                        )}
                      </div>
                    );
                  })}
  </div>

                {/* Load More */}
                {hasMore && (
                  <div className="flex justify-center py-4">
                    <Button
                      variant="outline"
                      onClick={handleLoadMore}
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Cargando...
                        </>
                      ) : (
                        'Cargar más'
                      )}
        </Button>
          </div>
                )}
              </>
            )}
          </div>
          </div>
        </div>
    </>
  );
};

export default DiscoverPage;
