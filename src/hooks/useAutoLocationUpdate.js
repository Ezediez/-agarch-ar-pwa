import { useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient'; // 🔥 Firebase client
import { useToast } from '@/components/ui/use-toast';

export const useAutoLocationUpdate = (user) => {
  const { toast } = useToast();

  useEffect(() => {
    // Flag to prevent multiple updates per session
    const locationUpdatedKey = `location_updated_${user?.id}`;

    if (!user || sessionStorage.getItem(locationUpdatedKey)) {
      return;
    }

    const updateLocation = () => {
      if (!navigator.geolocation) {
        console.error("Geolocalización no está disponible.");
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          if (typeof latitude !== 'number' || typeof longitude !== 'number') {
            console.error("Coordenadas de geolocalización inválidas.");
            return;
          }

          const { error } = await supabase
            .from('profiles')
            .update({ latitud: latitude, longitud: longitude, updated_at: new Date() })
            .eq('id', user.id);

          if (error) {
            console.error("Error al actualizar la ubicación en Supabase:", error.message);
          } else {
            console.log("✅ Ubicación actualizada en Supabase");
            sessionStorage.setItem(locationUpdatedKey, 'true');
          }
        },
        (error) => {
          console.error("Error de geolocalización:", error.message);
          if (error.code === 1) { // PERMISSION_DENIED
             toast({
                variant: "destructive",
                title: "Permiso de ubicación denegado",
                description: "Para encontrar perfiles cercanos, por favor, habilita la ubicación en los ajustes de tu navegador.",
             });
          }
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 600000 }
      );
    };

    // Use a timeout to ask for permission after the app has loaded
    const timer = setTimeout(updateLocation, 2000); 

    return () => clearTimeout(timer);

  }, [user, toast]);
};