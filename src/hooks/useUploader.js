import { useState } from 'react';
import { db, auth, storage } from '@/lib/firebase'; // 🔥 Firebase client
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast.jsx';
import { v4 as uuidv4 } from 'uuid';

export const useUploader = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadFile = async (file, bucket, folder, onUploadComplete) => {
    if (!file || !user) {
      const error = new Error("No se ha seleccionado un archivo o no estás autenticado.");
      toast({
        variant: "destructive",
        title: "Error de subida",
        description: error.message,
      });
      onUploadComplete(null, error);
      return;
    }

    setIsUploading(true);
    setProgress(0);
    toast({
      title: "Iniciando subida...",
      description: `El archivo ${file.name} se está subiendo.`,
    });

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${folder}/${uuidv4()}.${fileExt}`;

    try {
      const { error: uploadError } = await db.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: publicUrlData } = db.storage.from(bucket).getPublicUrl(fileName);
      
      if (!publicUrlData.publicUrl) {
        throw new Error("No se pudo obtener la URL pública del archivo subido.");
      }
      
      toast({
        title: "¡Éxito!",
        description: "El archivo se ha subido correctamente.",
      });

      onUploadComplete(publicUrlData.publicUrl, null);

    } catch (error) {
      console.error('Upload Error:', error);
      toast({
        variant: "destructive",
        title: "Error al subir el archivo",
        description: error.message,
      });
      onUploadComplete(null, error);
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  };
  
  const uploadFiles = async (files, bucket, folder) => {
    if (!files || files.length === 0 || !user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se han seleccionado archivos o no estás autenticado.",
      });
      return null;
    }

    setIsUploading(true);
    setProgress(0);

    const uploadPromises = files.map(file => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${folder}/${uuidv4()}.${fileExt}`;
      
      return db.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type,
        });
    });

    try {
      const results = await Promise.all(uploadPromises);
      const urls = [];

      for (const result of results) {
        if (result.error) {
          throw result.error;
        }
        const { data: publicUrlData } = db.storage.from(bucket).getPublicUrl(result.data.path);
        if (!publicUrlData.publicUrl) {
          throw new Error("No se pudo obtener la URL pública del archivo subido.");
        }
        urls.push(publicUrlData.publicUrl);
      }
      
      if (urls.length > 0) {
        toast({
            title: "¡Éxito!",
            description: `${urls.length} archivo(s) subido(s) correctamente.`,
        });
      }

      return urls;

    } catch (error) {
      console.error('Upload Error:', error);
      toast({
        variant: "destructive",
        title: "Error al subir archivos",
        description: error.message,
      });
      return null;
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  };


  return { uploadFile, uploadFiles, isUploading, progress };
};
