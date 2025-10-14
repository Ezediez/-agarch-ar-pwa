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
      
      // Obtener perfiles de usuarios ordenados por fecha de creación (más nuevos primero)
      const profilesRef = collection(db, 'profiles');
      const profilesQuery = query(
        profilesRef,
        orderBy('created_at', 'desc'),
        limit(20)
      );
      const profilesSnapshot = await getDocs(profilesQuery);
      const userProfiles = profilesSnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(), 
        type: 'profile' 
      }));

      setCarouselItems(userProfiles);
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
    // Solo manejar perfiles de usuarios
    if (item.type === 'profile') {
      navigate(`/profile/${item.id}`);
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
        {/* Botón "Mi Perfil" */}
        <div className="flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="w-16 h-16 rounded-full flex flex-col items-center justify-center gap-1 bg-muted/50 hover:bg-muted"
            onClick={() => navigate('/my-profile')}
          >
            <Plus className="w-6 h-6" />
            <span className="text-xs">Mi Perfil</span>
          </Button>
        </div>

        {/* Items del carrusel - Solo perfiles de usuarios */}
        {carouselItems.map((item, index) => (
          <div key={`${item.type}-${item.id}`} className="flex-shrink-0">
            <button
              onClick={() => handleItemClick(item)}
              className="w-16 h-16 rounded-full relative overflow-hidden border-2 border-transparent hover:border-primary transition-colors"
            >
              {/* Solo perfiles de usuarios */}
              <div className="relative w-full h-full">
                <img
                  src={item.profile_picture_url || '/pwa-512x512.png'}
                  alt={item.alias || 'Usuario'}
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
              </div>
            </button>
            <div className="text-center mt-1">
              <span className="text-xs text-muted-foreground truncate w-16 block">
                {item.alias || 'Usuario'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VipCarousel;
