import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast.jsx';

const ProfileDebugger = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [firestoreProfile, setFirestoreProfile] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchFirestoreProfile = async () => {
    if (!user?.uid) return;
    
    setLoading(true);
    try {
      const profileRef = doc(db, 'profiles', user.uid);
      const profileSnap = await getDoc(profileRef);
      
      if (profileSnap.exists()) {
        setFirestoreProfile(profileSnap.data());
      } else {
        setFirestoreProfile(null);
      }
    } catch (error) {
      console.error('Error fetching Firestore profile:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo cargar el perfil desde Firestore'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFirestoreProfile();
  }, [user?.uid]);

  if (!user) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>🔍 Profile Debugger</CardTitle>
        </CardHeader>
        <CardContent>
          <p>No hay usuario autenticado</p>
        </CardContent>
      </Card>
    );
  }

  const compareProfiles = () => {
    if (!profile || !firestoreProfile) return null;
    
    const differences = [];
    
    // Comparar campos principales
    const fields = ['alias', 'email', 'profile_picture_url', 'fotos', 'videos', 'updated_at'];
    
    fields.forEach(field => {
      const authValue = profile[field];
      const firestoreValue = firestoreProfile[field];
      
      if (JSON.stringify(authValue) !== JSON.stringify(firestoreValue)) {
        differences.push({
          field,
          authValue,
          firestoreValue
        });
      }
    });
    
    return differences;
  };

  const differences = compareProfiles();

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🔍 Profile Debugger
          <Button 
            onClick={fetchFirestoreProfile} 
            disabled={loading}
            size="sm"
            variant="outline"
          >
            {loading ? 'Cargando...' : 'Actualizar'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Estado del usuario */}
        <div>
          <h3 className="font-semibold mb-2">👤 Usuario Autenticado</h3>
          <div className="bg-gray-100 p-3 rounded text-sm">
            <p><strong>UID:</strong> {user.uid}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Email Verificado:</strong> {user.emailVerified ? '✅' : '❌'}</p>
          </div>
        </div>

        {/* Perfil desde useAuth */}
        <div>
          <h3 className="font-semibold mb-2">🔄 Perfil desde useAuth</h3>
          <div className="bg-blue-50 p-3 rounded text-sm">
            {profile ? (
              <div>
                <p><strong>ID:</strong> {profile.id}</p>
                <p><strong>Alias:</strong> {profile.alias}</p>
                <p><strong>Foto de perfil:</strong> {profile.profile_picture_url}</p>
                <p><strong>Fotos:</strong> {profile.fotos?.length || 0}</p>
                <p><strong>Videos:</strong> {profile.videos?.length || 0}</p>
                <p><strong>Última actualización:</strong> {profile.updated_at}</p>
              </div>
            ) : (
              <p className="text-red-600">❌ No hay perfil cargado</p>
            )}
          </div>
        </div>

        {/* Perfil desde Firestore */}
        <div>
          <h3 className="font-semibold mb-2">🗄️ Perfil desde Firestore</h3>
          <div className="bg-green-50 p-3 rounded text-sm">
            {firestoreProfile ? (
              <div>
                <p><strong>ID:</strong> {firestoreProfile.id}</p>
                <p><strong>Alias:</strong> {firestoreProfile.alias}</p>
                <p><strong>Foto de perfil:</strong> {firestoreProfile.profile_picture_url}</p>
                <p><strong>Fotos:</strong> {firestoreProfile.fotos?.length || 0}</p>
                <p><strong>Videos:</strong> {firestoreProfile.videos?.length || 0}</p>
                <p><strong>Última actualización:</strong> {firestoreProfile.updated_at}</p>
              </div>
            ) : (
              <p className="text-red-600">❌ No hay perfil en Firestore</p>
            )}
          </div>
        </div>

        {/* Diferencias */}
        {differences && differences.length > 0 && (
          <div>
            <h3 className="font-semibold mb-2">⚠️ Diferencias encontradas</h3>
            <div className="bg-yellow-50 p-3 rounded text-sm">
              {differences.map((diff, index) => (
                <div key={index} className="mb-2">
                  <span className="inline-block bg-gray-200 text-gray-800 text-xs px-2 py-1 rounded mr-2">{diff.field}</span>
                  <p><strong>useAuth:</strong> {JSON.stringify(diff.authValue)}</p>
                  <p><strong>Firestore:</strong> {JSON.stringify(diff.firestoreValue)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {differences && differences.length === 0 && (
          <div>
            <h3 className="font-semibold mb-2">✅ Sincronización</h3>
            <div className="bg-green-100 p-3 rounded text-sm">
              <p>Los perfiles están sincronizados correctamente</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProfileDebugger;
