import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { db, auth, storage } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast.jsx';
import ProfileHeader from '@/components/profile/ProfileHeader';
import ProfileInfo from '@/components/profile/ProfileInfo';
import ProfileGallery from '@/components/profile/ProfileGallery';
import ProfileVideos from '@/components/profile/ProfileVideos';
import FollowingList from '@/components/profile/FollowingList';
import { Loader2, Edit3, Save, X, MessageSquare, Camera, Upload, Video } from 'lucide-react';
import { useUploader } from '@/hooks/useUploader';
import UploadModal from '@/components/profile/UploadModal';
import CreateMediaButton from '@/components/profile/CreateMediaButton';
import ImageUploader from '@/components/ImageUploader';
import VideoUploader from '@/components/VideoUploader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const MyProfilePage = () => {
    const { user, profile: ownProfile, loading: authLoading, refreshProfile } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();
    const { uploadFile, isUploading: uploading, progress } = useUploader();

    const [profile, setProfile] = useState(null);
    const [pageLoading, setPageLoading] = useState(true);
    const [saveLoading, setSaveLoading] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [localProfileData, setLocalProfileData] = useState(null);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

    useEffect(() => {
        console.log('🔄 useEffect MyProfilePage - ownProfile:', ownProfile, 'user:', user);
        
        if (user?.uid) {
            console.log('🔄 Usuario autenticado:', user.uid);
            
            if (ownProfile) {
                console.log('🔄 Perfil encontrado:', ownProfile);
                // Asegurar que el perfil tenga todos los campos necesarios
                const completeProfile = {
                    ...ownProfile,
                    alias: ownProfile.alias || 'Usuario',
                    descripcion: ownProfile.descripcion || '',
                    genero: ownProfile.genero || '',
                    edad: ownProfile.edad || '',
                    ubicacion: ownProfile.ubicacion || 'Ubicación no especificada',
                    fotos: ownProfile.fotos || [],
                    videos: ownProfile.videos || [],
                    profile_picture_url: ownProfile.profile_picture_url || '/pwa-512x512.png'
                };
                setProfile(completeProfile);
                setLocalProfileData(completeProfile);
                setPageLoading(false);
                console.log('✅ Mi perfil cargado:', completeProfile.alias);
            } else {
                console.log('⚠️ Perfil no encontrado, creando perfil básico');
                // Crear perfil básico si no existe
                const basicProfile = {
                    id: user.uid,
                    alias: user.email?.split('@')[0] || 'Usuario',
                    email: user.email,
                    descripcion: '',
                    genero: '',
                    edad: '',
                    ubicacion: 'Ubicación no especificada',
                    fotos: [],
                    videos: [],
                    profile_picture_url: '/pwa-512x512.png'
                };
                setProfile(basicProfile);
                setLocalProfileData(basicProfile);
                setPageLoading(false);
                console.log('✅ Perfil básico creado:', basicProfile.alias);
            }
        } else {
            console.log('❌ No hay usuario autenticado');
            setPageLoading(false);
        }
    }, [ownProfile, user]);

    const handleSave = async () => {
        if (!localProfileData || !user?.uid) return;

        setSaveLoading(true);
        try {
            const profileRef = doc(db, 'profiles', user.uid);
            await updateDoc(profileRef, {
                ...localProfileData,
                updated_at: new Date().toISOString()
            });

            toast({ title: 'Perfil actualizado con éxito' });
            setEditMode(false);
            await refreshProfile();
        } catch (error) {
            console.error('Error al actualizar perfil:', error);
            toast({ 
                variant: 'destructive', 
                title: 'Error', 
                description: 'No se pudo actualizar el perfil' 
            });
        } finally {
            setSaveLoading(false);
        }
    };

    const handleCancel = () => {
        setLocalProfileData(profile);
        setEditMode(false);
    };

    const handleInputChange = (field, value) => {
        setLocalProfileData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleFilesUpload = async (url, type) => {
        if (!url) return;

        if (type === 'photos') {
            // Agregar foto a la galería
            const currentPhotos = localProfileData?.fotos || [];
            const updatedPhotos = [...currentPhotos, url];
            handleInputChange('fotos', updatedPhotos);
            
            // Si es la primera foto, también actualizar la foto de perfil
            if (currentPhotos.length === 0) {
                handleInputChange('profile_picture_url', url);
            }
        } else if (type === 'videos') {
            // Agregar video a la galería
            const currentVideos = localProfileData?.videos || [];
            const updatedVideos = [...currentVideos, url];
            handleInputChange('videos', updatedVideos);
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="loading-spinner" />
            </div>
        );
    }

    // Si no hay usuario, mostrar mensaje de error
    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center">
                    <h2 className="text-xl font-semibold mb-2">No autenticado</h2>
                    <p className="text-muted-foreground mb-4">Debes iniciar sesión para ver tu perfil</p>
                    <Button onClick={() => navigate('/login')}>
                        Ir a Login
                    </Button>
                </div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center">
                    <h2 className="text-xl font-semibold mb-2">Perfil no encontrado</h2>
                    <p className="text-muted-foreground mb-4">No se pudo cargar tu perfil</p>
                    <Button onClick={() => navigate('/discover')}>
                        Volver al inicio
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <>
            <Helmet>
                <title>Mi Perfil - AGARCH-AR</title>
                <meta name="description" content="Gestiona tu perfil en AGARCH-AR" />
            </Helmet>
            
            <div className="max-w-4xl mx-auto p-4 space-y-6">
                {/* Header con botones de edición */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-2xl font-bold">
                            Mi Perfil
                        </CardTitle>
                        <div className="flex gap-2">
                            {editMode ? (
                                <>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleCancel}
                                        disabled={saveLoading}
                                    >
                                        <X className="w-4 h-4 mr-2" />
                                        Cancelar
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={handleSave}
                                        disabled={saveLoading}
                                    >
                                        {saveLoading ? (
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        ) : (
                                            <Save className="w-4 h-4 mr-2" />
                                        )}
                                        Guardar
                                    </Button>
                                </>
                            ) : (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setEditMode(true)}
                                >
                                    <Edit3 className="w-4 h-4 mr-2" />
                                    Editar Perfil
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                </Card>

                {/* Header del perfil - Diseño exacto de las fotos */}
                <div className="relative">
                    <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white">
                        <div className="flex flex-col items-center space-y-4">
                            {/* Avatar circular con gradiente */}
                            <div className="relative">
                                <div className="w-24 h-24 rounded-full border-4 border-green-400 overflow-hidden bg-gradient-to-br from-green-400 to-red-400 flex items-center justify-center">
                                    <img 
                                        src={profile.profile_picture_url} 
                                        alt="Foto de perfil"
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.target.src = '/pwa-512x512.png';
                                        }}
                                    />
                                </div>
                                {editMode && (
                                    <button
                                        onClick={() => setIsUploadModalOpen(true)}
                                        className="absolute -bottom-1 -right-1 bg-green-500 text-white rounded-full p-1 hover:bg-green-600 transition-colors"
                                    >
                                        <Edit3 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                            
                            {/* Nombre con gradiente */}
                            <div className="text-center">
                                <h1 className="text-2xl font-bold">
                                    <span className="text-green-300">{profile.alias?.split(' ')[0] || profile.alias}</span>
                                    <span className="text-red-300">{profile.alias?.split(' ')[1] || ''}</span>
                                </h1>
                                <p className="text-gray-300 text-sm">
                                    {profile.ubicacion}
                                </p>
                            </div>
                            
                            {/* Botones de acción - Modelo del usuario */}
                            <div className="flex gap-2 w-full justify-center max-w-sm mx-auto">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => navigate('/chats')}
                                    className="flex-1 bg-white hover:bg-gray-100 text-gray-800 border-gray-300 text-xs"
                                >
                                    <MessageSquare className="w-4 h-4 mr-1" />
                                    Mensajes
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => navigate('/create-post')}
                                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white border-blue-400 text-xs"
                                >
                                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                    Crear
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Información del perfil - Diseño exacto de las fotos */}
                <Card className="bg-gray-800 border-gray-700">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-green-400 flex items-center">
                            Información
                            {editMode && (
                                <Edit3 className="w-4 h-4 ml-2 text-white" />
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="text-green-400 font-medium block mb-1">Sobre mí</label>
                            {editMode ? (
                                <textarea
                                    value={localProfileData?.descripcion || ''}
                                    onChange={(e) => handleInputChange('descripcion', e.target.value)}
                                    className="w-full mt-1 p-2 border rounded-lg bg-white text-black"
                                    placeholder="Cuéntanos sobre ti..."
                                />
                            ) : (
                                <p className="text-white mt-1">
                                    {profile.descripcion || 'Usuario de AGARCH-AR 👋'}
                                </p>
                            )}
                        </div>
                        
                        <div>
                            <label className="text-green-400 font-medium block mb-1">Género</label>
                            {editMode ? (
                                <select
                                    value={localProfileData?.genero || ''}
                                    onChange={(e) => handleInputChange('genero', e.target.value)}
                                    className="w-full mt-1 p-2 border rounded-lg bg-white text-black"
                                >
                                    <option value="">Seleccionar género</option>
                                    <option value="hombre">Hombre</option>
                                    <option value="mujer">Mujer</option>
                                    <option value="otro">Otro</option>
                                </select>
                            ) : (
                                <p className="text-white mt-1">
                                    {profile.genero || 'No Especificado'}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="text-green-400 font-medium block mb-1">Edad</label>
                            {editMode ? (
                                <input
                                    type="number"
                                    value={localProfileData?.edad || ''}
                                    onChange={(e) => handleInputChange('edad', e.target.value)}
                                    className="w-full mt-1 p-2 border rounded-lg bg-white text-black"
                                    placeholder="Tu edad"
                                />
                            ) : (
                                <p className="text-white mt-1">
                                    {profile.edad || 'No especificada'}
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Galería de fotos - Diseño exacto de las fotos */}
                <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                        <CardTitle className="text-green-400">Galería de Fotos</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {profile.fotos && profile.fotos.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {profile.fotos.map((photo, index) => (
                                    <div key={index} className="relative group">
                                        <img
                                            src={photo}
                                            alt={`Foto ${index + 1}`}
                                            className="w-full h-32 object-cover rounded-lg"
                                            onError={(e) => {
                                                e.target.src = '/pwa-512x512.png';
                                            }}
                                        />
                                        {editMode && (
                                            <button
                                                onClick={() => {
                                                    const updatedPhotos = profile.fotos.filter((_, i) => i !== index);
                                                    handleInputChange('fotos', updatedPhotos);
                                                }}
                                                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-400">
                                <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <p className="mb-4">Aún no has subido fotos a tu perfil.</p>
                                <div className="flex gap-2 justify-center">
                                    <ImageUploader onUploadSuccess={(file) => handleFilesUpload(file, 'gallery')} useCamera={false} uploading={uploading}>
                                        <Button variant="outline" size="sm" className="bg-green-500 hover:bg-green-600 text-white border-green-400">
                                            <Upload className="w-4 h-4 mr-1" />
                                            Galería
                                        </Button>
                                    </ImageUploader>
                                    <ImageUploader onUploadSuccess={(file) => handleFilesUpload(file, 'camera-gallery')} useCamera={true} uploading={uploading}>
                                        <Button variant="outline" size="sm" className="bg-green-500 hover:bg-green-600 text-white border-green-400">
                                            <Camera className="w-4 h-4 mr-1" />
                                            Cámara
                                        </Button>
                                    </ImageUploader>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Galería de videos - Diseño exacto de las fotos */}
                <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                        <CardTitle className="text-green-400">Galería de Videos</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {profile.videos && profile.videos.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {profile.videos.map((video, index) => (
                                    <div key={index} className="relative group">
                                        <video
                                            src={video}
                                            controls
                                            className="w-full h-48 object-cover rounded-lg"
                                        />
                                        {editMode && (
                                            <button
                                                onClick={() => {
                                                    const updatedVideos = profile.videos.filter((_, i) => i !== index);
                                                    handleInputChange('videos', updatedVideos);
                                                }}
                                                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-400">
                                <Video className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <p className="mb-4">Aún no has subido videos a tu perfil.</p>
                                <div className="flex gap-2 justify-center">
                                    <VideoUploader onUploadSuccess={(file) => handleFilesUpload(file, 'video')} useCamera={false} uploading={uploading} progress={progress}>
                                        <Button variant="outline" size="sm" className="bg-red-500 hover:bg-red-600 text-white border-red-400">
                                            <Video className="w-4 h-4 mr-1" />
                                            Galería
                                        </Button>
                                    </VideoUploader>
                                    <VideoUploader onUploadSuccess={(file) => handleFilesUpload(file, 'camera-video')} useCamera={true} uploading={uploading} progress={progress}>
                                        <Button variant="outline" size="sm" className="bg-red-500 hover:bg-red-600 text-white border-red-400">
                                            <Camera className="w-4 h-4 mr-1" />
                                            Grabar
                                        </Button>
                                    </VideoUploader>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Lista de seguidos */}
                <FollowingList profile={profile} />

                {/* Banner para Modal "Mis Likes" */}
                <Card className="bg-yellow-100 border-yellow-300 border-2">
                    <CardContent className="p-4 text-center">
                        <h3 className="text-lg font-bold text-yellow-800 mb-2">MODAL PERFILES GUARDADOS</h3>
                        <p className="text-yellow-700 text-sm">
                            Aquí irá el modal para mostrar los perfiles que sigues (Mis Likes)
                        </p>
                    </CardContent>
                </Card>

                {/* Modal de subida */}
                <UploadModal
                    isOpen={isUploadModalOpen}
                    onClose={() => setIsUploadModalOpen(false)}
                    onUpload={handleFilesUpload}
                    uploading={uploading}
                    progress={progress}
                />
            </div>
        </>
    );
};

export default MyProfilePage;
