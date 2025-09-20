import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Camera, Upload, Video } from 'lucide-react';
import ImageUploader from '@/components/ImageUploader';
import VideoUploader from '@/components/VideoUploader';

const UploadModal = ({ isOpen, onClose, onUpload, uploading, progress }) => {

  const handleUpload = (file, type) => {
      console.log('🔄 UploadModal: Archivo recibido:', file.name, 'Tipo:', type);
      onUpload(file, type);
      // We don't close the modal here to allow multiple uploads
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="card-glass max-w-md mx-auto">
        <DialogHeader className="text-center">
          <DialogTitle className="text-2xl font-bold text-primary">
            Subir Contenido
          </DialogTitle>
          <DialogDescription className="text-center">
            Selecciona el tipo de contenido que deseas subir
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 grid grid-cols-2 gap-4">
            
            <ImageUploader onUploadSuccess={(file) => handleUpload(file, 'gallery')} useCamera={false} uploading={uploading}>
                <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center bg-green-500 hover:bg-green-600 text-white border-green-400">
                    <Upload className="w-6 h-6 mb-1" />
                    <span className="text-sm">Fotos</span>
                </Button>
            </ImageUploader>

            <ImageUploader onUploadSuccess={(file) => handleUpload(file, 'camera-gallery')} useCamera={true} uploading={uploading}>
                 <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center bg-green-500 hover:bg-green-600 text-white border-green-400">
                    <Camera className="w-6 h-6 mb-1" />
                    <span className="text-sm">Cámara</span>
                </Button>
            </ImageUploader>
            
            <VideoUploader onUploadSuccess={(file) => handleUpload(file, 'video')} useCamera={false} uploading={uploading} progress={progress}>
                 <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center bg-red-500 hover:bg-red-600 text-white border-red-400">
                    <Video className="w-6 h-6 mb-1" />
                    <span className="text-sm">Videos</span>
                </Button>
            </VideoUploader>

            <VideoUploader onUploadSuccess={(file) => handleUpload(file, 'camera-video')} useCamera={true} uploading={uploading} progress={progress}>
                <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center bg-red-500 hover:bg-red-600 text-white border-red-400">
                    <Camera className="w-6 h-6 mb-1" />
                    <span className="text-sm">Grabar</span>
                </Button>
            </VideoUploader>
        </div>
        
        <div className="flex justify-center pt-4">
            <Button
                variant="outline"
                onClick={onClose}
                className="bg-gray-600 hover:bg-gray-700 text-white border-gray-500 px-8"
            >
                Cerrar
            </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UploadModal;
