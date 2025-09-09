import React, { useState } from 'react';
    import { Helmet } from 'react-helmet-async';
    import { useNavigate } from 'react-router-dom';
    import { useAuth } from '@/hooks/useAuth';
    import { useToast } from '@/components/ui/use-toast.jsx';
    import { db, auth, storage } from '@/lib/firebase'; // 🔥 Firebase client
    import { Button } from '@/components/ui/button';
    import { Textarea } from '@/components/ui/textarea';
    import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
    import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
    import { Loader2, Send, Image as ImageIcon, Video as VideoIcon, Radio } from 'lucide-react';
    import ImageUploader from '@/components/ImageUploader';
    import VideoUploader from '@/components/VideoUploader';
    import { useUploader } from '@/hooks/useUploader';

    const CreatePostPage = () => {
      const { user } = useAuth();
      const { toast } = useToast();
      const navigate = useNavigate();
      const { uploadFile, uploading, progress, setProgress } = useUploader();

      const [postType, setPostType] = useState('post'); // 'post', 'story'
      const [text, setText] = useState('');
      const [isSubmitting, setIsSubmitting] = useState(false);

        const handleUploadAndSubmit = async (file, type) => {
    setIsSubmitting(true);
    let mediaUrl = null;
    let folder;

    if (file) {
      if (postType === 'story') {
        folder = type === 'image' ? 'stories' : 'story-videos';
      } else {
        folder = type === 'image' ? 'posts' : 'post-videos';
      }
      
      // Usar el callback correcto de uploadFile
      uploadFile(file, 'media', folder, async (url, error) => {
        if (error) {
          toast({ variant: 'destructive', title: 'Error de subida', description: error.message });
          setIsSubmitting(false);
          return;
        }
        
        if (url) {
          if (postType === 'story') {
            await createStory(url, type);
          } else {
            await createPost(url, type);
          }
        }
        setIsSubmitting(false);
      });
      return; // Salir aquí ya que uploadFile es asíncrono con callback
    }

    // Si no hay archivo, crear publicación solo con texto
    if (postType === 'story') {
      await createStory(null, type);
    } else {
      await createPost(null, type);
    }
    setIsSubmitting(false);
  };
      
      const createPost = async (mediaUrl, type) => {
        if (!text.trim() && !mediaUrl) {
            toast({ variant: 'destructive', title: 'Error', description: 'La publicación no puede estar vacía.' });
            return;
        }

        const postData = {
            user_id: user.id,
            text: text,
            ...(mediaUrl && type === 'image' && { image_url: mediaUrl }),
            ...(mediaUrl && type === 'video' && { video_url: mediaUrl }),
        };

        const { error } = await db.from('posts').insert(postData);

        if (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo crear la publicación.' });
        } else {
            toast({ title: '¡Publicación creada con éxito!' });
            navigate('/discover');
        }
      };

      const createStory = async (mediaUrl, type) => {
        if (!mediaUrl) {
            toast({ variant: 'destructive', title: 'Error', description: 'Debes seleccionar un archivo para tu historia.' });
            return;
        }

        const { error } = await db.from('stories').insert({
            user_id: user.id,
            media_url: mediaUrl,
            media_type: type
        });

        if (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo crear la historia.' });
        } else {
            toast({ title: '¡Historia creada con éxito!' });
            navigate('/discover');
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
                        disabled={isSubmitDisabled}
                      />
                      <div>
                        <p className="text-sm font-medium mb-2">Añadir a tu publicación:</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <ImageUploader onUploadSuccess={(file) => handleUploadAndSubmit(file, 'image')} uploading={uploading} />
                            <VideoUploader onUploadSuccess={(file) => handleUploadAndSubmit(file, 'video')} uploading={uploading} progress={progress} />
                        </div>
                      </div>
                      <Button onClick={() => handleUploadAndSubmit(null, 'text')} disabled={isSubmitDisabled || (!text.trim())} className="w-full btn-action">
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                        Publicar
                      </Button>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="story">
                    <div className="space-y-4 mt-4">
                      <p className="text-sm text-center text-text-secondary">Las historias desaparecen después de 24 horas.</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <ImageUploader onUploadSuccess={(file) => handleUploadAndSubmit(file, 'image')} uploading={uploading} />
                            <VideoUploader onUploadSuccess={(file) => handleUploadAndSubmit(file, 'video')} uploading={uploading} progress={progress} />
                      </div>
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
