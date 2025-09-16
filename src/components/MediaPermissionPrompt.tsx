import React from 'react';
import { Camera, Mic, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMediaPermissions } from '@/hooks/useMediaPermissions';

interface MediaPermissionPromptProps {
  onPermissionsGranted: () => void;
  onSkip: () => void;
}

export default function MediaPermissionPrompt({ 
  onPermissionsGranted, 
  onSkip 
}: MediaPermissionPromptProps) {
  const { 
    permissions, 
    requestCameraPermission, 
    requestMicrophonePermission, 
    requestAllPermissions 
  } = useMediaPermissions();

  const handleRequestAll = async () => {
    const result = await requestAllPermissions();
    if (result.camera && result.microphone) {
      onPermissionsGranted();
    }
  };

  const handleRequestCamera = async () => {
    const granted = await requestCameraPermission();
    if (granted && permissions.microphone === 'granted') {
      onPermissionsGranted();
    }
  };

  const handleRequestMicrophone = async () => {
    const granted = await requestMicrophonePermission();
    if (granted && permissions.camera === 'granted') {
      onPermissionsGranted();
    }
  };

  const allGranted = permissions.camera === 'granted' && permissions.microphone === 'granted';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-xl p-6 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Camera className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-text-primary mb-2">
            Permisos de Medios
          </h2>
          <p className="text-text-secondary">
            Para usar fotos, videos y audios en el chat, necesitamos acceso a tu cámara y micrófono.
          </p>
        </div>

        <div className="space-y-4 mb-6">
          {/* Cámara */}
          <div className="flex items-center justify-between p-3 bg-background rounded-lg">
            <div className="flex items-center gap-3">
              <Camera className="w-5 h-5 text-text-secondary" />
              <span className="text-text-primary">Cámara</span>
            </div>
            <div className="flex items-center gap-2">
              {permissions.camera === 'granted' ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : permissions.camera === 'denied' ? (
                <AlertCircle className="w-5 h-5 text-red-500" />
              ) : (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={handleRequestCamera}
                  disabled={permissions.requesting}
                >
                  Permitir
                </Button>
              )}
            </div>
          </div>

          {/* Micrófono */}
          <div className="flex items-center justify-between p-3 bg-background rounded-lg">
            <div className="flex items-center gap-3">
              <Mic className="w-5 h-5 text-text-secondary" />
              <span className="text-text-primary">Micrófono</span>
            </div>
            <div className="flex items-center gap-2">
              {permissions.microphone === 'granted' ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : permissions.microphone === 'denied' ? (
                <AlertCircle className="w-5 h-5 text-red-500" />
              ) : (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={handleRequestMicrophone}
                  disabled={permissions.requesting}
                >
                  Permitir
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={onSkip}
            className="flex-1"
          >
            Saltar por ahora
          </Button>
          <Button 
            onClick={handleRequestAll}
            disabled={permissions.requesting || allGranted}
            className="flex-1"
          >
            {allGranted ? 'Continuar' : 'Permitir todo'}
          </Button>
        </div>

        {allGranted && (
          <div className="mt-4 text-center">
            <Button 
              onClick={onPermissionsGranted}
              className="w-full"
            >
              ¡Perfecto! Continuar al chat
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
