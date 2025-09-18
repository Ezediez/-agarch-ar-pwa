import React from 'react';
import { Camera, FolderOpen, X } from 'lucide-react';

interface CameraGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCamera: () => void;
  onSelectGallery: () => void;
  mediaType: 'image' | 'video';
}

export default function CameraGalleryModal({ 
  isOpen, 
  onClose, 
  onSelectCamera, 
  onSelectGallery, 
  mediaType 
}: CameraGalleryModalProps) {
  if (!isOpen) return null;

  const isImage = mediaType === 'image';
  const title = isImage ? 'Seleccionar Imagen' : 'Seleccionar Video';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl p-6 max-w-sm w-full relative">
        {/* Botón cerrar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white hover:bg-slate-700 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Título */}
        <h3 className="text-xl font-semibold text-white mb-6 text-center">
          {title}
        </h3>

        {/* Opciones */}
        <div className="space-y-4">
          {/* Cámara */}
          <button
            onClick={() => {
              onSelectCamera();
              onClose();
            }}
            className="w-full flex items-center justify-center gap-3 p-4 rounded-xl bg-green-600 hover:bg-green-500 text-white transition-colors"
          >
            <Camera className="w-6 h-6" />
            <span className="text-lg font-medium">📷 Cámara</span>
          </button>

          {/* Galería */}
          <button
            onClick={() => {
              onSelectGallery();
              onClose();
            }}
            className="w-full flex items-center justify-center gap-3 p-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-colors"
          >
            <FolderOpen className="w-6 h-6" />
            <span className="text-lg font-medium">📁 Galería</span>
          </button>
        </div>

        {/* Pie */}
        <p className="text-sm text-gray-400 text-center mt-4">
          Elige de dónde quieres {isImage ? 'tomar' : 'grabar'} tu {isImage ? 'foto' : 'video'}
        </p>
      </div>
    </div>
  );
}
