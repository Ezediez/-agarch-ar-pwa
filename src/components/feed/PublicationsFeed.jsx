import React, { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, limit, getDocs, doc, getDoc, addDoc, where } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast.jsx';
import { useNavigate } from 'react-router-dom';
import { Loader2, Frown, MoreHorizontal, Heart, MessageCircle, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import DirectMessageModal from '@/components/profile/DirectMessageModal';
import AdFeedCard from '@/components/feed/AdFeedCard';

const PublicationsFeed = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [publications, setPublications] = useState([]);
  const [ads, setAds] = useState([]);
  const [mixedFeed, setMixedFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [showMessageModal, setShowMessageModal] = useState(false);

  const fetchPublications = useCallback(async () => {
    if (!user?.uid) return;
    
    try {
      setLoading(true);
      
            // Obtener publicaciones de perfiles (sin orderBy para evitar error 400)
            const postsRef = collection(db, 'posts');
            const postsQuery = query(
                postsRef,
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
          
      // Obtener likes del post (simplificado para evitar error 400)
      try {
        const likesRef = collection(db, 'post_likes');
        const likesQuery = query(likesRef, where('post_id', '==', postData.id));
        const likesSnapshot = await getDocs(likesQuery);
        postData.likes = likesSnapshot.docs.map(likeDoc => ({ id: likeDoc.id, ...likeDoc.data() }));
      } catch (error) {
        console.error('Error fetching likes:', error);
        postData.likes = [];
      }
          
          return postData;
        })
      );

            // Obtener publicidades activas desde Portal de Anunciantes
            const adsRef = collection(db, 'advertisements');
            const adsQuery = query(
                adsRef,
                where('status', '==', 'active'),
                limit(10)
            );
      const adsSnapshot = await getDocs(adsQuery);
      const adsData = adsSnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        type: 'ad', // Marcar como publicidad
        source: 'advertising_portal' // Marcar origen desde Portal de Anunciantes
      }));

      setPublications(postsData);
      setAds(adsData);
      
      // Mezclar siguiendo la regla: cada 6 publicaciones, 2 publicidades
      const mixed = [];
      let adIndex = 0;
      
      for (let i = 0; i < postsData.length; i += 6) {
        // Agregar 6 publicaciones
        const postBatch = postsData.slice(i, i + 6);
        mixed.push(...postBatch);
        
        // Agregar 2 publicidades si hay disponibles
        if (adIndex < adsData.length) {
          const adBatch = adsData.slice(adIndex, adIndex + 2);
          mixed.push(...adBatch);
          adIndex += 2;
        }
      }
      
      setMixedFeed(mixed);
    } catch (error) {
      console.error('Error fetching publications:', error);
      // Si no hay datos, mostrar feed vacío en lugar de error
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
      // Implementar lógica de like en Firestore
      const likeRef = collection(db, 'post_likes');
      await addDoc(likeRef, {
        post_id: postId,
        user_id: user.uid,
        created_at: new Date()
      });
      
      toast({
        title: 'Me gusta',
        description: 'Has dado me gusta a esta publicación.'
      });
      
      // Refrescar datos
      fetchPublications();
    } catch (error) {
      console.error('Error liking post:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo dar me gusta a la publicación.'
      });
    }
  };

  const handleMessage = (profile) => {
    setSelectedProfile(profile);
    setShowMessageModal(true);
  };

  const handleFollow = async (profileId) => {
    if (!user?.uid) return;
    
    try {
      // Implementar lógica de seguir en Firestore
      const followRef = collection(db, 'user_likes');
      await addDoc(followRef, {
        user_id: user.uid,
        liked_user_id: profileId,
        created_at: new Date()
      });
      
      toast({
        title: 'Perfil guardado',
        description: 'Has guardado este perfil en tu lista.'
      });
    } catch (error) {
      console.error('Error following profile:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo guardar el perfil.'
      });
    }
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Cargando publicaciones...</span>
      </div>
    );
  }

  if (mixedFeed.length === 0) {
    return (
      <div className="text-center py-8">
        <Frown className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">No hay publicaciones</h3>
        <p className="text-muted-foreground">Sé el primero en crear contenido.</p>
      </div>
    );
  }

  return (
    <div className="px-4 pb-20">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {mixedFeed.map((item, index) => (
          <div key={item.id || index} className="space-y-3">
            {item.type === 'ad' || item.website ? (
              // Publicidad
              <AdFeedCard ad={item} />
            ) : (
              // Publicación de perfil
              <div className="bg-card rounded-lg overflow-hidden border">
                {/* Header de la publicación */}
                <div className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-2">
                    <img
                      src={item.author?.profile_picture_url || '/pwa-512x512.png'}
                      alt={item.author?.alias || 'Usuario'}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-medium text-sm">{item.author?.alias || 'Usuario'}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Ahora'}
                      </p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="card-glass">
                      <DropdownMenuItem 
                        onClick={() => handleLike(item.id)}
                        className="flex items-center gap-2"
                      >
                        <Heart className="w-4 h-4" />
                        <span>Me gusta</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleMessage(item.author)}
                        className="flex items-center gap-2"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>Mensaje</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleFollow(item.author?.id)}
                        className="flex items-center gap-2"
                      >
                        <UserPlus className="w-4 h-4" />
                        <span>Guardar perfil</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Contenido de la publicación */}
                <div>
                  {item.image_url && (
                    <img
                      src={item.image_url}
                      alt="Publicación"
                      className="w-full h-48 object-cover"
                    />
                  )}
                  {item.video_url && (
                    <video
                      src={item.video_url}
                      controls
                      className="w-full h-48 object-cover"
                    />
                  )}
                  {item.text && (
                    <p className="p-3 text-sm">{item.text}</p>
                  )}
                </div>

                {/* Acciones simplificadas - solo mostrar contador de likes */}
                <div className="flex items-center justify-between p-3 border-t">
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {item.likes?.length || 0} me gusta
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Usa el menú ⋯ para más opciones
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal de mensaje */}
      {showMessageModal && selectedProfile && (
        <DirectMessageModal
          profile={selectedProfile}
          onClose={() => {
            setShowMessageModal(false);
            setSelectedProfile(null);
          }}
        />
      )}

    </div>
  );
};

export default PublicationsFeed;
