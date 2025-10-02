import { useState } from 'react';
import { db, auth, storage } from '@/lib/firebase'; // 🔥 Firebase client
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast.jsx';
import { v4 as uuidv4 } from 'uuid';

// Función para comprimir imágenes en móviles
const compressImage = (file, maxWidth = 1920, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Calcular nuevas dimensiones manteniendo la proporción
      let { width, height } = img;
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Dibujar imagen redimensionada
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convertir a blob con compresión
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            reject(new Error('Error al comprimir la imagen'));
          }
        },
        file.type,
        quality
      );
    };
    
    img.onerror = () => reject(new Error('Error al cargar la imagen'));
    img.src = URL.createObjectURL(file);
  });
};

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

    // Optimización para móviles: comprimir imagen si es muy grande
    let fileToUpload = file;
    if (file.type.startsWith('image/') && file.size > 2 * 1024 * 1024) { // > 2MB
      try {
        fileToUpload = await compressImage(file);
      } catch (error) {
        console.warn('No se pudo comprimir la imagen, usando original:', error);
      }
    }

    setIsUploading(true);
    setProgress(0);
    toast({
      title: "Iniciando subida...",
      description: `El archivo ${fileToUpload.name} se está subiendo.`,
    });

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.uid}/${folder}/${uuidv4()}.${fileExt}`;

    try {
      const storageRef = ref(storage, `${bucket}/${fileName}`);
      
      // Configuración optimizada para móviles
      const uploadTask = uploadBytesResumable(storageRef, fileToUpload, {
        cacheControl: 'no-cache', // Evitar problemas de caché
        contentType: fileToUpload.type,
        customMetadata: {
          originalName: fileToUpload.name,
          uploadedAt: new Date().toISOString(),
          userId: user.uid
        }
      });

      const downloadURL = await new Promise((resolve, reject) => {
        uploadTask.on('state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setProgress(progress);
          },
          (error) => {
            console.error('Upload error:', error);
            // Manejar errores específicos de caché
            if (error.code === 'storage/retry-limit-exceeded') {
              reject(new Error('Se excedió el límite de reintentos. Intenta de nuevo.'));
            } else if (error.message.includes('ERR_CACHE_OPERATION_NOT_SUPPORTED')) {
              reject(new Error('Error de caché del navegador. Intenta recargar la página.'));
            } else {
              reject(error);
            }
          },
          async () => {
            try {
              const url = await getDownloadURL(uploadTask.snapshot.ref);
              resolve(url);
            } catch (error) {
              console.error('Download URL error:', error);
              if (error.message.includes('ERR_CACHE_OPERATION_NOT_SUPPORTED')) {
                reject(new Error('Error de caché del navegador. Intenta recargar la página.'));
              } else {
                reject(error);
              }
            }
          }
        );
      });
      
      if (!downloadURL) {
        throw new Error("No se pudo obtener la URL pública del archivo subido.");
      }
      
      toast({
        title: "¡Éxito!",
        description: "El archivo se ha subido correctamente.",
      });

      onUploadComplete(downloadURL, null);

    } catch (error) {
      console.error('Upload Error:', error);
      
      let errorMessage = error.message;
      if (error.code === 'storage/unauthorized') {
        errorMessage = "Firebase Storage no está configurado. Contacta al administrador.";
      } else if (error.code === 'storage/canceled') {
        errorMessage = "La subida fue cancelada.";
      } else if (error.code === 'storage/unknown') {
        errorMessage = "Error desconocido de Firebase Storage. Verifica la configuración.";
      } else if (error.message.includes('ERR_CACHE_OPERATION_NOT_SUPPORTED')) {
        errorMessage = "Error de caché del navegador. Intenta recargar la página o usar modo incógnito.";
      } else if (error.message.includes('400')) {
        errorMessage = "Error de conexión con el servidor. Verifica tu conexión a internet.";
      }
      
      toast({
        variant: "destructive",
        title: "Error al subir el archivo",
        description: errorMessage,
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

    try {
      const uploadPromises = files.map(async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.uid}/${folder}/${uuidv4()}.${fileExt}`;
        
        const storageRef = ref(storage, `${bucket}/${fileName}`);
        const uploadTask = uploadBytesResumable(storageRef, file);

        return new Promise((resolve, reject) => {
          uploadTask.on('state_changed',
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setProgress(progress);
            },
            (error) => {
              reject(error);
            },
            async () => {
              try {
                const url = await getDownloadURL(uploadTask.snapshot.ref);
                resolve(url);
              } catch (error) {
                reject(error);
              }
            }
          );
        });
      });

      const urls = await Promise.all(uploadPromises);
      
      if (urls.length > 0) {
        toast({
            title: "¡Éxito!",
            description: `${urls.length} archivo(s) subido(s) correctamente.`,
        });
      }

      return urls;

    } catch (error) {
      console.error('Upload Error:', error);
      
      let errorMessage = error.message;
      if (error.code === 'storage/unauthorized') {
        errorMessage = "Firebase Storage no está configurado. Contacta al administrador.";
      } else if (error.code === 'storage/canceled') {
        errorMessage = "La subida fue cancelada.";
      } else if (error.code === 'storage/unknown') {
        errorMessage = "Error desconocido de Firebase Storage. Verifica la configuración.";
      } else if (error.message.includes('ERR_CACHE_OPERATION_NOT_SUPPORTED')) {
        errorMessage = "Error de caché del navegador. Intenta recargar la página o usar modo incógnito.";
      } else if (error.message.includes('400')) {
        errorMessage = "Error de conexión con el servidor. Verifica tu conexión a internet.";
      }
      
      toast({
        variant: "destructive",
        title: "Error al subir archivos",
        description: errorMessage,
      });
      return null;
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  };


  return { uploadFile, uploadFiles, isUploading, progress };
};
