import React from 'react';
import { motion } from 'framer-motion';
import { Upload, X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ProfileGallery = ({ photos, editMode, onOpenUploadModal, onRemovePhoto }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="card-glass p-6"
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-primary">Galería de Fotos</h2>
        {editMode && (photos?.length || 0) < 5 && (
          <Button onClick={() => onOpenUploadModal('gallery')} className="btn-action">
            <Upload className="w-4 h-4 mr-2" />
            Subir Foto
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {photos?.map((photo, index) => (
          <div key={index} className="relative group aspect-square">
            <img  src={photo} alt={`Foto de galería ${index + 1}`} className="w-full h-full object-cover rounded-lg" />
            {editMode && (
              <button 
                onClick={() => onRemovePhoto(photo)}
                className="absolute top-1 right-1 w-6 h-6 bg-secondary rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
        {editMode && (photos?.length || 0) < 5 && (
          <button 
            onClick={() => onOpenUploadModal('gallery')}
            className="aspect-square border-2 border-dashed border-border-color rounded-lg flex flex-col items-center justify-center text-text-secondary hover:border-primary hover:text-primary transition-colors"
          >
            <Plus className="w-8 h-8" />
            <span className="text-sm mt-1">Añadir</span>
          </button>
        )}
      </div>
      {!editMode && photos?.length === 0 && (
        <p className="text-text-secondary">Aún no has subido fotos a tu galería.</p>
      )}
    </motion.div>
  );
};

export default ProfileGallery;
