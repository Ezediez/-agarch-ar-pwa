import React, { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useNotificationManager } from '@/hooks/useNotificationManager';
import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Send, X } from 'lucide-react';
import ImageUploader from '@/components/ImageUploader';
import VideoUploader from '@/components/VideoUploader';
import { useUploader } from '@/hooks/useUploader';
import {
  postTemplates,
  textColorOptions,
  getTemplateById,
} from '@/constants/postTemplates';

const CreatePostPage = () => {
  const { user } = useAuth();
  const { toast } = useNotificationManager();
  const navigate = useNavigate();
  const { uploadFile, uploading, progress } = useUploader();

  const templateOptions = useMemo(() => postTemplates, []);
  const defaultTemplate = templateOptions[0];

  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(defaultTemplate?.id ?? null);
  const [selectedTextColor, setSelectedTextColor] = useState(
    defaultTemplate?.defaultTextColor ?? '#ffffff'
  );

  const handleFileSelect = (file, type) => {
    setMediaFile(file);
    setMediaType(type);

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setMediaPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    } else if (file.type.startsWith('video/')) {
      const video = document.createElement('video');
      video.src = URL.createObjectURL(file);
      video.onloadedmetadata = () => {
        setMediaPreview(video.src);
      };
    }
  };

  const handleTemplateSelect = (templateId) => {
    const template = getTemplateById(templateId);
    setSelectedTemplate(templateId);
    if (template) {
      setSelectedTextColor(template.defaultTextColor);
    }
  };

  const showTemplateOptions = !mediaFile && templateOptions.length > 0;

        const handleSubmit = async () => {
            setIsSubmitting(true);

            try {
                let mediaUrl = null;

                if (mediaFile) {
                    const bucket = 'posts';
                    const folder = mediaType === 'image' ? 'images' : 'videos';

                    mediaUrl = await new Promise((resolve, reject) => {
                        uploadFile(mediaFile, bucket, folder, (url, error) => {
                            if (error) {
                                reject(error);
                            } else {
                                resolve(url);
                            }
                        });
                    });
                }

                await createPost(mediaUrl, mediaType);

                setText('');
                setMediaFile(null);
                setMediaPreview(null);
                setMediaType(null);
                if (defaultTemplate) {
                    setSelectedTemplate(defaultTemplate.id);
                    setSelectedTextColor(defaultTemplate.defaultTextColor);
                }
            } catch (error) {
                console.error('Error al crear publicación:', error);
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: 'No se pudo crear la publicación. Intenta de nuevo.',
                });
            } finally {
                setIsSubmitting(false);
            }
        };
      
      const createPost = async (mediaUrl, type) => {
        if (!user?.uid) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'No hay usuario autenticado.',
            });
            return;
        }

        if (!text.trim() && !mediaUrl) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'La publicación no puede estar vacía.',
            });
            return;
        }

        try {
            const postData = {
                user_id: user.uid,
                text: text.trim(),
                created_at: new Date().toISOString(),
                ...(mediaUrl && type === 'image' && { image_url: mediaUrl }),
                ...(mediaUrl && type === 'video' && { video_url: mediaUrl }),
                ...(!mediaUrl && selectedTemplate && {
                    template_id: selectedTemplate,
                    text_color: selectedTextColor,
                }),
            };

            await addDoc(collection(db, 'posts'), postData);

            toast({ title: '¡Publicación creada con éxito!' });
            navigate('/discover');
        } catch (error) {
            console.error('Error al crear post:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'No se pudo crear la publicación. Intenta de nuevo.',
            });
        }
      };

      const isSubmitDisabled = isSubmitting || uploading;
  const selectedTemplateData = selectedTemplate ? getTemplateById(selectedTemplate) : null;
  const isTextTemplate = showTemplateOptions && selectedTemplateData;

  return (
    <>
      <Helmet>
        <title>Crear - AGARCH-AR</title>
        <meta name="description" content="Crea una nueva publicación o historia en AGARCH-AR." />
      </Helmet>
      <div className="max-w-2xl mx-auto p-4">
        <Card className="card-glass">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center text-primary">
              Crear Publicación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-5 mt-4">
              <Textarea
                placeholder="¿Qué estás pensando?"
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="input-glass min-h-[120px]"
                disabled={isSubmitting}
              />

              {showTemplateOptions && (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-text-secondary mb-2">
                      Elegí un estilo para tu publicación de texto
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {templateOptions.map((template) => (
                        <button
                          key={template.id}
                          type="button"
                          onClick={() => handleTemplateSelect(template.id)}
                          className={`relative h-20 rounded-lg border transition-all ${
                            selectedTemplate === template.id
                              ? 'border-primary ring-2 ring-primary/40'
                              : 'border-border-color hover:border-primary/60'
                          }`}
                          style={{ background: template.background }}
                        >
                          <span className="absolute inset-0 flex items-center justify-center text-white font-semibold drop-shadow">
                            {template.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-text-secondary mb-2">Color del texto</p>
                    <div className="flex flex-wrap gap-2">
                      {textColorOptions.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setSelectedTextColor(color)}
                          className={`w-9 h-9 rounded-full border transition-all ${
                            selectedTextColor === color
                              ? 'border-2 border-primary ring-2 ring-primary/30'
                              : 'border-border-color hover:border-primary/60'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {mediaPreview ? (
                <div className="relative">
                  {mediaType === 'image' ? (
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
                      setMediaType(null);
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                isTextTemplate && (
                  <div
                    className="rounded-xl p-6 min-h-[180px] flex items-center justify-center text-center"
                    style={{
                      background: selectedTemplateData.background,
                      color: selectedTextColor,
                      transition: 'background 0.3s ease, color 0.3s ease',
                    }}
                  >
                    <p className="text-xl font-semibold whitespace-pre-wrap break-words">
                      {text.trim() ? text : 'Tu texto aparecerá acá 😎'}
                    </p>
                  </div>
                )
              )}

              <div>
                <p className="text-sm font-medium mb-2">Añadir a tu publicación:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ImageUploader
                    onUploadSuccess={(file) => handleFileSelect(file, 'image')}
                    uploading={uploading}
                  />
                  <VideoUploader
                    onUploadSuccess={(file) => handleFileSelect(file, 'video')}
                    uploading={uploading}
                    progress={progress}
                  />
                </div>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={isSubmitDisabled || (!text.trim() && !mediaFile)}
                className="w-full btn-action"
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Publicar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default CreatePostPage;
