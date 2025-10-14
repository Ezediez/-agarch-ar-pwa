import React, { useState, useEffect, useCallback } from 'react';
import { collection, query, orderBy, limit, getDocs, doc, getDoc, addDoc, where } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { Loader2, Frown, RefreshCw, Heart, MoreHorizontal } from 'lucide-react';
import PostCard from '@/components/discover/PostCard';
import CreatePost from '@/components/discover/CreatePost';
import AdFeedCard from './AdFeedCard';
import DirectMessageModal from '@/components/profile/DirectMessageModal';

const PublicationsFeed = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [publications, setPublications] = useState([]);
  const [ads, setAds] = useState([]);
  const [mixedFeed, setMixedFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);

  const fetchPublications = useCallback(async () => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Obtener posts de usuarios (no perfiles, sino publicaciones)
      const postsRef = collection(db, 'posts');
      const postsQuery = query(
        postsRef,
        orderBy('created_at', 'desc'),
        limit(20)
      );
      const postsSnapshot = await getDocs(postsQuery);
      const postsData = await Promise.all(
        postsSnapshot.docs.map(async (postDoc) => {
          const postData = { id: postDoc.id, ...postDoc.data() };
          
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
            postData.likes = likesSnapshot.docs.map(likeDoc => ({ id: likeDoc.id, ...likeDoc.data() }));
            postData.likes_count = postData.likes.length;
            postData.is_liked = postData.likes.some(like => like.user_id === user.uid);
          } catch (error) {
            console.error('Error fetching likes:', error);
            postData.likes = [];
            postData.likes_count = 0;
            postData.is_liked = false;
          }
          
          return postData;
        })
      );

      // Obtener publicidades activas
      const adsRef = collection(db, 'advertisements');
      const adsQuery = query(
        adsRef,
        where('status', '==', 'active'),
        limit(10)
      );
      const adsSnapshot = await getDocs(adsQuery);
      let adsData = adsSnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        type: 'ad',
        source: 'advertising_portal'
      }));

      // Agregar banners promocionales SIEMPRE
      const promoBanners = [
        {
          id: 'banner-vip',
          type: 'promo',
          title: 'Obtené VIP',
          description: 'Tu perfil destacado por 30 días',
          image_url: '/pwa-512x512.png',
          price: 15,
          promo_type: 'VIP',
          ad_type: 'promo'
        },
        {
          id: 'banner-automarket',
          title: 'AutoMarket',
          description: 'Compra y venta de autos',
          type: 'promo',
          image_url: '/pwa-512x512.png',
          website: 'https://auto-market.pro',
          promo_type: 'AUTOMARKET',
          ad_type: 'promo'
        }
      ];
      
      // Combinar todas las publicidades
      adsData = [...adsData, ...promoBanners];

      setPublications(postsData);
      setAds(adsData);
      
      // ALGORITMO: Intercalar cada 6 posts con 2 publicidades
      const mixed = [];
      let adIndex = 0;
      
      // Si no hay posts, mostrar solo publicidades
      if (postsData.length === 0) {
        mixed.push(...adsData);
      } else {
        // Intercalar cada 6 posts con 2 publicidades
        for (let i = 0; i < postsData.length; i += 6) {
          // Agregar 6 posts
          const postBatch = postsData.slice(i, i + 6);
          mixed.push(...postBatch);
          
          // Agregar 2 publicidades si hay disponibles
          if (adIndex < adsData.length) {
            const adBatch = adsData.slice(adIndex, adIndex + 2);
            mixed.push(...adBatch);
            adIndex += 2;
          }
        }
        
        // Si quedan publicidades sin mostrar, agregarlas al final
        if (adIndex < adsData.length) {
          const remainingAds = adsData.slice(adIndex);
          mixed.push(...remainingAds);
        }
      }
      
      setMixedFeed(mixed);
    } catch (error) {
      console.error('Error fetching publications:', error);
      setMixedFeed([]);
    } finally {
      setLoading(false);
    }
  }, [user?.uid, toast]);

  useEffect(() => {
    fetchPublications();
  }, [fetchPublications]);

  const handleLike = async (postId) => {
    if (!user?.uid) return;
    
    try {
      // Verificar si ya le dio like
      const likesRef = collection(db, 'post_likes');
      const likeQuery = query(likesRef, where('post_id', '==', postId), where('user_id', '==', user.uid));
      const existingLike = await getDocs(likeQuery);
      
      if (existingLike.empty) {
        // Dar like
        await addDoc(likesRef, {
          post_id: postId,
          user_id: user.uid,
          created_at: new Date()
        });
        toast({
          title: "❤️ Like agregado",
          description: "Tu like ha sido registrado",
        });
      } else {
        // Quitar like
        const likeDoc = existingLike.docs[0];
        await addDoc(collection(db, 'post_likes'), {
          post_id: postId,
          user_id: user.uid,
          created_at: new Date(),
          action: 'unlike'
        });
        toast({
          title: "💔 Like removido",
          description: "Tu like ha sido removido",
        });
      }
      
      // Refrescar el feed
      fetchPublications();
    } catch (error) {
      console.error('Error handling like:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo procesar el like'
      });
    }
  };

  const handleProfileMenuClick = (profile) => {
    setSelectedProfile(profile);
    setIsMessageModalOpen(true);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPublications();
    setRefreshing(false);
  };

  if (loading && mixedFeed.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-text-secondary">Cargando publicaciones...</p>
        </div>
      </div>
    );
  }

  if (mixedFeed.length === 0 && !loading) {
    return (
      <div className="text-center py-12">
        <Frown className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-600 mb-2">No hay publicaciones</h3>
        <p className="text-gray-500 mb-4">Sé el primero en compartir algo</p>
        <CreatePost />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con botón de refresh */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-primary">Descubrir</h2>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Botón de crear post */}
      <CreatePost />

      {/* Feed mixto en GRID DE 2 COLUMNAS */}
      <div className="grid grid-cols-2 gap-4">
        {mixedFeed.map((item, index) => (
          <div key={item.id || index} className="relative">
            {item.type === 'ad' || item.type === 'promo' ? (
              <AdFeedCard ad={item} />
            ) : (
              <div className="relative">
                {/* Post card con funcionalidad completa */}
                <div 
                  className="card-glass rounded-lg overflow-hidden cursor-pointer"
                  onClick={() => navigate(`/post/${item.id}`)}
                >
                  {/* Imagen o video del post */}
                  {item.image_url && (
                    <div className="aspect-square relative">
                      <img 
                        src={item.image_url} 
                        alt="Post" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
                  {item.video_url && (
                    <div className="aspect-square relative">
                      <video 
                        src={item.video_url} 
                        className="w-full h-full object-cover"
                        muted
                      />
                    </div>
                  )}
                  
                  {/* Contenido del post */}
                  <div className="p-3">
                    {/* Header con avatar y 3 puntitos */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <img 
                          src={item.author?.profile_picture_url || '/pwa-512x512.png'} 
                          alt={item.author?.alias}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                        <span className="text-sm font-medium">{item.author?.alias}</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleProfileMenuClick(item.author);
                        }}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                    
                    {/* Texto del post */}
                    {item.text && (
                      <p className="text-sm text-gray-700 mb-2 line-clamp-2">{item.text}</p>
                    )}
                    
                    {/* Likes */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLike(item.id);
                        }}
                        className={`flex items-center gap-1 ${
                          item.is_liked ? 'text-red-500' : 'text-gray-400'
                        } hover:text-red-500 transition-colors`}
                      >
                        <Heart className={`w-4 h-4 ${item.is_liked ? 'fill-current' : ''}`} />
                        <span className="text-xs">{item.likes_count}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Loader para cargar más */}
      {loading && mixedFeed.length > 0 && (
        <div className="flex justify-center py-4">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      )}

      {/* Modal de mensaje directo */}
      {selectedProfile && (
        <DirectMessageModal 
          profile={selectedProfile} 
          onClose={() => {
            setIsMessageModalOpen(false);
            setSelectedProfile(null);
          }}
        />
      )}
    </div>
  );
};

export default PublicationsFeed;