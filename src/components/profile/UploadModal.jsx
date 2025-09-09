import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Camera, Upload, Video } from 'lucide-react';
import ImageUploader from '@/components/ImageUploader';
import VideoUploader from '@/components/VideoUploader';

const UploadModal = ({ isOpen, onClose, onUpload, uploading, progress }) => {

  const handleUpload = (file, type) => {
      onUpload(file, type);
      // We don't close the modal here to allow multiple uploads
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="card-glass">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-primary">
            Subir Contenido
          </DialogTitle>
          <DialogDescription>
            Selecciona el tipo de contenido que deseas subir. Recuerda seguir las normas de la comunidad.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <ImageUploader onUploadSuccess={(file) => handleUpload(file, 'gallery')} useCamera={false} uploading={uploading}>
                <Button variant="outline" className="w-full h-24 flex flex-col">
                    <Upload className="w-8 h-8 mb-2" />
                    <span>Subir Foto</span>
                </Button>
            </ImageUploader>

            <ImageUploader onUploadSuccess={(file) => handleUpload(file, 'camera-gallery')} useCamera={true} uploading={uploading}>
                 <Button variant="outline" className="w-full h-24 flex flex-col">
                    <Camera className="w-8 h-8 mb-2" />
                    <span>Tomar Foto</span>
                </Button>
            </ImageUploader>
            
            <VideoUploader onUploadSuccess={(file) => handleUpload(file, 'video')} useCamera={false} uploading={uploading} progress={progress}>
                 <Button variant="outline" className="w-full h-24 flex flex-col">
                    <Video className="w-8 h-8 mb-2" />
                    <span>Subir Video</span>
                </Button>
            </VideoUploader>

            <VideoUploader onUploadSuccess={(file) => handleUpload(file, 'camera-video')} useCamera={true} uploading={uploading} progress={progress}>
                <Button variant="outline" className="w-full h-24 flex flex-col">
                    <Camera className="w-8 h-8 mb-2" />
                    <span>Grabar Video</span>
                </Button>
            </VideoUploader>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UploadModal;
