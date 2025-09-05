import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient'; // 🔥 Firebase client
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast.jsx';
import ProfileHeader from '@/components/profile/ProfileHeader';
import ProfileInfo from '@/components/profile/ProfileInfo';
import ProfileGallery from '@/components/profile/ProfileGallery';
import ProfileVideos from '@/components/profile/ProfileVideos';
import FollowingList from '@/components/profile/FollowingList';
import { Loader2 } from 'lucide-react';
import { useUploader } from '@/hooks/useUploader';
import UploadModal from '@/components/profile/UploadModal';

const ProfilePage = () => {
    const { id } = useParams();
    const { user, profile: ownProfile, loading: authLoading, refreshProfile } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();
    const { uploadFile, isUploading: uploading, progress } = useUploader();

    const [profile, setProfile] = useState(null);
    const [pageLoading, setPageLoading] = useState(true);
    const [saveLoading, setSaveLoading] = useState(false);
    const [isOwnProfile, setIsOwnProfile] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [localProfileData, setLocalProfileData] = useState(null);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

    const fetchProfile = useCallback(async (profileId) => {
        setPageLoading(true);
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', profileId)
            .single();

        if (error || !data) {
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo cargar el perfil.' });
            navigate('/discover');
        } else {
            setProfile(data);
            setLocalProfileData(data);
        }
        setPageLoading(false);
    }, [toast, navigate]);

    useEffect(() => {
        if (authLoading) return;
        const profileId = id || user?.id;

        if (!profileId) {
            navigate('/login');
            return;
        }
        
        setIsOwnProfile(profileId === user.id);
        if (profileId === user.id && ownProfile) {
            setProfile(ownProfile);
            setLocalProfileData(ownProfile);
            setPageLoading(false);
        } else {
            fetchProfile(profileId);
        }
    }, [id, user, ownProfile, authLoading, fetchProfile, navigate]);
    
    useEffect(() => {
      if (ownProfile && isOwnProfile) {
        setProfile(ownProfile);
        setLocalProfileData(ownProfile);
      }
    }, [ownProfile, isOwnProfile]);

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setLocalProfileData(prev => ({ ...prev, [id]: value }));
    };

    const handleSelectChange = (key, value) => {
        setLocalProfileData(prev => ({ ...prev, [key]: value }));
    };

    const handleInterestsChange = (e) => {
        setLocalProfileData(prev => ({ ...prev, interests: e.target.value.split(',').map(s => s.trim()) }));
    };

    const handleSave = async () => {
        setSaveLoading(true);
        const updates = {
            alias: localProfileData.alias,
            bio: localProfileData.bio,
            gender: localProfileData.gender,
            sexual_orientation: localProfileData.sexual_orientation,
            relationship_status: localProfileData.relationship_status,
            interests: localProfileData.interests,
        };

        const { error } = await supabase.from('profiles').update(updates).eq('id', user.id);
        setSaveLoading(false);

        if (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo actualizar tu perfil.' });
        } else {
            toast({ title: '¡Éxito!', description: 'Tu perfil ha sido actualizado.' });
            setEditMode(false);
            await refreshProfile();
        }
    };

    const handleOpenUploadModal = () => {
        setIsUploadModalOpen(true);
    };

    const handleUpload = (file, type) => {
        if (!file) return;
        
        let bucket = 'media';
        let folder, column, mediaType;

        if (type === 'profile') {
            folder = 'avatars';
            column = 'profile_picture_url';
            mediaType = 'photo';
        } else if (type.includes('gallery')) {
            folder = 'profile-photos';
            column = 'photos';
            mediaType = 'photo';
        } else {
            folder = 'profile-videos';
            column = 'videos';
            mediaType = 'video';
        }

        uploadFile(file, bucket, folder, async (url, error) => {
            if (error) {
                 toast({ variant: 'destructive', title: 'Error de subida', description: error.message });
                 return;
            }
            if (url) {
                let updatedField;
                if (column === 'photos' || column === 'videos') {
                    const currentMedia = profile[column] || [];
                    updatedField = { [column]: [...currentMedia, url] };
                } else {
                    updatedField = { [column]: url };
                }

                const { error: dbError } = await supabase.from('profiles').update(updatedField).eq('id', user.id);

                if (dbError) {
                    toast({ variant: 'destructive', title: 'Error', description: `No se pudo guardar la ${mediaType}.` });
                } else {
                    toast({ title: '¡Éxito!', description: `Tu ${mediaType} ha sido actualizada.` });
                    await refreshProfile();
                    setIsUploadModalOpen(false);
                }
            }
        });
    };
    
    const handleRemoveMedia = async (urlToRemove, mediaType) => {
        const column = mediaType === 'photo' ? 'photos' : 'videos';
        const currentMedia = profile[column] || [];
        const updatedMedia = currentMedia.filter(url => url !== urlToRemove);

        const { error } = await supabase.from('profiles').update({ [column]: updatedMedia }).eq('id', user.id);

        if (error) {
            toast({ variant: 'destructive', title: 'Error', description: `No se pudo eliminar la ${mediaType}.` });
        } else {
            toast({ title: 'Eliminado', description: `La ${mediaType} ha sido eliminada.` });
            await refreshProfile();
        }
    };

    if (pageLoading || !localProfileData) {
        return <div className="flex justify-center items-center h-screen"><Loader2 className="w-12 h-12 animate-spin text-primary"/></div>;
    }

    return (
        <>
            <Helmet>
                <title>{localProfileData.alias || 'Perfil'} - AGARCH-AR</title>
                <meta name="description" content={`Explora el perfil de ${localProfileData.alias || 'un usuario'}.`} />
            </Helmet>
            <div className="max-w-4xl mx-auto p-4 space-y-8">
                <ProfileHeader
                    profile={profile}
                    profileData={localProfileData}
                    editMode={editMode}
                    isOwnProfile={isOwnProfile}
                    onInputChange={handleInputChange}
                    onEditToggle={() => setEditMode(!editMode)}
                    onSave={handleSave}
                    onOpenUploadModal={handleOpenUploadModal}
                    saveLoading={saveLoading}
                />
                
                <ProfileInfo 
                    profile={localProfileData} 
                    isOwnProfile={isOwnProfile}
                    onUpdate={setLocalProfileData}
                    onSave={handleSave}
                />
                
                <ProfileGallery 
                    photos={profile?.photos || []} 
                    editMode={editMode}
                    onOpenUploadModal={handleOpenUploadModal}
                    onRemovePhoto={(url) => handleRemoveMedia(url, 'photo')}
                />
                <ProfileVideos 
                    videos={profile?.videos || []} 
                    editMode={editMode}
                    onOpenUploadModal={handleOpenUploadModal}
                    onRemoveVideo={(url) => handleRemoveMedia(url, 'video')}
                />
                
                {/* Lista de seguidos - solo visible en perfil propio */}
                {isOwnProfile && (
                    <FollowingList isOwnProfile={true} />
                )}
            </div>
            
            <UploadModal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                onUpload={handleUpload}
                uploading={uploading}
                progress={progress}
            />
        </>
    );
};

export default ProfilePage;