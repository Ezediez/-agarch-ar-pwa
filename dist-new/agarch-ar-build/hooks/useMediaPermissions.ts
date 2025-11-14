import { useState, useEffect } from 'react';

export interface MediaPermissions {
  camera: PermissionState | null;
  microphone: PermissionState | null;
  requesting: boolean;
}

export function useMediaPermissions() {
  const [permissions, setPermissions] = useState<MediaPermissions>({
    camera: null,
    microphone: null,
    requesting: false
  });

  // Verificar permisos existentes
  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    if (!navigator.permissions) {
      console.log('Permissions API not supported');
      return;
    }

    try {
      const [cameraPermission, micPermission] = await Promise.all([
        navigator.permissions.query({ name: 'camera' as PermissionName }),
        navigator.permissions.query({ name: 'microphone' as PermissionName })
      ]);

      setPermissions({
        camera: cameraPermission.state,
        microphone: micPermission.state,
        requesting: false
      });
    } catch (error) {
      console.log('Error checking permissions:', error);
    }
  };

  const requestCameraPermission = async (): Promise<boolean> => {
    setPermissions(prev => ({ ...prev, requesting: true }));
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true,
        audio: false 
      });
      
      // Detener el stream inmediatamente
      stream.getTracks().forEach(track => track.stop());
      
      setPermissions(prev => ({ 
        ...prev, 
        camera: 'granted',
        requesting: false 
      }));
      
      return true;
    } catch (error) {
      console.error('Camera permission denied:', error);
      setPermissions(prev => ({ 
        ...prev, 
        camera: 'denied',
        requesting: false 
      }));
      
      return false;
    }
  };

  const requestMicrophonePermission = async (): Promise<boolean> => {
    setPermissions(prev => ({ ...prev, requesting: true }));
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true,
        video: false 
      });
      
      // Detener el stream inmediatamente
      stream.getTracks().forEach(track => track.stop());
      
      setPermissions(prev => ({ 
        ...prev, 
        microphone: 'granted',
        requesting: false 
      }));
      
      return true;
    } catch (error) {
      console.error('Microphone permission denied:', error);
      setPermissions(prev => ({ 
        ...prev, 
        microphone: 'denied',
        requesting: false 
      }));
      
      return false;
    }
  };

  const requestAllPermissions = async (): Promise<{ camera: boolean; microphone: boolean }> => {
    setPermissions(prev => ({ ...prev, requesting: true }));
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true,
        audio: true 
      });
      
      // Detener el stream inmediatamente
      stream.getTracks().forEach(track => track.stop());
      
      setPermissions(prev => ({ 
        ...prev, 
        camera: 'granted',
        microphone: 'granted',
        requesting: false 
      }));
      
      return { camera: true, microphone: true };
    } catch (error) {
      console.error('Media permissions denied:', error);
      
      // Intentar permisos individuales
      const cameraGranted = await requestCameraPermission();
      const micGranted = await requestMicrophonePermission();
      
      return { camera: cameraGranted, microphone: micGranted };
    }
  };

  return {
    permissions,
    requestCameraPermission,
    requestMicrophonePermission,
    requestAllPermissions,
    checkPermissions
  };
}
