import React, { useState } from 'react';
import { db, storage } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast.jsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { X, Upload, Camera, Video, Type, Check, RotateCcw } from 'lucide-react';
import ImageUploader from '@/components/ImageUploader';
import VideoUploader from '@/components/VideoUploader';
import { useUploader } from '@/hooks/useUploader';

const CreateStoryModal = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { uploadFile } = useUploader();
  
  const [storyType, setStoryType] = useState('text'); // 'text', 'image', 'video'
  const [text, setText] = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState('select'); // 'select', 'edit', 'preview'

  const handleFileSelect = (file) => {
    setMediaFile(file);
    
    // Crear preview
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setMediaPreview(e.target.result);
        setStep('edit');
      };
      reader.readAsDataURL(file);
    } else if (file.type.startsWith('video/')) {
      const video = document.createElement('video');
      video.src = URL.createObjectURL(file);
      video.onloadedmetadata = () => {
        setMediaPreview(video.src);
        setStep('edit');
      };
    }
  };

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
      let mediaUrl = null;
      
      // Subir archivo si existe
      if (mediaFile) {
        mediaUrl = await new Promise((resolve, reject) => {
          uploadFile(mediaFile, 'stories', 'media', (url, error) => {
            if (error) {
              reject(error);
            } else {
              resolve(url);
            }
          });
        });
      }

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
      } else if (mediaFile && mediaUrl) {
        storyData.media_url = mediaUrl;
        storyData.media_type = mediaFile.type;
        if (text.trim()) {
          storyData.text = text.trim();
        }
      }

      await addDoc(collection(db, 'stories'), storyData);

      toast({
        title: 'Historia creada',
        description: 'Tu historia se ha publicado exitosamente.'
      });

      // Limpiar formulario
      resetForm();
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

  const resetForm = () => {
    setText('');
    setMediaFile(null);
    setMediaPreview(null);
    setStoryType('text');
    setStep('select');
    setUploading(false);
    setProgress(0);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="card-glass max-w-md mx-auto">
        <DialogHeader className="text-center">
          <DialogTitle>Crear Historia</DialogTitle>
          <DialogDescription>
            Crea una historia con texto, foto o video que durará 24 horas
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Paso 1: Seleccionar tipo */}
          {step === 'select' && (
            <>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={storyType === 'text' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setStoryType('text');
                    setStep('edit');
                  }}
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
                  <Camera className="w-4 h-4" />
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

              {/* Selector de archivo para imagen/video */}
              {storyType === 'image' && (
                <div className="space-y-2">
                  <ImageUploader
                    onUploadSuccess={handleFileSelect}
                    useCamera={true}
                    uploading={uploading}
                  >
                    <Button variant="outline" className="w-full">
                      <Camera className="w-4 h-4 mr-2" />
                      Tomar Foto
                    </Button>
                  </ImageUploader>
                  <ImageUploader
                    onUploadSuccess={handleFileSelect}
                    useCamera={false}
                    uploading={uploading}
                  >
                    <Button variant="outline" className="w-full">
                      <Upload className="w-4 h-4 mr-2" />
                      Desde Galería
                    </Button>
                  </ImageUploader>
                </div>
              )}

              {storyType === 'video' && (
                <div className="space-y-2">
                  <VideoUploader
                    onUploadSuccess={handleFileSelect}
                    useCamera={true}
                    uploading={uploading}
                    progress={progress}
                  >
                    <Button variant="outline" className="w-full">
                      <Video className="w-4 h-4 mr-2" />
                      Grabar Video
                    </Button>
                  </VideoUploader>
                  <VideoUploader
                    onUploadSuccess={handleFileSelect}
                    useCamera={false}
                    uploading={uploading}
                    progress={progress}
                  >
                    <Button variant="outline" className="w-full">
                      <Upload className="w-4 h-4 mr-2" />
                      Desde Galería
                    </Button>
                  </VideoUploader>
                </div>
              )}
            </>
          )}

          {/* Paso 2: Editar y preview */}
          {step === 'edit' && (
            <>
              {/* Vista previa */}
              {mediaPreview && (
                <div className="relative">
                  {storyType === 'image' ? (
                    <img 
                      src={mediaPreview} 
                      alt="Preview" 
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  ) : (
                    <video 
                      src={mediaPreview} 
                      controls 
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  )}
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      setMediaFile(null);
                      setMediaPreview(null);
                      setStep('select');
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {/* Campo de texto */}
              <Textarea
                placeholder={storyType === 'text' ? "¿Qué está pasando?" : "Agregar descripción (opcional)"}
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="min-h-[100px]"
                maxLength={280}
              />

              {/* Botones de navegación */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setStep('select')}
                  className="flex-1"
                  disabled={uploading}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Cambiar
                </Button>
                <Button
                  onClick={() => setStep('preview')}
                  className="flex-1"
                  disabled={storyType === 'text' ? !text.trim() : !mediaFile}
                >
                  <Check className="w-4 h-4 mr-2" />
                  Continuar
                </Button>
              </div>
            </>
          )}

          {/* Paso 3: Preview final */}
          {step === 'preview' && (
            <>
              {/* Preview final */}
              <div className="space-y-4">
                {mediaPreview && (
                  <div className="relative">
                    {storyType === 'image' ? (
                      <img 
                        src={mediaPreview} 
                        alt="Preview final" 
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    ) : (
                      <video 
                        src={mediaPreview} 
                        controls 
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    )}
                  </div>
                )}
                
                {text && (
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm">{text}</p>
                  </div>
                )}
              </div>

              {/* Botones finales */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setStep('edit')}
                  className="flex-1"
                  disabled={uploading}
                >
                  Editar
                </Button>
                <Button
                  onClick={handleCreateStory}
                  className="flex-1"
                  disabled={uploading}
                >
                  {uploading ? 'Publicando...' : 'Publicar Historia'}
                </Button>
              </div>
            </>
          )}

          {/* Botón cancelar siempre visible */}
          <Button
            variant="ghost"
            onClick={handleClose}
            className="w-full"
            disabled={uploading}
          >
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateStoryModal;
