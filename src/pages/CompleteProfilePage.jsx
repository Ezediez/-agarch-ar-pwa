import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from '@/components/ui/textarea';

const CompleteProfilePage = () => {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    alias: '',
    birth_date: '',
    gender: '',
    bio: '',
    sexual_orientation: '',
    relationship_status: '',
    interests: [],
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData({
        alias: profile.alias || '',
        birth_date: profile.birth_date || '',
        gender: profile.gender || '',
        bio: profile.bio || '',
        sexual_orientation: profile.sexual_orientation || '',
        relationship_status: profile.relationship_status || '',
        interests: profile.interests || [],
      });
    }
  }, [profile]);
  
  useEffect(() => {
    if (profile?.alias) {
        navigate('/discover', { replace: true });
    }
  }, [profile, navigate]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSelectChange = (id, value) => {
    setFormData({ ...formData, [id]: value });
  };
  
  const handleInterestsChange = (e) => {
    setFormData({ ...formData, interests: e.target.value.split(',').map(s => s.trim()) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase
      .from('profiles')
      .update({ 
        ...formData, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', user.id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar tu perfil. " + error.message,
      });
    } else {
      toast({
        title: "¡Perfil completado!",
        description: "¡Todo listo para empezar a conectar!",
      });
      await refreshProfile();
      navigate('/discover');
    }
    setLoading(false);
  };

  return (
    <>
      <Helmet>
        <title>Completa tu Perfil - AGARCH-AR</title>
        <meta name="description" content="Un último paso. Completa tu perfil para empezar a conectar en AGARCH-AR." />
      </Helmet>
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-lg mx-auto card-glass p-8 space-y-6"
        >
          <div className="text-center">
            <h1 className="text-3xl font-bold gradient-text">Casi listo...</h1>
            <p className="text-text-secondary mt-2">Completa estos últimos datos para empezar a usar la app.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="alias" className="text-primary">Alias</Label>
              <Input id="alias" value={formData.alias} onChange={handleInputChange} required className="input-glass" />
            </div>

            <div>
              <Label htmlFor="birth_date" className="text-primary">Fecha de Nacimiento</Label>
              <Input id="birth_date" type="date" value={formData.birth_date} onChange={handleInputChange} required className="input-glass" />
            </div>

            <div>
              <Label htmlFor="gender" className="text-primary">Género</Label>
              <Select onValueChange={(value) => handleSelectChange('gender', value)} value={formData.gender}>
                <SelectTrigger id="gender" className="input-glass"><SelectValue placeholder="Selecciona tu género" /></SelectTrigger>
                <SelectContent className="bg-surface text-text-primary border-border-color">
                  <SelectItem value="Hombre">Hombre</SelectItem>
                  <SelectItem value="Mujer">Mujer</SelectItem>
                  <SelectItem value="No binario">No binario</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="bio" className="text-primary">Biografía</Label>
              <Textarea id="bio" value={formData.bio} onChange={handleInputChange} placeholder="Cuéntanos un poco sobre ti..." className="input-glass" />
            </div>

            <Button type="submit" disabled={loading} className="w-full btn-action">
              {loading ? <Loader2 className="animate-spin" /> : "Guardar y Continuar"}
            </Button>
          </form>
        </motion.div>
      </div>
    </>
  );
};

export default CompleteProfilePage;