import React, { useState } from 'react';
    import { Helmet } from 'react-helmet-async';
    import { useNavigate } from 'react-router-dom';
    import { useAuth } from '@/hooks/useAuth';
    import { useToast } from '@/components/ui/use-toast.jsx';
    import { db, auth, storage } from '@/lib/firebase'; // 🔥 Firebase client
import { collection, addDoc } from 'firebase/firestore';
    import { Button } from '@/components/ui/button';
    import { Textarea } from '@/components/ui/textarea';
    import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
    import { Loader2, Send, Image as ImageIcon, Video as VideoIcon, X } from 'lucide-react';
    import ImageUploader from '@/components/ImageUploader';
    import VideoUploader from '@/components/VideoUploader';
    import { useUploader } from '@/hooks/useUploader';

    const CreatePostPage = () => {
      const { user } = useAuth();
      const { toast } = useToast();
      const navigate = useNavigate();
      const { uploadFile, uploading, progress } = useUploader();

  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [mediaType, setMediaType] = useState(null);

        const handleFileSelect = (file, type) => {
            setMediaFile(file);
            setMediaType(type);
            
            // Crear preview
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

        const handleSubmit = async () => {
            setIsSubmitting(true);
            
            try {
                let mediaUrl = null;
                
                if (mediaFile) {
                    const bucket = 'posts';
                    const folder = mediaType === 'image' ? 'images' : 'videos';
                    
                    // Subir archivo usando Promise wrapper
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
                
                // Crear publicación
                await createPost(mediaUrl, mediaType);
                
                // Limpiar formulario
                setText('');
                setMediaFile(null);
                setMediaPreview(null);
                setMediaType(null);
                
            } catch (error) {
                console.error('Error al crear publicación:', error);
                toast({ 
                    variant: 'destructive', 
                    title: 'Error', 
                    description: 'No se pudo crear la publicación. Intenta de nuevo.' 
                });
            } finally {
                setIsSubmitting(false);
            }
        };
      
      const createPost = async (mediaUrl, type) => {
        if (!user?.uid) {
            toast({ variant: 'destructive', title: 'Error', description: 'No hay usuario autenticado.' });
            return;
        }
        
        if (!text.trim() && !mediaUrl) {
            toast({ variant: 'destructive', title: 'Error', description: 'La publicación no puede estar vacía.' });
            return;
        }

        try {
            const postData = {
                user_id: user.uid,
                text: text.trim(),
                created_at: new Date().toISOString(),
                ...(mediaUrl && type === 'image' && { image_url: mediaUrl }),
                ...(mediaUrl && type === 'video' && { video_url: mediaUrl }),
            };

            await addDoc(collection(db, 'posts'), postData);
            
            toast({ title: '¡Publicación creada con éxito!' });
            navigate('/discover');
        } catch (error) {
            console.error('Error al crear post:', error);
            toast({ 
                variant: 'destructive', 
                title: 'Error', 
                description: 'No se pudo crear la publicación. Intenta de nuevo.' 
            });
        }
      };

      const isSubmitDisabled = isSubmitting || uploading;

      return (
        <>
          <Helmet>
            <title>Crear - AGARCH-AR</title>
            <meta name="description" content="Crea una nueva publicación o historia en AGARCH-AR." />
          </Helmet>
          <div className="max-w-2xl mx-auto p-4">
            <Card className="card-glass">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-center text-primary">Crear Publicación</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 mt-4">
                      <Textarea
                        placeholder="¿Qué estás pensando?"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        className="input-glass min-h-[100px]"
                        disabled={isSubmitting}
                      />
                      
                      {/* Vista previa */}
                      {mediaPreview && (
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
                      )}
                      
                      <div>
                        <p className="text-sm font-medium mb-2">Añadir a tu publicación:</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <ImageUploader onUploadSuccess={(file) => handleFileSelect(file, 'image')} uploading={uploading} />
                            <VideoUploader onUploadSuccess={(file) => handleFileSelect(file, 'video')} uploading={uploading} progress={progress} />
                        </div>
                      </div>
                      
                  <Button 
                    onClick={handleSubmit} 
                    disabled={isSubmitting || (!text.trim() && !mediaFile)} 
                    className="w-full btn-action"
                  >
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
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
