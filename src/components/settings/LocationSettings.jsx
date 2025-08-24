import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast.jsx';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/customSupabaseClient';

const LocationSettings = () => {
  const { profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleUpdateLocation = () => {
    if (!navigator.geolocation) {
      toast({
        variant: "destructive",
        title: "Geolocalización no disponible",
        description: "Tu navegador no soporta la geolocalización.",
      });
      return;
    }

    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        if (typeof latitude !== 'number' || typeof longitude !== 'number') {
           toast({
            variant: "destructive",
            title: "Error al obtener ubicación",
            description: "No se pudieron obtener coordenadas válidas.",
          });
          setLoading(false);
          return;
        }

        const { error } = await supabase
          .from('profiles')
          .update({ 
            latitud: latitude, 
            longitud: longitude, 
            updated_at: new Date().toISOString() 
          })
          .eq('id', profile.id);

        if (error) {
          toast({
            variant: "destructive",
            title: "Error al guardar ubicación",
            description: error.message,
          });
        } else {
          toast({
            title: "¡Éxito!",
            description: "Tu ubicación ha sido actualizada correctamente.",
          });
          await refreshProfile();
        }
        setLoading(false);
      },
      (error) => {
        toast({
          variant: "destructive",
          title: "Error al obtener ubicación",
          description: "No se pudo obtener tu ubicación. Asegúrate de haber concedido los permisos.",
        });
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="card-glass"
    >
      <h2 className="text-2xl font-bold mb-4 text-primary">Ubicación</h2>
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-surface/50 rounded-lg">
          <div className="flex items-center space-x-4">
            <MapPin className="text-cyan-400" />
            <div>
              <h3 className="font-semibold">Actualizar mi ubicación</h3>
              <p className="text-sm text-text-secondary">Usa tu ubicación actual para encontrar perfiles cercanos.</p>
            </div>
          </div>
          <Button onClick={handleUpdateLocation} disabled={loading} className="btn-action">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Actualizando...
              </>
            ) : (
              'Actualizar Ubicación'
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default LocationSettings;