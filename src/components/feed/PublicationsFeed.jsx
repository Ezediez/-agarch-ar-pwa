import React, { useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { collection, query, orderBy, limit, getDocs, doc, getDoc, addDoc, where, deleteDoc } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { Loader2, Frown, RefreshCw, Heart, MoreHorizontal, MessageSquare, User, Eye } from 'lucide-react';
import PostCard from '@/components/discover/PostCard';
import CreatePost from '@/components/discover/CreatePost';
import AdFeedCard from './AdFeedCard';
import DirectMessageModal from '@/components/profile/DirectMessageModal';

const PublicationsFeed = forwardRef((props, ref) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [publications, setPublications] = useState([]);
  const [ads, setAds] = useState([]);
  const [mixedFeed, setMixedFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [isThreeDotsModalOpen, setIsThreeDotsModalOpen] = useState(false);
  const [followingStatus, setFollowingStatus] = useState({});

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

      // Verificar estado de seguimiento para cada autor
      const followingStatusMap = {};
      for (const post of postsData) {
        if (post.author?.id) {
          try {
            const userLikesRef = collection(db, 'user_likes');
            const userLikesQuery = query(
              userLikesRef,
              where('user_id', '==', user.uid),
              where('liked_user_id', '==', post.author.id)
            );
            const userLikesSnapshot = await getDocs(userLikesQuery);
            followingStatusMap[post.author.id] = userLikesSnapshot.size > 0;
          } catch (error) {
            console.error('Error checking follow status:', error);
            followingStatusMap[post.author.id] = false;
          }
        }
      }
      setFollowingStatus(followingStatusMap);

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
          created_at: new Date().toISOString()
        });
        toast({
          title: "❤️ Like agregado",
          description: "Tu like ha sido registrado",
        });
      } else {
        // Quitar like
        const likeDoc = existingLike.docs[0];
        await deleteDoc(doc(db, 'post_likes', likeDoc.id));
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

  const handleFollow = async (authorId) => {
    if (!user?.uid || !authorId) return;
    
    try {
      const isFollowing = followingStatus[authorId];
      
      if (isFollowing) {
        // Dejar de seguir - buscar y eliminar el like existente
        const userLikesRef = collection(db, 'user_likes');
        const userLikesQuery = query(
          userLikesRef,
          where('user_id', '==', user.uid),
          where('liked_user_id', '==', authorId)
        );
        
        const snapshot = await getDocs(userLikesQuery);
        for (const likeDoc of snapshot.docs) {
          await deleteDoc(doc(db, 'user_likes', likeDoc.id));
        }
        
        setFollowingStatus(prev => ({ ...prev, [authorId]: false }));
        toast({ 
          title: "Dejaste de seguir",
          description: "Ya no sigues a este usuario" 
        });
      } else {
        // Seguir - agregar nuevo like
        await addDoc(collection(db, 'user_likes'), {
          user_id: user.uid,
          liked_user_id: authorId,
          created_at: new Date().toISOString()
        });
        
        setFollowingStatus(prev => ({ ...prev, [authorId]: true }));
        toast({ 
          title: "¡Siguiendo!",
          description: "Ahora sigues a este usuario" 
        });
      }
      
      // Refrescar el feed
      fetchPublications();
    } catch (error) {
      console.error('Error handling follow:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo procesar la acción'
      });
    }
  };

  const handleThreeDotsMenu = (action, profile, post) => {
    switch (action) {
      case 'message':
        setSelectedProfile(profile);
        setIsMessageModalOpen(true);
        break;
      case 'profile':
        navigate(`/profile/${profile.id}`);
        break;
      case 'view':
        navigate(`/post/${post.id}`);
        break;
      default:
        break;
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPublications();
    setRefreshing(false);
  };

  // Exponer función de refresh al componente padre
  useImperativeHandle(ref, () => ({
    handleRefresh
  }));

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
                <div className="card-glass rounded-lg overflow-hidden cursor-pointer">
                  {/* 3 PUNTITOS ARRIBA - DROPDOWN */}
                  <div className="absolute top-2 right-2 z-20">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPost(item);
                        setIsThreeDotsModalOpen(selectedPost?.id === item.id ? false : true);
                      }}
                      className="bg-black/50 rounded-full p-1 text-white hover:bg-black/70 transition-colors"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                    
                    {/* Dropdown menu - aparece cerca del botón */}
                    {isThreeDotsModalOpen && selectedPost?.id === item.id && (
                      <>
                        {/* Overlay transparente para cerrar al hacer click afuera */}
                        <div 
                          className="fixed inset-0 z-30"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsThreeDotsModalOpen(false);
                            setSelectedPost(null);
                          }}
                        />
                        
                        {/* Menu dropdown */}
                        <div className="absolute top-8 right-0 z-40 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 py-1 min-w-[160px]">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsThreeDotsModalOpen(false);
                              handleThreeDotsMenu('message', selectedPost.author, selectedPost);
                              setSelectedPost(null);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 transition-colors text-left"
                          >
                            <MessageSquare className="w-4 h-4 text-blue-500" />
                            <span className="text-sm">Mensaje</span>
                          </button>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsThreeDotsModalOpen(false);
                              handleThreeDotsMenu('profile', selectedPost.author, selectedPost);
                              setSelectedPost(null);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 transition-colors text-left"
                          >
                            <User className="w-4 h-4 text-green-500" />
                            <span className="text-sm">Ver perfil</span>
                          </button>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsThreeDotsModalOpen(false);
                              handleThreeDotsMenu('view', selectedPost.author, selectedPost);
                              setSelectedPost(null);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 transition-colors text-left"
                          >
                            <Eye className="w-4 h-4 text-purple-500" />
                            <span className="text-sm">Ver post</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Imagen o video del post - CLICK ABRE POST */}
                  <div 
                    onClick={() => navigate(`/post/${item.id}`)}
                    className="aspect-square relative cursor-pointer"
                  >
                    {item.image_url && (
                      <img 
                        src={item.image_url} 
                        alt="Post" 
                        className="w-full h-full object-cover"
                      />
                    )}
                    
                    {item.video_url && (
                      <video 
                        src={item.video_url} 
                        className="w-full h-full object-cover"
                        muted
                      />
                    )}
                  </div>
                  
                  {/* Contenido del post */}
                  <div className="p-3">
                    {/* Header con avatar */}
                    <div className="flex items-center gap-2 mb-2">
                      <img 
                        src={item.author?.profile_picture_url || '/pwa-512x512.png'} 
                        alt={item.author?.alias}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                      <span className="text-sm font-medium">{item.author?.alias}</span>
                    </div>
                    
                    {/* Texto del post */}
                    {item.text && (
                      <p className="text-sm text-gray-700 mb-2 line-clamp-2">{item.text}</p>
                    )}
                    
                    {/* ACCIONES ABAJO: Like + Seguir */}
                    <div className="flex items-center justify-between">
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
                      
                      {/* Botón seguir/guardar perfil */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFollow(item.author?.id);
                        }}
                        className={`text-xs px-2 py-1 rounded-full transition-colors ${
                          followingStatus[item.author?.id] 
                            ? 'bg-red-500 text-white hover:bg-red-600' 
                            : 'bg-green-500 text-white hover:bg-green-600'
                        }`}
                      >
                        {followingStatus[item.author?.id] ? 'Siguiendo' : 'Seguir'}
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
});

PublicationsFeed.displayName = 'PublicationsFeed';

export default PublicationsFeed;