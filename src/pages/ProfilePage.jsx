import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from '@/lib/firebase';
import { doc, getDoc, updateDoc, collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast.jsx';
import { Loader2, Edit3, Save, X, Heart, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUploader } from '@/hooks/useUploader';
import UploadModal from '@/components/profile/UploadModal';
import FollowingList from '@/components/profile/FollowingList';

const ProfilePage = () => {
    const { id } = useParams();
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
    const [isOwnProfile, setIsOwnProfile] = useState(false);

    const fetchProfile = useCallback(async (profileId) => {
        console.log('🔄 Cargando perfil:', profileId);
        setPageLoading(true);
        
        try {
            const profileRef = doc(db, 'profiles', profileId);
            const profileSnap = await getDoc(profileRef);

            if (profileSnap.exists()) {
                const data = { id: profileSnap.id, ...profileSnap.data() };
                console.log('✅ Perfil cargado:', data.alias);
                console.log('🔍 Datos del perfil:', data);
                
                // Asegurar que el perfil tenga todos los campos necesarios
                const completeProfile = {
                    ...data,
                    alias: data.alias || 'Usuario',
                    descripcion: data.descripcion || data.bio || '',
                    genero: data.genero || '',
                    edad: data.edad || '',
                    ubicacion: data.ubicacion || data.location || 'Ubicación no especificada',
                    fotos: data.fotos || data.photos || [],
                    videos: data.videos || [],
                    profile_picture_url: data.profile_picture_url || '/pwa-512x512.png'
                };
                
                setProfile(completeProfile);
                setLocalProfileData(completeProfile);
                setPageLoading(false);
            } else {
                console.error('❌ Perfil no encontrado:', profileId);
                toast({ variant: 'destructive', title: 'Error', description: 'No se pudo cargar el perfil.' });
                navigate('/discover');
            }
        } catch (error) {
            console.error('❌ Error fetching profile:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo cargar el perfil.' });
            navigate('/discover');
        }
    }, [toast, navigate]);

    useEffect(() => {
        if (authLoading) return;
        
        const profileId = id || user?.uid;
        if (!profileId) {
            navigate('/login');
            return;
        }
        
        const isOwn = profileId === user?.uid;
        setIsOwnProfile(isOwn);
        
        if (isOwn && ownProfile) {
            // Usar perfil propio desde useAuth
            const completeProfile = {
                ...ownProfile,
                alias: ownProfile.alias || 'Usuario',
                descripcion: ownProfile.descripcion || ownProfile.bio || '',
                genero: ownProfile.genero || '',
                edad: ownProfile.edad || '',
                ubicacion: ownProfile.ubicacion || ownProfile.location || 'Ubicación no especificada',
                fotos: ownProfile.fotos || ownProfile.photos || [],
                videos: ownProfile.videos || [],
                profile_picture_url: ownProfile.profile_picture_url || '/pwa-512x512.png'
            };
            setProfile(completeProfile);
            setLocalProfileData(completeProfile);
            setPageLoading(false);
        } else if (!isOwn) {
            // Cargar perfil de otro usuario
            fetchProfile(profileId);
        }
    }, [id, user?.uid, ownProfile?.id, authLoading, navigate]); // Dependencias específicas

    const handleSave = async () => {
        if (!localProfileData || !user?.uid) return;

        setSaveLoading(true);
        try {
            const profileRef = doc(db, 'profiles', user.uid);
            await updateDoc(profileRef, {
                alias: localProfileData.alias,
                descripcion: localProfileData.descripcion,
                genero: localProfileData.genero,
                edad: localProfileData.edad,
                ubicacion: localProfileData.ubicacion,
                fotos: localProfileData.fotos,
                videos: localProfileData.videos,
                profile_picture_url: localProfileData.profile_picture_url,
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
            const currentPhotos = localProfileData?.fotos || [];
            const updatedPhotos = [...currentPhotos, url];
            handleInputChange('fotos', updatedPhotos);
            
            if (currentPhotos.length === 0) {
                handleInputChange('profile_picture_url', url);
            }
        } else if (type === 'videos') {
            const currentVideos = localProfileData?.videos || [];
            const updatedVideos = [...currentVideos, url];
            handleInputChange('videos', updatedVideos);
        }
    };

    const handleLike = async () => {
        if (!user?.uid || !profile?.id) {
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo procesar el like: usuario o perfil no identificados.' });
            return;
        }
        
        try {
            console.log('DEBUG: Intentando dar like. User ID:', user.uid, 'Profile ID:', profile.id);
            // Obtener el perfil actual del usuario
            const userProfileRef = doc(db, 'profiles', user.uid);
            const userProfileSnap = await getDoc(userProfileRef);
            
            if (userProfileSnap.exists()) {
                const userProfileData = userProfileSnap.data();
                const followingList = userProfileData.following || [];
                console.log('DEBUG: Perfil del usuario actual encontrado. Siguiendo:', followingList);
                
                // Verificar si ya está en la lista
                if (!followingList.includes(profile.id)) {
                    // Agregar el perfil a la lista de seguidos
                    const updatedFollowing = [...followingList, profile.id];
                    
                    await updateDoc(userProfileRef, {
                        following: updatedFollowing,
                        updated_at: new Date().toISOString()
                    });
                    
                    toast({ 
                        title: '¡Me gusta!', 
                        description: `Ahora sigues a ${profile?.alias || 'este usuario'}. Se agregó a tu lista de seguidos.` 
                    });
                    console.log('DEBUG: Like procesado y perfil actualizado.');
                    
                    // Refrescar el perfil del usuario
                    await refreshProfile();
                } else {
                    toast({ 
                        title: 'Ya sigues a este usuario', 
                        description: `${profile?.alias || 'Este usuario'} ya está en tu lista de seguidos.` 
                    });
                    console.log('DEBUG: Usuario ya estaba en la lista de seguidos.');
                }
            } else {
                toast({ variant: 'destructive', title: 'Error', description: 'Tu perfil no se encontró para guardar el like.' });
                console.error('DEBUG: Perfil del usuario actual no encontrado para dar like.');
            }
        } catch (error) {
            console.error('DEBUG: Error al dar like:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo procesar el like.' });
        }
    };

    const handleViewFullProfile = () => {
        // Scroll hacia abajo para ver más contenido del perfil
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        toast({ title: 'Perfil completo', description: 'Desplazándose por el perfil completo' });
    };

    const handleStartChat = async () => {
        if (!user?.uid || !profile?.id) {
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo iniciar el chat.' });
            return;
        }
        
        try {
            console.log('DEBUG: Iniciando chat. User ID:', user.uid, 'Profile ID:', profile.id);
            
            // Verificar si ya existe una conversación
            const conversationsRef = collection(db, 'conversations');
            const existingConvQuery = query(
                conversationsRef,
                where('members', 'array-contains', user.uid)
            );
            
            const existingSnapshot = await getDocs(existingConvQuery);
            let conversationId = null;
            
            // Buscar conversación existente con este usuario
            for (const doc of existingSnapshot.docs) {
                const data = doc.data();
                if (data.members.includes(profile.id)) {
                    conversationId = doc.id;
                    break;
                }
            }
            
            // Si no existe conversación, crear una nueva
            if (!conversationId) {
                const newConversation = {
                    members: [user.uid, profile.id],
                    lastMessage: 'Conversación iniciada',
                    lastSenderId: user.uid,
                    updatedAt: serverTimestamp(),
                };
                const convRef = await addDoc(collection(db, 'conversations'), newConversation);
                conversationId = convRef.id;
                console.log('DEBUG: Nueva conversación creada:', conversationId);
            } else {
                console.log('DEBUG: Conversación existente encontrada:', conversationId);
            }
            
            // Navegar al chat
            navigate(`/chat/${conversationId}`);
            
        } catch (error) {
            console.error('DEBUG: Error al iniciar chat:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo iniciar el chat.' });
        }
    };

    if (authLoading || pageLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center">
                    <h2 className="text-xl font-semibold mb-2">No autenticado</h2>
                    <p className="text-muted-foreground mb-4">Debes iniciar sesión para ver perfiles</p>
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
                    <p className="text-muted-foreground mb-4">No se pudo cargar el perfil</p>
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
                <title>{profile?.alias || 'Perfil'} - AGARCH-AR</title>
                <meta name="description" content={`Explora el perfil de ${profile?.alias || 'un usuario'}.`} />
            </Helmet>
            
            <div className="max-w-4xl mx-auto p-4 space-y-6">
                {/* Header del perfil */}
                <div className="relative">
                    <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white">
                        <div className="flex flex-col items-center space-y-4">
                            {/* Avatar circular con gradiente */}
                            <div className="relative">
                                <div className="w-24 h-24 rounded-full border-4 border-green-400 overflow-hidden bg-gradient-to-br from-green-400 to-red-400 flex items-center justify-center">
                                    <img 
                                        src={profile?.profile_picture_url || '/pwa-512x512.png'} 
                                        alt="Foto de perfil"
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.target.src = '/pwa-512x512.png';
                                        }}
                                    />
                                </div>
                                {isOwnProfile && editMode && (
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
                                    <span className="text-green-300">{profile?.alias?.split(' ')[0] || profile?.alias || 'Usuario'}</span>
                                    <span className="text-red-300">{profile?.alias?.split(' ')[1] || ''}</span>
                                </h1>
                                <p className="text-gray-300 text-sm">
                                    {profile?.ubicacion || 'Ubicación no especificada'}
                                </p>
                            </div>
                            
                            {/* Botones de acción */}
                            <div className="flex gap-2 w-full max-w-sm">
                                {isOwnProfile ? (
                                    <>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setEditMode(!editMode)}
                                            className="flex-1 bg-green-500 hover:bg-green-600 text-white border-green-400"
                                        >
                                            <Edit3 className="w-4 h-4 mr-2" />
                                            Editar Perfil
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => navigate('/chats')}
                                            className="flex-1 bg-green-500 hover:bg-green-600 text-white border-green-400"
                                        >
                                            <MessageSquare className="w-4 h-4 mr-2" />
                                            Mensajes
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleLike}
                                            className="flex-1 bg-green-500 hover:bg-green-600 text-white border-green-400"
                                        >
                                            <Heart className="w-4 h-4 mr-2" />
                                            Me gusta
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleStartChat}
                                            className="flex-1 bg-green-500 hover:bg-green-600 text-white border-green-400"
                                        >
                                            <MessageSquare className="w-4 h-4 mr-2" />
                                            Mensaje
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleViewFullProfile}
                                            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white border-blue-400"
                                        >
                                            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 12a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                            </svg>
                                            Ver Perfil
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Información del perfil */}
                <Card className="bg-gray-800 border-gray-700">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-green-400 flex items-center">
                            Información
                            {isOwnProfile && editMode && (
                                <Edit3 className="w-4 h-4 ml-2 text-white" />
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="text-green-400 font-medium block mb-1">Sobre mí</label>
                            {isOwnProfile && editMode ? (
                                <textarea
                                    value={localProfileData?.descripcion || ''}
                                    onChange={(e) => handleInputChange('descripcion', e.target.value)}
                                    className="w-full mt-1 p-2 border rounded-lg bg-white text-black"
                                    placeholder="Cuéntanos sobre ti..."
                                />
                            ) : (
                                <p className="text-white mt-1">
                                    {profile?.descripcion || 'Usuario de AGARCH-AR 👋'}
                                </p>
                            )}
                        </div>
                        
                        <div>
                            <label className="text-green-400 font-medium block mb-1">Género</label>
                            {isOwnProfile && editMode ? (
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
                                    {profile?.genero || 'No Especificado'}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="text-green-400 font-medium block mb-1">Edad</label>
                            {isOwnProfile && editMode ? (
                                <input
                                    type="number"
                                    value={localProfileData?.edad || ''}
                                    onChange={(e) => handleInputChange('edad', e.target.value)}
                                    className="w-full mt-1 p-2 border rounded-lg bg-white text-black"
                                    placeholder="Tu edad"
                                />
                            ) : (
                                <p className="text-white mt-1">
                                    {profile?.edad || 'No especificada'}
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Galería de fotos */}
                <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                        <CardTitle className="text-green-400">Galería de Fotos</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {profile?.fotos && profile.fotos.length > 0 ? (
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
                                        {isOwnProfile && editMode && (
                                            <button
                                                onClick={() => {
                                                    const updatedPhotos = profile?.fotos?.filter((_, i) => i !== index) || [];
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
                                <p>Aún no hay fotos en este perfil.</p>
                                {isOwnProfile && editMode && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setIsUploadModalOpen(true)}
                                        className="mt-2 bg-green-500 hover:bg-green-600 text-white border-green-400"
                                    >
                                        Subir Fotos
                                    </Button>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Galería de videos */}
                <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                        <CardTitle className="text-green-400">Galería de Videos</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {profile?.videos && profile.videos.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {profile.videos.map((video, index) => (
                                    <div key={index} className="relative group">
                                        <video
                                            src={video}
                                            controls
                                            className="w-full h-48 object-cover rounded-lg"
                                        />
                                        {isOwnProfile && editMode && (
                                            <button
                                                onClick={() => {
                                                    const updatedVideos = profile?.videos?.filter((_, i) => i !== index) || [];
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
                                <p>Aún no hay videos en este perfil.</p>
                                {isOwnProfile && editMode && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setIsUploadModalOpen(true)}
                                        className="mt-2 bg-green-500 hover:bg-green-600 text-white border-green-400"
                                    >
                                        Subir Videos
                                    </Button>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Botones de guardar/cancelar para perfil propio */}
                {isOwnProfile && editMode && (
                    <Card className="bg-gray-800 border-gray-700">
                        <CardContent className="pt-6">
                            <div className="flex gap-2 justify-center">
                                <Button
                                    variant="outline"
                                    onClick={handleCancel}
                                    disabled={saveLoading}
                                    className="bg-gray-600 hover:bg-gray-700 text-white border-gray-500"
                                >
                                    <X className="w-4 h-4 mr-2" />
                                    Cancelar
                                </Button>
                                <Button
                                    onClick={handleSave}
                                    disabled={saveLoading}
                                    className="bg-green-500 hover:bg-green-600 text-white"
                                >
                                    {saveLoading ? (
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    ) : (
                                        <Save className="w-4 h-4 mr-2" />
                                    )}
                                    Guardar Cambios
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Lista de seguidos - solo para perfil propio */}
                {isOwnProfile && <FollowingList profile={profile} />}

                {/* Modales */}
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

export default ProfilePage;
