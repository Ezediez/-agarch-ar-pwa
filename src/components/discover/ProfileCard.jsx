import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ProfileCard = ({ profile }) => {
  const navigate = useNavigate();

  const calculateAge = (birthDate) => {
    if (!birthDate) return '';
    const today = new Date();
    const birthDateObj = new Date(birthDate);
    let age = today.getFullYear() - birthDateObj.getFullYear();
    const m = today.getMonth() - birthDateObj.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDateObj.getDate())) {
      age--;
    }
    return age;
  };

  const age = calculateAge(profile.birth_date);

  const handleClick = () => {
    navigate(`/profile/${profile.id}`);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.3 }}
      className="relative aspect-[3/4] rounded-xl overflow-hidden cursor-pointer group card-glass"
      onClick={handleClick}
    >
      <img 
        alt={profile.alias || 'Profile picture'}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        src={profile.profile_picture_url || '/pwa-512x512.png'} 
      />
      
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
      
      {profile.is_vip && (
        <div className="absolute top-3 right-3 bg-yellow-400/20 backdrop-blur-sm text-yellow-300 px-2 py-1 rounded-full flex items-center gap-1 text-xs font-bold">
          <Star className="w-3 h-3" />
          <span>VIP</span>
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
        <h3 className="text-xl font-bold truncate">
          {profile.alias}{age && `, ${age}`}
        </h3>
        <div className="flex items-center gap-1 text-sm text-gray-300 mt-1">
          <MapPin className="w-4 h-4" />
          <span className="truncate">{profile.municipio || 'Ubicación desconocida'}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default ProfileCard;
