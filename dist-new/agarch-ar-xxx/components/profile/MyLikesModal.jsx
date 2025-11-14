import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { X, User, MessageSquare, Heart } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast.jsx';

const MyLikesModal = ({ isOpen, onClose, followingIds = [] }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && followingIds.length > 0) {
      loadProfiles();
    } else {
      setProfiles([]);
    }
  }, [isOpen, followingIds]);

  const loadProfiles = async () => {
    setLoading(true);
    try {
      const profilesData = [];
      
      for (const userId of followingIds) {
        try {
          const profileRef = doc(db, 'profiles', userId);
          const profileSnap = await getDoc(profileRef);
          if (profileSnap.exists()) {
            const profileData = profileSnap.data();
            profilesData.push({
              id: profileSnap.id,
              alias: profileData.alias || 'Usuario',
              profile_picture_url: profileData.profile_picture_url || '/pwa-512x512.png',
              ubicacion: profileData.ubicacion || 'Ubicación no especificada'
            });
          }
        } catch (error) {
          console.error('Error loading profile:', userId, error);
        }
      }
      
      setProfiles(profilesData);
    } catch (error) {
      console.error('Error loading profiles:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudieron cargar los perfiles seguidos.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewProfile = (profileId) => {
    navigate(`/profile/${profileId}`);
    onClose();
  };

  const handleSendMessage = (profileId) => {
    navigate(`/chats?user=${profileId}`);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full max-h-[80vh] overflow-hidden" style={{ maxWidth: '90vw' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Heart className="w-6 h-6 text-red-500" />
            <h2 className="text-xl font-bold text-white">Personas que sigues</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-slate-700 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-white">Cargando perfiles...</div>
            </div>
          ) : profiles.length === 0 ? (
            <div className="text-center py-8">
              <Heart className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">No sigues a nadie aún</p>
              <p className="text-sm text-gray-500 mt-2">
                Ve a descubrir perfiles y dales "Me gusta" para verlos aquí
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {profiles.map((profile) => (
                <div key={profile.id} className="bg-slate-700 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    {/* Avatar */}
                    <img
                      src={profile.profile_picture_url}
                      alt={profile.alias}
                      className="w-12 h-12 rounded-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/pwa-512x512.png';
                      }}
                    />
                    
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-white truncate">
                        {profile.alias}
                      </div>
                      <div className="text-sm text-gray-400 truncate">
                        {profile.ubicacion}
                      </div>
                    </div>

                    {/* Botones */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewProfile(profile.id)}
                        className="bg-green-600 hover:bg-green-500 text-white border-green-500 px-3"
                      >
                        <User className="w-4 h-4 mr-1" />
                        Ver
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSendMessage(profile.id)}
                        className="bg-blue-600 hover:bg-blue-500 text-white border-blue-500 px-3"
                      >
                        <MessageSquare className="w-4 h-4 mr-1" />
                        Chat
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-slate-600">
          <Button
            onClick={onClose}
            variant="outline"
            className="w-full bg-slate-700 hover:bg-slate-600 text-white border-slate-600"
          >
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MyLikesModal;