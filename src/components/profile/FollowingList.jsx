import React, { useState, useEffect, useCallback } from 'react';
import { db, auth, storage } from '@/lib/firebase'; // 🔥 Firebase client
import { collection, query, where, getDocs, deleteDoc, doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast.jsx';
import { Heart, MessageCircle, User, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const FollowingList = ({ followingIds = [], isOwnProfile = false }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [following, setFollowing] = useState([]);
  const [filteredFollowing, setFilteredFollowing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNearbyOnly, setShowNearbyOnly] = useState(false);

  const fetchFollowing = async () => {
    try {
      setLoading(true);
      
      if (!user?.uid) {
        setFollowing([]);
        return;
      }
      
      console.log('🔍 FollowingList - Obteniendo seguidos para usuario:', user.uid);
      
      // Obtener likes del usuario desde la colección user_likes
      const likesRef = collection(db, 'user_likes');
      const likesQuery = query(
        likesRef,
        where('user_id', '==', user.uid)
      );
      
      const snapshot = await getDocs(likesQuery);
      const likedUserIds = snapshot.docs.map(doc => doc.data().liked_user_id);
      
      console.log('🔍 FollowingList - Usuarios seguidos encontrados:', likedUserIds);
      
      if (likedUserIds.length === 0) {
        setFollowing([]);
        return;
      }
      
      // Obtener perfiles de los usuarios seguidos
      const profilesData = [];
      for (const userId of likedUserIds) {
        try {
          const profileRef = doc(db, 'profiles', userId);
          const profileSnap = await getDoc(profileRef);
          if (profileSnap.exists()) {
            profilesData.push({ 
              id: profileSnap.id, 
              ...profileSnap.data(),
              followed_at: snapshot.docs.find(doc => doc.data().liked_user_id === userId)?.data().created_at || new Date().toISOString()
            });
          }
        } catch (error) {
          console.error('Error fetching profile for user:', userId, error);
        }
      }
      
      setFollowing(profilesData);
      setFilteredFollowing(profilesData);
    } catch (error) {
      console.error('Error in fetchFollowing:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Error inesperado al cargar los seguidos.'
      });
    } finally {
      setLoading(false);
    }
  };

  // Función para filtrar por distancia
  const filterByDistance = useCallback(() => {
    if (!showNearbyOnly || !user?.uid) {
      setFilteredFollowing(following);
      return;
    }

    // Obtener ubicación del usuario actual (simplificado)
    const currentUserLocation = {
      lat: -34.6037, // Buenos Aires por defecto
      lng: -58.3816
    };

    const nearbyProfiles = following.filter(profile => {
      if (!profile.latitud || !profile.longitud) return false;
      
      // Cálculo simple de distancia (aproximado)
      const distance = Math.sqrt(
        Math.pow(profile.latitud - currentUserLocation.lat, 2) + 
        Math.pow(profile.longitud - currentUserLocation.lng, 2)
      ) * 111; // Conversión aproximada a km
      
      return distance <= 50; // 50km de radio
    });

    setFilteredFollowing(nearbyProfiles);
  }, [following, showNearbyOnly, user?.uid]);

  useEffect(() => {
    console.log('🔍 FollowingList - Usuario:', user?.uid);
    if (user?.uid) {
      fetchFollowing();
    } else {
      console.log('🔍 FollowingList - No hay usuario autenticado');
      setFollowing([]);
      setFilteredFollowing([]);
      setLoading(false);
    }
  }, [user?.uid]); // Solo depende del usuario autenticado

  // Aplicar filtro cuando cambie el estado
  useEffect(() => {
    filterByDistance();
  }, [filterByDistance]);

  const handleUnfollow = async (profileId) => {
    try {
      console.log('🔍 FollowingList - Dejando de seguir usuario:', profileId);
      
      // Buscar y eliminar el like en la colección user_likes
      const likesRef = collection(db, 'user_likes');
      const likesQuery = query(
        likesRef,
        where('user_id', '==', user.uid),
        where('liked_user_id', '==', profileId)
      );
      
      const snapshot = await getDocs(likesQuery);
      
      // Eliminar todos los likes encontrados (por seguridad)
      for (const likeDoc of snapshot.docs) {
        await deleteDoc(likeDoc.ref);
        console.log('✅ Like eliminado:', likeDoc.id);
      }
      
      // Actualizar la lista local
      setFollowing(prev => prev.filter(profile => profile.id !== profileId));
      
      toast({
        title: 'Dejaste de seguir',
        description: 'Ya no sigues este perfil.'
      });
    } catch (error) {
      console.error('Error unfollowing:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Error inesperado.'
      });
    }
  };

  const handleViewProfile = (profileId) => {
    navigate(`/profile/${profileId}`);
  };

  const handleSendMessage = (profileId) => {
    navigate(`/chats?user=${profileId}`);
  };

  if (loading) {
    return (
      <div className="bg-card rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 text-primary">
          Perfiles que sigues
        </h3>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center space-x-3 animate-pulse">
              <div className="w-12 h-12 bg-muted rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (following.length === 0) {
    return (
      <div className="bg-card rounded-lg p-6 text-center">
        <Heart className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2 text-primary">
          {isOwnProfile ? 'Aún no sigues a nadie' : 'No sigue a nadie'}
        </h3>
        <p className="text-muted-foreground mb-4">
          {isOwnProfile 
            ? 'Explora perfiles y dale "Me gusta" para seguir a personas interesantes.'
            : 'Este usuario no sigue a ningún perfil aún.'
          }
        </p>
        {isOwnProfile && (
          <button
            onClick={() => navigate('/search')}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
          >
            Descubrir Perfiles
          </button>
        )}
      </div>
    );
  }

  if (showNearbyOnly && filteredFollowing.length === 0) {
    return (
      <div className="bg-card rounded-lg p-6 text-center">
        <MapPin className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2 text-primary">
          No hay perfiles cercanos
        </h3>
        <p className="text-muted-foreground mb-4">
          Ninguno de los perfiles que sigues está cerca de tu ubicación.
        </p>
        <button
          onClick={() => setShowNearbyOnly(false)}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
        >
          Ver todos los perfiles
        </button>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-primary">
          {isOwnProfile ? 'Perfiles que sigues' : 'Perfiles que sigue'} 
          {showNearbyOnly ? ' (Cercanos)' : ''} ({filteredFollowing.length})
        </h3>
        {isOwnProfile && following.length > 0 && (
          <button
            onClick={() => setShowNearbyOnly(!showNearbyOnly)}
            className={`px-3 py-1 rounded-full text-sm transition-colors ${
              showNearbyOnly 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <MapPin className="w-4 h-4 inline mr-1" />
            {showNearbyOnly ? 'Ver todos' : 'Solo cercanos'}
          </button>
        )}
      </div>

      <div className="space-y-4 max-h-96 overflow-y-auto">
        {filteredFollowing.map((profile) => (
          <div
            key={profile.id}
            className="flex items-center space-x-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
          >
            {/* Avatar */}
            <div className="relative">
              <img
                src={profile.profile_picture_url || '/default-avatar.png'}
                alt={profile.alias}
                className="w-12 h-12 rounded-full object-cover"
                onError={(e) => {
                  e.target.src = '/default-avatar.png';
                }}
              />
              {profile.is_verified && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
              )}
              {profile.is_vip && (
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">★</span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h4 className="font-medium text-foreground truncate">
                  {profile.alias}
                </h4>
                {profile.gender && (
                  <span className="text-xs px-2 py-1 bg-muted rounded-full text-muted-foreground">
                    {profile.gender}
                  </span>
                )}
              </div>
              
              {profile.bio && (
                <p className="text-sm text-muted-foreground truncate mt-1">
                  {profile.bio}
                </p>
              )}
              
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                <Heart className="w-3 h-3 mr-1" />
                Siguiendo desde {new Date(profile.followed_at).toLocaleDateString()}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleViewProfile(profile.id)}
                className="p-2 text-muted-foreground hover:text-primary hover:bg-muted rounded-full transition-colors"
                title="Ver perfil"
              >
                <User className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => handleSendMessage(profile.id)}
                className="p-2 text-muted-foreground hover:text-primary hover:bg-muted rounded-full transition-colors"
                title="Enviar mensaje"
              >
                <MessageCircle className="w-4 h-4" />
              </button>

              {isOwnProfile && (
                <button
                  onClick={() => handleUnfollow(profile.id)}
                  className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors"
                  title="Dejar de seguir"
                >
                  <Heart className="w-4 h-4 fill-current" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {/* Botón Descubrir Perfiles SIEMPRE visible fuera del scroll */}
      {isOwnProfile && (
        <div className="mt-4 pt-4 border-t">
          <button
            onClick={() => navigate('/search')}
            className="w-full bg-primary text-primary-foreground px-4 py-3 rounded-lg hover:bg-primary/90 transition-colors font-medium"
          >
            Descubrir Perfiles
          </button>
        </div>
      )}
    </div>
  );
};

export default FollowingList;
