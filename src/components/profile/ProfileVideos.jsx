import React from 'react';
import { motion } from 'framer-motion';
import { Upload, X, Plus, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ProfileVideos = ({ videos, editMode, onOpenUploadModal, onRemoveVideo }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="card-glass p-6"
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-primary">Galería de Videos</h2>
        {editMode && (videos?.length || 0) < 2 && (
          <Button onClick={onOpenUploadModal} className="btn-action">
            <Upload className="w-4 h-4 mr-2" />
            Subir Video
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {videos?.map((videoUrl, index) => (
          <div key={index} className="relative group aspect-video">
            <video src={videoUrl} className="w-full h-full object-cover rounded-lg bg-black" controls />
            {editMode && (
              <button 
                onClick={() => onRemoveVideo(videoUrl)}
                className="absolute top-1 right-1 w-6 h-6 bg-secondary rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity z-10"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
        {editMode && (videos?.length || 0) < 2 && (
          <button 
            onClick={onOpenUploadModal}
            className="aspect-video border-2 border-dashed border-border-color rounded-lg flex flex-col items-center justify-center text-text-secondary hover:border-primary hover:text-primary transition-colors"
          >
            <Video className="w-8 h-8" />
            <span className="text-sm mt-1">Añadir Video</span>
          </button>
        )}
      </div>
      {!editMode && videos?.length === 0 && (
        <p className="text-text-secondary">Aún no has subido videos a tu perfil.</p>
      )}
    </motion.div>
  );
};

export default ProfileVideos;