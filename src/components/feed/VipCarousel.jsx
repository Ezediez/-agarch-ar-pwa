import React, { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, getDocs, orderBy, limit, doc, getDoc, where } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast.jsx';
import { useNavigate } from 'react-router-dom';
import { Plus, Star, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';

const VipCarousel = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [carouselItems, setCarouselItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCarouselData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Obtener perfiles VIP (mejor posicionados) - simplificado sin filtros complejos
      const profilesRef = collection(db, 'profiles');
      const vipQuery = query(
        profilesRef,
        orderBy('created_at', 'desc'),
        limit(10)
      );
      const vipSnapshot = await getDocs(vipQuery);
      const vipProfiles = vipSnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(), 
        type: 'vip' 
      }));

      // Obtener historias de usuarios (últimas 24 horas)
      const storiesRef = collection(db, 'stories');
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const storiesQuery = query(
        storiesRef,
        where('created_at', '>', yesterday),
        orderBy('created_at', 'desc'),
        limit(8)
      );
      const storiesSnapshot = await getDocs(storiesQuery);
      const stories = await Promise.all(
        storiesSnapshot.docs.map(async (storyDoc) => {
          const storyData = { id: storyDoc.id, ...storyDoc.data(), type: 'story' };
          
          // Obtener perfil del autor de la historia
          try {
            const profileRef = doc(db, 'profiles', storyData.user_id);
            const profileSnap = await getDoc(profileRef);
            if (profileSnap.exists()) {
              storyData.author = { id: profileSnap.id, ...profileSnap.data() };
            }
          } catch (error) {
            console.error('Error fetching story author profile:', error);
          }
          
          return storyData;
        })
      );

      // Obtener publicidades pagas desde Portal de Anunciantes - simplificado
      const adsRef = collection(db, 'advertisements');
      const adsQuery = query(
        adsRef,
        orderBy('created_at', 'desc'),
        limit(4)
      );
      const adsSnapshot = await getDocs(adsQuery);
      const ads = adsSnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(), 
        type: 'ad',
        source: 'advertising_portal' // Marcar origen desde Portal de Anunciantes
      }));

      // Mezclar siguiendo la regla: cada 6 perfiles/historias, 2 publicidades
      const mixedItems = [];
      let profileIndex = 0;
      let adIndex = 0;
      
      // Combinar perfiles VIP y historias
      const allProfiles = [...vipProfiles, ...stories];
      
      for (let i = 0; i < allProfiles.length; i += 6) {
        // Agregar 6 perfiles/historias
        const profileBatch = allProfiles.slice(i, i + 6);
        mixedItems.push(...profileBatch);
        
        // Agregar 2 publicidades si hay disponibles
        if (adIndex < ads.length) {
          const adBatch = ads.slice(adIndex, adIndex + 2);
          mixedItems.push(...adBatch);
          adIndex += 2;
        }
      }

      setCarouselItems(mixedItems);
    } catch (error) {
      console.error('Error fetching carousel data:', error);
      // Si no hay datos, mostrar carrusel vacío en lugar de error
      setCarouselItems([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (user?.uid) {
      fetchCarouselData();
    }
  }, [user?.uid, fetchCarouselData]);

  const handleItemClick = (item) => {
    switch (item.type) {
      case 'vip':
        navigate(`/profile/${item.id}`);
        break;
      case 'story':
        // Abrir modal de historia
        toast({
          title: 'Historia',
          description: 'Funcionalidad de historias en desarrollo.'
        });
        break;
      case 'ad':
        // Abrir enlace de publicidad
        if (item.website) {
          window.open(item.website, '_blank');
        }
        break;
      default:
        break;
    }
  };

  if (loading) {
    return (
      <div className="px-4 py-2">
        <div className="flex gap-3 overflow-x-auto">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex-shrink-0 w-16 h-16 bg-muted rounded-full animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-2">
      <div className="flex gap-3 overflow-x-auto pb-2">
        {/* Botón "Tu Historia" */}
        <div className="flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="w-16 h-16 rounded-full flex flex-col items-center justify-center gap-1 bg-muted/50 hover:bg-muted"
            onClick={() => navigate('/my-profile')}
          >
            <Plus className="w-6 h-6" />
            <span className="text-xs">Tu historia</span>
          </Button>
        </div>

        {/* Items del carrusel */}
        {carouselItems.map((item, index) => (
          <div key={`${item.type}-${item.id}`} className="flex-shrink-0">
            <button
              onClick={() => handleItemClick(item)}
              className="w-16 h-16 rounded-full relative overflow-hidden border-2 border-transparent hover:border-primary transition-colors"
            >
              {item.type === 'ad' ? (
                // Publicidad
                <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <Star className="w-8 h-8 text-white" />
                </div>
              ) : (
                // Perfil o Historia
                <div className="relative w-full h-full">
                  <img
                    src={item.profile_picture_url || item.media_url || '/pwa-512x512.png'}
                    alt={item.alias || item.author?.alias || 'Usuario'}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = '/pwa-512x512.png';
                    }}
                  />
                  {item.is_vip && (
                    <div className="absolute -top-1 -right-1">
                      <Crown className="w-4 h-4 text-yellow-500 fill-current" />
                    </div>
                  )}
                  {item.type === 'story' && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  )}
                </div>
              )}
            </button>
            <div className="text-center mt-1">
              <span className="text-xs text-muted-foreground truncate w-16 block">
                {item.type === 'ad' ? 'Publicidad' : (item.alias || item.author?.alias || 'Usuario')}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VipCarousel;
