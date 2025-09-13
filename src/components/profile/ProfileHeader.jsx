import React from 'react';
import { motion } from 'framer-motion';
import { Camera, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import ProfileActions from './ProfileActions';
import OtherProfileActions from './OtherProfileActions';

const ProfileHeader = ({
  profile,
  profileData,
  editMode,
  isOwnProfile,
  onInputChange,
  onEditToggle,
  onSave,
  onOpenUploadModal,
  saveLoading,
}) => {
  return (
    <motion.div
      className="card-glass p-6 rounded-b-xl"
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="relative flex flex-col items-center">
        <Avatar className="w-32 h-32 border-4 border-primary shadow-lg">
          <AvatarImage src={profileData.profile_picture_url} alt={profileData.alias} />
          <AvatarFallback className="text-4xl bg-gradient-to-br from-primary to-secondary text-primary-foreground">
            {profileData.alias ? profileData.alias.charAt(0).toUpperCase() : <User />}
          </AvatarFallback>
        </Avatar>
        {isOwnProfile && (
          <Button
            variant="outline"
            size="icon"
            className="absolute bottom-0 right-1/3 transform translate-x-1/2 rounded-full w-10 h-10 bg-background/80"
            onClick={() => onOpenUploadModal('profile')}
          >
            <Camera className="w-5 h-5" />
          </Button>
        )}

        <div className="mt-4 text-center w-full">
          {editMode ? (
            <div className="flex justify-center items-center gap-2">
              <Input
                id="alias"
                value={profileData.alias || ''}
                onChange={onInputChange}
                className="text-3xl font-bold text-center w-auto bg-transparent border-b-2 border-primary focus:ring-0"
              />
            </div>
          ) : (
            <h1 className="text-4xl font-bold gradient-text">{profileData.alias || 'Usuario'}</h1>
          )}
          <p className="text-text-secondary mt-1">{profileData.location || 'Ubicación no especificada'}</p>
          
          {/* Mensaje para completar perfil */}
          {isOwnProfile && (!profileData.alias || !profileData.bio || !profileData.gender) && (
            <div className="mt-4 p-4 bg-primary/10 border border-primary/20 rounded-lg">
              <p className="text-primary font-medium">💡 Completa tu perfil</p>
              <p className="text-text-secondary text-sm mt-1">
                Agrega tu alias, biografía y género para que otros usuarios puedan conocerte mejor.
              </p>
            </div>
          )}
        </div>

        {isOwnProfile ? (
          <ProfileActions
            editMode={editMode}
            onEditToggle={onEditToggle}
            onSave={onSave}
            onOpenUploadModal={onOpenUploadModal}
            saveLoading={saveLoading}
          />
        ) : (
          <OtherProfileActions profile={profile} />
        )}
      </div>
    </motion.div>
  );
};

export default ProfileHeader;
