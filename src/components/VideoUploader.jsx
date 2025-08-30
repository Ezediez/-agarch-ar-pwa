import React, { useRef, useState } from 'react';
import { useToast } from '@/components/ui/use-toast.jsx';
import { Button } from '@/components/ui/button';
import { Upload, AlertTriangle, Loader2, Video, Camera } from 'lucide-react';
import { Progress } from "@/components/ui/progress";

const VideoUploader = ({ onUploadSuccess, useCamera = false, uploading, progress, children }) => {
  const { toast } = useToast();
  const fileInputRef = useRef(null);
  const [processing, setProcessing] = useState(false);

  const handleFileSelect = () => {
    if (processing || uploading) return;
    fileInputRef.current?.click();
  };

  const validateFile = (file) => {
    // Validar tipo de archivo
    const validTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
    if (!validTypes.includes(file.type)) {
      toast({
        variant: "destructive",
        title: "Tipo de archivo no válido",
        description: "Solo se permiten archivos de video (MP4, WebM, MOV, AVI).",
      });
      return false;
    }

    // Validar tamaño (20MB)
    if (file.size > 20 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "Video demasiado grande",
        description: "El tamaño máximo por video es de 20MB.",
      });
      return false;
    }

    return true;
  };

  const validateVideoDuration = (file) => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        if (video.duration > 16) { // 15 segundos + 1s buffer
          toast({
            variant: "destructive",
            title: "Video demasiado largo",
            description: "La duración máxima del video es de 15 segundos.",
          });
          resolve(false);
        } else {
          resolve(true);
        }
      };
      
      video.onerror = () => {
        window.URL.revokeObjectURL(video.src);
        toast({
          variant: "destructive",
          title: "Error al validar video",
          description: "No se pudo validar el archivo de video.",
        });
        resolve(false);
      };
      
      video.src = URL.createObjectURL(file);
    });
  };

  const compressVideo = async (file) => {
    // Para videos, la compresión es más compleja y requiere librerías adicionales
    // Por ahora, retornamos el archivo original
    // En el futuro se puede implementar con WebCodecs API o librerías como FFmpeg.wasm
    return file;
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
      // Validar duración del video
      const isValidDuration = await validateVideoDuration(file);
      if (!isValidDuration) {
        event.target.value = null;
        return;
      }

      // Comprimir video si es necesario (implementación futura)
      let processedFile = file;
      if (file.size > 10 * 1024 * 1024) { // Comprimir si es mayor a 10MB
        processedFile = await compressVideo(file);
      }

      await onUploadSuccess(processedFile);
      
    } catch (error) {
      console.error('Error processing video:', error);
      toast({
        variant: "destructive",
        title: "Error al procesar video",
        description: "No se pudo procesar el video. Intenta de nuevo.",
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
        accept="video/mp4,video/webm,video/quicktime,video/x-msvideo"
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
             PROHIBIDO videos de menores, contenido ilegal, o pornografía infantil. Las cuentas que infrinjan estas normas serán eliminadas permanentemente.
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
                  {useCamera ? <Camera className="mr-2 h-4 w-4" /> : <Video className="mr-2 h-4 w-4" />}
                  {useCamera ? "Grabar Video (máx 15s)" : "Seleccionar Video (máx 15s)"}
                </>
              )}
           </Button>
           {(uploading || processing) && (
             <div className="mt-4">
               <Progress value={progress || 0} className="w-full" />
               <p className="text-xs text-text-secondary mt-2">
                 {processing ? 'Procesando video...' : `Subiendo... ${progress || 0}%`}
               </p>
             </div>
           )}
        </div>
      )}
    </>
  );
};

export default VideoUploader;