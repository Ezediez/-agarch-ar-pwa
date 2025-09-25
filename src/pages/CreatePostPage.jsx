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
    import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
    import { Loader2, Send, Image as ImageIcon, Video as VideoIcon, Radio, X } from 'lucide-react';
    import ImageUploader from '@/components/ImageUploader';
    import VideoUploader from '@/components/VideoUploader';
    import { useUploader } from '@/hooks/useUploader';

    const CreatePostPage = () => {
      const { user } = useAuth();
      const { toast } = useToast();
      const navigate = useNavigate();
      const { uploadFile, uploading, progress } = useUploader();

  const [postType, setPostType] = useState('post'); // 'post', 'story'
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
                    let bucket, folder;
                    
                    if (postType === 'story') {
                        bucket = 'stories';
                        folder = mediaType === 'image' ? 'images' : 'videos';
                    } else {
                        bucket = 'posts';
                        folder = mediaType === 'image' ? 'images' : 'videos';
                    }
                    
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
                
                // Crear publicación o historia
                if (postType === 'story') {
                    await createStory(mediaUrl, mediaType);
                } else {
                    await createPost(mediaUrl, mediaType);
                }
                
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

      const createStory = async (mediaUrl, type) => {
        if (!user?.uid) {
            toast({ variant: 'destructive', title: 'Error', description: 'No hay usuario autenticado.' });
            return;
        }
        
        if (!mediaUrl) {
            toast({ variant: 'destructive', title: 'Error', description: 'Debes seleccionar un archivo para tu historia.' });
            return;
        }

        try {
            await addDoc(collection(db, 'stories'), {
                user_id: user.uid,
                media_url: mediaUrl,
                media_type: type,
                created_at: new Date().toISOString()
            });
            
            toast({ title: '¡Historia creada con éxito!' });
            navigate('/discover');
        } catch (error) {
            console.error('Error al crear story:', error);
            toast({ 
                variant: 'destructive', 
                title: 'Error', 
                description: 'No se pudo crear la historia. Intenta de nuevo.' 
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
                <CardTitle className="text-2xl font-bold text-center text-primary">Crear</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={postType} onValueChange={setPostType} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="post"><Send className="mr-2 h-4 w-4"/>Publicación</TabsTrigger>
                    <TabsTrigger value="story"><Radio className="mr-2 h-4 w-4"/>Historia</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="post">
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
                  </TabsContent>
                  
                  <TabsContent value="story">
                    <div className="space-y-4 mt-4">
                      <p className="text-sm text-center text-text-secondary">Las historias desaparecen después de 24 horas.</p>
                      
                      <Textarea
                        placeholder="Agregar descripción (opcional)"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        className="input-glass min-h-[80px]"
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
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <ImageUploader onUploadSuccess={(file) => handleFileSelect(file, 'image')} uploading={uploading} />
                            <VideoUploader onUploadSuccess={(file) => handleFileSelect(file, 'video')} uploading={uploading} progress={progress} />
                      </div>
                      
                      <Button 
                        onClick={handleSubmit} 
                        disabled={isSubmitting || !mediaFile} 
                        className="w-full btn-action"
                      >
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Radio className="mr-2 h-4 w-4" />}
                        Publicar Historia
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </>
      );
    };

    export default CreatePostPage;
