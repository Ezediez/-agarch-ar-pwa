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
import { Loader2, Edit3, Save, X } from 'lucide-react';
import { useUploader } from '@/hooks/useUploader';
import UploadModal from '@/components/profile/UploadModal';
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

    const handleFilesUpload = async (files, type) => {
        if (!files || files.length === 0) return;

        const folder = type === 'photos' ? 'profile-photos' : 'profile-videos';
        
        for (const file of files) {
            uploadFile(file, 'media', folder, async (url, error) => {
                if (error) {
                    toast({ variant: 'destructive', title: 'Error de subida', description: error.message });
                    return;
                }
                
                if (url) {
                    const field = type === 'photos' ? 'profile_picture_url' : 'profile_video_url';
                    handleInputChange(field, url);
                    toast({ title: `${type === 'photos' ? 'Foto' : 'Video'} subido con éxito` });
                }
            });
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

                {/* Header del perfil */}
                <div className="relative">
                    <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white">
                        <div className="flex items-center space-x-4">
                            <div className="relative">
                                <div className="w-20 h-20 rounded-full border-4 border-white overflow-hidden bg-gray-300">
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
                            <div className="flex-1">
                                <h1 className="text-2xl font-bold text-white">
                                    {profile.alias}
                                </h1>
                                <p className="text-green-100">
                                    {profile.ubicacion}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Información del perfil */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-green-600">Información</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="text-green-600 font-medium">Sobre mí</label>
                            {editMode ? (
                                <textarea
                                    value={localProfileData?.descripcion || ''}
                                    onChange={(e) => handleInputChange('descripcion', e.target.value)}
                                    className="w-full mt-1 p-2 border rounded-lg"
                                    placeholder="Cuéntanos sobre ti..."
                                />
                            ) : (
                                <p className="text-white mt-1">
                                    {profile.descripcion || 'No hay descripción disponible'}
                                </p>
                            )}
                        </div>
                        
                        <div>
                            <label className="text-green-600 font-medium">Género</label>
                            {editMode ? (
                                <select
                                    value={localProfileData?.genero || ''}
                                    onChange={(e) => handleInputChange('genero', e.target.value)}
                                    className="w-full mt-1 p-2 border rounded-lg"
                                >
                                    <option value="">Seleccionar género</option>
                                    <option value="hombre">Hombre</option>
                                    <option value="mujer">Mujer</option>
                                    <option value="otro">Otro</option>
                                </select>
                            ) : (
                                <p className="text-white mt-1">
                                    {profile.genero || 'No especificado'}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="text-green-600 font-medium">Edad</label>
                            {editMode ? (
                                <input
                                    type="number"
                                    value={localProfileData?.edad || ''}
                                    onChange={(e) => handleInputChange('edad', e.target.value)}
                                    className="w-full mt-1 p-2 border rounded-lg"
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

                {/* Galería de fotos */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-green-600">Galería de Fotos</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center py-8 text-gray-500">
                            <p>Aún no has subido fotos a tu perfil.</p>
                            {editMode && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsUploadModalOpen(true)}
                                    className="mt-2"
                                >
                                    Subir Fotos
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Galería de videos */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-green-600">Galería de Videos</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center py-8 text-gray-500">
                            <p>Aún no has subido videos a tu perfil.</p>
                            {editMode && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsUploadModalOpen(true)}
                                    className="mt-2"
                                >
                                    Subir Videos
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Lista de seguidos */}
                <FollowingList profile={profile} />

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
