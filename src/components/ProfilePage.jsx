import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, Edit, MapPin, Heart, Star, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [profileData, setProfileData] = useState({
    bio: user?.bio || '',
    interests: user?.interests || '',
    lookingFor: user?.lookingFor || '',
    height: user?.height || '',
    bodyType: user?.bodyType || '',
    lifestyle: user?.lifestyle || ''
  });
  const [photos, setPhotos] = useState(user?.photos || []);
  const { toast } = useToast();

  const handleSaveProfile = () => {
    updateUser({ ...profileData, photos });
    setEditMode(false);
    toast({
      title: "Perfil actualizado",
      description: "Tus cambios han sido guardados exitosamente"
    });
  };

  const handlePhotoUpload = () => {
    if (photos.length >= 15) {
      toast({
        title: "Límite alcanzado",
        description: "Puedes subir máximo 15 fotos",
        variant: "destructive"
      });
      return;
    }
    
    toast({
      title: "🚧 Esta función no está implementada aún",
      description: "¡Pero no te preocupes! Puedes solicitarla en tu próximo prompt! 🚀"
    });
  };

  const removePhoto = (index) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    setPhotos(newPhotos);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="profile-card"
      >
        <div className="relative h-48 bg-gradient-to-r from-orange-400 to-green-400 rounded-t-3xl">
          <div className="absolute -bottom-16 left-6">
            <div className="relative">
              <div className="w-32 h-32 bg-white rounded-full p-2">
                <img  
                  className="w-full h-full rounded-full object-cover" 
                  alt="Foto de perfil"
                 src="https://images.unsplash.com/photo-1669152508492-b0b5f37d567e" />
              </div>
              <button className="absolute bottom-2 right-2 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white hover:bg-orange-600 transition-colors">
                <Camera className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {user?.isVip && (
            <div className="absolute top-4 right-4 vip-badge">
              <Star className="w-4 h-4 inline mr-1" />
              VIP
            </div>
          )}
        </div>

        <div className="pt-20 p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                {user?.firstName} {user?.lastName}
              </h1>
              <div className="flex items-center text-gray-600 mt-1">
                <MapPin className="w-4 h-4 mr-1" />
                <span>{user?.city}</span>
              </div>
            </div>
            
            <Button
              onClick={() => setEditMode(!editMode)}
              className={editMode ? "btn-secondary" : "btn-primary"}
            >
              <Edit className="w-4 h-4 mr-2" />
              {editMode ? 'Guardar' : 'Editar'}
            </Button>
          </div>

          {editMode ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="bio">Descripción Personal</Label>
                <Textarea
                  id="bio"
                  value={profileData.bio}
                  onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Cuéntanos sobre ti... Puedes usar cualquier palabra relacionada con temas adultos"
                  className="input-field"
                  rows={4}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="interests">Intereses</Label>
                  <Input
                    id="interests"
                    value={profileData.interests}
                    onChange={(e) => setProfileData(prev => ({ ...prev, interests: e.target.value }))}
                    placeholder="Música, deportes, viajes..."
                    className="input-field"
                  />
                </div>
                <div>
                  <Label htmlFor="lookingFor">Buscando</Label>
                  <Select onValueChange={(value) => setProfileData(prev => ({ ...prev, lookingFor: value }))}>
                    <SelectTrigger className="input-field">
                      <SelectValue placeholder="¿Qué buscas?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="relacion-seria">Relación seria</SelectItem>
                      <SelectItem value="casual">Algo casual</SelectItem>
                      <SelectItem value="amistad">Amistad</SelectItem>
                      <SelectItem value="aventura">Aventura</SelectItem>
                      <SelectItem value="encuentros-intimos">Encuentros íntimos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="height">Altura</Label>
                  <Input
                    id="height"
                    value={profileData.height}
                    onChange={(e) => setProfileData(prev => ({ ...prev, height: e.target.value }))}
                    placeholder="1.75m"
                    className="input-field"
                  />
                </div>
                <div>
                  <Label htmlFor="bodyType">Tipo de cuerpo</Label>
                  <Select onValueChange={(value) => setProfileData(prev => ({ ...prev, bodyType: value }))}>
                    <SelectTrigger className="input-field">
                      <SelectValue placeholder="Selecciona" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="delgado">Delgado/a</SelectItem>
                      <SelectItem value="atletico">Atlético/a</SelectItem>
                      <SelectItem value="promedio">Promedio</SelectItem>
                      <SelectItem value="curvy">Con curvas</SelectItem>
                      <SelectItem value="grande">Grande</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={handleSaveProfile} className="btn-primary w-full">
                Guardar Cambios
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Sobre mí</h3>
                <p className="text-gray-600">
                  {profileData.bio || 'Aún no has agregado una descripción personal.'}
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-800">Intereses</h4>
                  <p className="text-gray-600">{profileData.interests || 'No especificado'}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800">Buscando</h4>
                  <p className="text-gray-600">{profileData.lookingFor || 'No especificado'}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800">Altura</h4>
                  <p className="text-gray-600">{profileData.height || 'No especificado'}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800">Tipo de cuerpo</h4>
                  <p className="text-gray-600">{profileData.bodyType || 'No especificado'}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Photo Gallery */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Galería de Fotos</h2>
          <Button onClick={handlePhotoUpload} className="btn-primary">
            <Upload className="w-4 h-4 mr-2" />
            Subir Foto
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* Sample photos */}
          <div className="relative group">
            <img  
              className="w-full h-32 object-cover rounded-lg" 
              alt="Foto de galería"
             src="https://images.unsplash.com/photo-1585375673743-be44ec5b423f" />
            <button 
              onClick={() => removePhoto(0)}
              className="absolute top-2 right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-3 h-3" />
            </button>
          </div>

          <div className="relative group">
            <img  
              className="w-full h-32 object-cover rounded-lg" 
              alt="Foto de galería"
             src="https://images.unsplash.com/photo-1582759011467-90ace465b416" />
            <button 
              onClick={() => removePhoto(1)}
              className="absolute top-2 right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-3 h-3" />
            </button>
          </div>

          <div className="relative group">
            <img  
              className="w-full h-32 object-cover rounded-lg" 
              alt="Foto de galería"
             src="https://images.unsplash.com/photo-1690373620370-a58238d26d68" />
            <button 
              onClick={() => removePhoto(2)}
              className="absolute top-2 right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-3 h-3" />
            </button>
          </div>

          {/* Add photo placeholder */}
          <button 
            onClick={handlePhotoUpload}
            className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-500 hover:border-orange-400 hover:text-orange-500 transition-colors"
          >
            <Camera className="w-6 h-6 mb-1" />
            <span className="text-xs">Agregar</span>
          </button>
        </div>

        <p className="text-sm text-gray-500 mt-4">
          Puedes subir hasta 15 fotos. Se permiten desnudos artísticos, pero no contenido con menores o animales.
        </p>
      </motion.div>

      {/* Privacy Settings */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="card"
      >
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Configuración de Privacidad</h2>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
            <div>
              <h3 className="font-medium">Mostrar ubicación exacta</h3>
              <p className="text-sm text-gray-600">Otros usuarios verán tu ubicación aproximada</p>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                toast({
                  title: "🚧 Esta función no está implementada aún",
                  description: "¡Pero no te preocupes! Puedes solicitarla en tu próximo prompt! 🚀"
                });
              }}
            >
              Configurar
            </Button>
          </div>

          <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
            <div>
              <h3 className="font-medium">Información de contacto</h3>
              <p className="text-sm text-gray-600">Email y teléfono ocultos hasta hacer match</p>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                toast({
                  title: "🚧 Esta función no está implementada aún",
                  description: "¡Pero no te preocupes! Puedes solicitarla en tu próximo prompt! 🚀"
                });
              }}
            >
              Configurar
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ProfilePage;