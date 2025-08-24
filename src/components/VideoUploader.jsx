import React, { useRef } from 'react';
import { useToast } from '@/components/ui/use-toast.jsx';
import { Button } from '@/components/ui/button';
import { Upload, AlertTriangle, Loader2, Video, Camera } from 'lucide-react';
import { Progress } from "@/components/ui/progress";

const VideoUploader = ({ onUploadSuccess, useCamera = false, uploading, progress, children }) => {
  const { toast } = useToast();
  const fileInputRef = useRef(null);

  const handleFileSelect = () => {
    fileInputRef.current.click();
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) { // 20MB limit for videos
      toast({
        variant: "destructive",
        title: "Video demasiado grande",
        description: "El tamaño máximo por video es de 20MB.",
      });
      event.target.value = null;
      return;
    }

    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = async () => {
      window.URL.revokeObjectURL(video.src);
      if (video.duration > 16) { // 15 seconds + 1s buffer
        toast({
          variant: "destructive",
          title: "Video demasiado largo",
          description: "La duración máxima del video es de 15 segundos.",
        });
        event.target.value = null;
        return;
      }
      await onUploadSuccess(file);
      event.target.value = null;
    };
    video.src = URL.createObjectURL(file);
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden"
        accept="video/mp4,video/webm,video/quicktime"
        capture={useCamera ? "user" : undefined}
        disabled={uploading}
      />
      {children ? (
        React.cloneElement(children, { onClick: handleFileSelect, disabled: uploading })
      ) : (
        <div className="mt-4 p-4 border border-dashed border-border-color rounded-lg text-center">
           <AlertTriangle className="mx-auto h-10 w-10 text-yellow-400" />
           <h3 className="mt-2 text-sm font-semibold text-text-primary">Recordatorio de Normas</h3>
           <p className="mt-1 text-xs text-text-secondary">
             PROHIBIDO videos de menores, contenido ilegal, o pornografía infantil. Las cuentas que infrinjan estas normas serán eliminadas permanentemente.
           </p>
           <Button
              onClick={handleFileSelect}
              disabled={uploading}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Subiendo...
                </>
              ) : (
                <>
                  {useCamera ? <Camera className="mr-2 h-4 w-4" /> : <Video className="mr-2 h-4 w-4" />}
                  {useCamera ? "Grabar Shoot (máx 15s)" : "Seleccionar Video (máx 15s)"}
                </>
              )}
           </Button>
           {uploading && (
              <div className="mt-4">
                  <Progress value={progress} className="w-full" />
                  <p className="text-xs text-text-secondary mt-1">{Math.round(progress)}%</p>
              </div>
           )}
        </div>
      )}
    </>
  );
};

export default VideoUploader;