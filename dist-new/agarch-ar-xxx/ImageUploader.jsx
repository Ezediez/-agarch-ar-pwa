import React, { useRef, useState } from 'react';
import { useToast } from '@/components/ui/use-toast.jsx';
import { Button } from '@/components/ui/button';
import { Upload, AlertTriangle, Loader2, Camera, X } from 'lucide-react';

const ImageUploader = ({ onUploadSuccess, useCamera = false, uploading, children }) => {
  const { toast } = useToast();
  const fileInputRef = useRef(null);
  const [processing, setProcessing] = useState(false);

  const handleFileSelect = () => {
    if (processing || uploading) return;
    fileInputRef.current?.click();
  };

  const validateFile = (file) => {
    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      toast({
        variant: "destructive",
        title: "Tipo de archivo no válido",
        description: "Solo se permiten archivos de imagen (JPG, PNG, WebP).",
      });
      return false;
    }

    // Validar tamaño (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "Archivo demasiado grande",
        description: "El tamaño máximo por imagen es de 5MB.",
      });
      return false;
    }

    return true;
  };

  const compressImage = async (file) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calcular nuevas dimensiones manteniendo aspect ratio
        const maxWidth = 1920;
        const maxHeight = 1080;
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Dibujar imagen redimensionada
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convertir a blob con calidad optimizada
        canvas.toBlob((blob) => {
          const compressedFile = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          resolve(compressedFile);
        }, 'image/jpeg', 0.8);
      };
      
      img.onerror = () => {
        resolve(file); // Si falla la compresión, usar archivo original
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!validateFile(file)) {
      event.target.value = null;
      return;
    }

    setProcessing(true);
    
    try {
      // Comprimir imagen si es necesario
      let processedFile = file;
      if (file.size > 1024 * 1024) { // Comprimir si es mayor a 1MB
        processedFile = await compressImage(file);
      }

      await onUploadSuccess(processedFile);
      
    } catch (error) {
      console.error('Error processing image:', error);
      toast({
        variant: "destructive",
        title: "Error al procesar imagen",
        description: "No se pudo procesar la imagen. Intenta de nuevo.",
      });
    } finally {
      setProcessing(false);
      event.target.value = null;
    }
  };

  const handleCameraError = () => {
    toast({
      variant: "destructive",
      title: "Error de cámara",
      description: "No se pudo acceder a la cámara. Verifica los permisos.",
    });
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden"
        accept="image/png, image/jpeg, image/webp"
        capture={useCamera ? "user" : undefined}
        disabled={uploading || processing}
        onError={handleCameraError}
      />
      {children ? (
        React.cloneElement(children, { 
          onClick: handleFileSelect, 
          disabled: uploading || processing 
        })
      ) : (
        <div className="mt-4 p-4 border border-dashed border-border-color rounded-lg text-center">
           <AlertTriangle className="mx-auto h-10 w-10 text-yellow-400" />
           <h3 className="mt-2 text-sm font-semibold text-text-primary">Recordatorio de Normas</h3>
           <p className="mt-1 text-xs text-text-secondary">
             PROHIBIDO fotos de menores, contenido ilegal, o pornografía infantil. Las cuentas que infrinjan estas normas serán eliminadas permanentemente.
           </p>
           <Button
              onClick={handleFileSelect}
              disabled={uploading || processing}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
            >
              {uploading || processing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {processing ? 'Procesando...' : 'Subiendo...'}
                </>
              ) : (
                <>
                  {useCamera ? <Camera className="mr-2 h-4 w-4" /> : <Upload className="mr-2 h-4 w-4" />}
                  {useCamera ? "Tomar Foto" : "Seleccionar Imagen"}
                </>
              )}
           </Button>
        </div>
      )}
    </>
  );
};

export default ImageUploader;
