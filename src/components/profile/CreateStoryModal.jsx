import React, { useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast.jsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { X, Upload, Camera, Video, Type } from 'lucide-react';
import ImageUploader from '@/components/ImageUploader';
import VideoUploader from '@/components/VideoUploader';

const CreateStoryModal = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [storyType, setStoryType] = useState('text'); // 'text', 'image', 'video'
  const [text, setText] = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleCreateStory = async () => {
    if (!user?.uid) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Debes estar autenticado para crear historias.'
      });
      return;
    }

    if (storyType === 'text' && !text.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'El texto no puede estar vacío.'
      });
      return;
    }

    if ((storyType === 'image' || storyType === 'video') && !mediaFile) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Debes seleccionar una imagen o video.'
      });
      return;
    }

    setUploading(true);

    try {
      const storyData = {
        user_id: user.uid,
        type: storyType,
        created_at: serverTimestamp(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 horas
        views: [],
        likes: [],
        status: 'active'
      };

      if (storyType === 'text') {
        storyData.text = text.trim();
      } else if (mediaFile) {
        // Aquí implementarías la subida del archivo a Firebase Storage
        // Por ahora, simulamos la URL
        storyData.media_url = URL.createObjectURL(mediaFile);
        storyData.media_type = mediaFile.type;
      }

      await addDoc(collection(db, 'stories'), storyData);

      toast({
        title: 'Historia creada',
        description: 'Tu historia se ha publicado exitosamente.'
      });

      // Limpiar formulario
      setText('');
      setMediaFile(null);
      setStoryType('text');
      onClose();

    } catch (error) {
      console.error('Error creating story:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo crear la historia. Inténtalo de nuevo.'
      });
    } finally {
      setUploading(false);
    }
  };

  const handleFileUpload = (file) => {
    setMediaFile(file);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="card-glass max-w-md mx-auto">
        <DialogHeader className="text-center">
          <DialogTitle>Crear Historia</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Selector de tipo */}
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant={storyType === 'text' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStoryType('text')}
              className="flex flex-col items-center gap-1 h-16"
            >
              <Type className="w-4 h-4" />
              <span className="text-xs">Texto</span>
            </Button>
            <Button
              variant={storyType === 'image' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStoryType('image')}
              className="flex flex-col items-center gap-1 h-16"
            >
              <Upload className="w-4 h-4" />
              <span className="text-xs">Foto</span>
            </Button>
            <Button
              variant={storyType === 'video' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStoryType('video')}
              className="flex flex-col items-center gap-1 h-16"
            >
              <Video className="w-4 h-4" />
              <span className="text-xs">Video</span>
            </Button>
          </div>

          {/* Contenido según el tipo */}
          {storyType === 'text' && (
            <Textarea
              placeholder="¿Qué está pasando?"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="min-h-[100px]"
              maxLength={280}
            />
          )}

          {storyType === 'image' && (
            <div className="space-y-2">
              <ImageUploader
                onUploadSuccess={handleFileUpload}
                useCamera={false}
                uploading={uploading}
              >
                <Button variant="outline" className="w-full">
                  <Camera className="w-4 h-4 mr-2" />
                  Seleccionar Imagen
                </Button>
              </ImageUploader>
              {mediaFile && (
                <div className="text-sm text-muted-foreground">
                  Archivo seleccionado: {mediaFile.name}
                </div>
              )}
            </div>
          )}

          {storyType === 'video' && (
            <div className="space-y-2">
              <VideoUploader
                onUploadSuccess={handleFileUpload}
                useCamera={false}
                uploading={uploading}
                progress={progress}
              >
                <Button variant="outline" className="w-full">
                  <Video className="w-4 h-4 mr-2" />
                  Seleccionar Video
                </Button>
              </VideoUploader>
              {mediaFile && (
                <div className="text-sm text-muted-foreground">
                  Archivo seleccionado: {mediaFile.name}
                </div>
              )}
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={uploading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateStory}
              className="flex-1"
              disabled={uploading}
            >
              {uploading ? 'Publicando...' : 'Publicar Historia'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateStoryModal;
