import React, { useRef } from 'react';
import { useToast } from '@/components/ui/use-toast.jsx';
import { Button } from '@/components/ui/button';
import { Upload, AlertTriangle, Loader2, Camera } from 'lucide-react';

const ImageUploader = ({ onUploadSuccess, useCamera = false, uploading, children }) => {
  const { toast } = useToast();
  const fileInputRef = useRef(null);

  const handleFileSelect = () => {
    fileInputRef.current.click();
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast({
        variant: "destructive",
        title: "Archivo demasiado grande",
        description: "El tamaño máximo por imagen es de 5MB.",
      });
      event.target.value = null;
      return;
    }

    await onUploadSuccess(file);
    event.target.value = null;
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
        disabled={uploading}
      />
      {children ? (
        React.cloneElement(children, { onClick: handleFileSelect, disabled: uploading })
      ) : (
        <div className="mt-4 p-4 border border-dashed border-border-color rounded-lg text-center">
           <AlertTriangle className="mx-auto h-10 w-10 text-yellow-400" />
           <h3 className="mt-2 text-sm font-semibold text-text-primary">Recordatorio de Normas</h3>
           <p className="mt-1 text-xs text-text-secondary">
             PROHIBIDO fotos de menores, contenido ilegal, o pornografía infantil. Las cuentas que infrinjan estas normas serán eliminadas permanentemente.
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