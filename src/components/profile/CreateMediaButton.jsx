import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Camera, Image, Video, Upload } from 'lucide-react';
import { useUploader } from '@/hooks/useUploader';
import { useToast } from '@/components/ui/use-toast.jsx';

const CreateMediaButton = ({ onMediaUploaded }) => {
    const [isOpen, setIsOpen] = useState(false);
    const { uploadFile, isUploading } = useUploader();
    const { toast } = useToast();

    const handleFileSelect = (type) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = true;
        
        if (type === 'photos') {
            input.accept = 'image/*';
        } else if (type === 'videos') {
            input.accept = 'video/*';
        }

        input.onchange = async (e) => {
            const files = Array.from(e.target.files);
            if (files.length === 0) return;

            const folder = type === 'photos' ? 'profile-photos' : 'profile-videos';
            
            for (const file of files) {
                uploadFile(file, 'media', folder, (url, error) => {
                    if (error) {
                        toast({ 
                            variant: 'destructive', 
                            title: 'Error de subida', 
                            description: error.message 
                        });
                        return;
                    }
                    
                    if (url && onMediaUploaded) {
                        onMediaUploaded(url, type);
                        toast({ 
                            title: `${type === 'photos' ? 'Foto' : 'Video'} subido con éxito` 
                        });
                    }
                });
            }
        };

        input.click();
    };

    const handleCameraCapture = (type) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.capture = 'environment'; // Usar cámara trasera
        input.accept = type === 'photos' ? 'image/*' : 'video/*';

        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const folder = type === 'photos' ? 'profile-photos' : 'profile-videos';
            
            uploadFile(file, 'media', folder, (url, error) => {
                if (error) {
                    toast({ 
                        variant: 'destructive', 
                        title: 'Error de captura', 
                        description: error.message 
                    });
                    return;
                }
                
                if (url && onMediaUploaded) {
                    onMediaUploaded(url, type);
                    toast({ 
                        title: `${type === 'photos' ? 'Foto' : 'Video'} capturado con éxito` 
                    });
                }
            });
        };

        input.click();
    };

    if (!isOpen) {
        return (
            <Button
                variant="outline"
                size="sm"
                onClick={() => setIsOpen(true)}
                className="flex-1 bg-white hover:bg-gray-100 text-gray-800 border-gray-300"
            >
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                </svg>
                Crear
            </Button>
        );
    }

    return (
        <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
                <div className="space-y-3">
                    <h3 className="text-white font-medium">Subir contenido</h3>
                    
                    <div className="grid grid-cols-2 gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleFileSelect('photos')}
                            disabled={isUploading}
                            className="bg-green-500 hover:bg-green-600 text-white border-green-400"
                        >
                            <Image className="w-4 h-4 mr-2" />
                            Fotos
                        </Button>
                        
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCameraCapture('photos')}
                            disabled={isUploading}
                            className="bg-green-500 hover:bg-green-600 text-white border-green-400"
                        >
                            <Camera className="w-4 h-4 mr-2" />
                            Cámara
                        </Button>
                        
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleFileSelect('videos')}
                            disabled={isUploading}
                            className="bg-red-500 hover:bg-red-600 text-white border-red-400"
                        >
                            <Video className="w-4 h-4 mr-2" />
                            Videos
                        </Button>
                        
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCameraCapture('videos')}
                            disabled={isUploading}
                            className="bg-red-500 hover:bg-red-600 text-white border-red-400"
                        >
                            <Camera className="w-4 h-4 mr-2" />
                            Grabar
                        </Button>
                    </div>
                    
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsOpen(false)}
                        className="w-full bg-gray-600 hover:bg-gray-700 text-white border-gray-500"
                    >
                        Cerrar
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};

export default CreateMediaButton;

