import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, X, Star, MapPin, SlidersHorizontal, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter, SheetClose } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

const DiscoverPage = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [profiles, setProfiles] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    gender: 'todos',
    sexual_orientation: 'todos',
    relationship_status: 'todos',
    ageRange: [18, 70],
  });

  const fetchProfiles = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    let query = supabase
      .from('profiles')
      .select('*')
      .not('id', 'eq', user.id) // Exclude self
      .limit(50);

    if (filters.gender !== 'todos') {
      query = query.eq('gender', filters.gender);
    }
    if (filters.sexual_orientation !== 'todos') {
      query = query.eq('sexual_orientation', filters.sexual_orientation);
    }
    if (filters.relationship_status !== 'todos') {
      query = query.eq('relationship_status', filters.relationship_status);
    }
    
    // Note: Age filtering would ideally be done in the backend or with a database function.
    // This client-side filtering is a placeholder.
    
    const { data, error } = await query;

    if (error) {
      toast({
        variant: "destructive",
        title: "Error al cargar perfiles",
        description: error.message,
      });
      setProfiles([]);
    } else {
      const sortedProfiles = data.sort((a, b) => (b.is_vip ? 1 : -1) - (a.is_vip ? 1 : -1) || new Date(b.created_at) - new Date(a.created_at));
      setProfiles(sortedProfiles);
    }
    setCurrentIndex(0);
    setLoading(false);
  }, [user, filters, toast]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  const handleLike = () => {
    if (!profile?.is_vip && (profile?.monthly_contacts || 10) <= 0) {
      toast({
        title: "Límite alcanzado",
        description: "Has alcanzado tu límite mensual de contactos. Hazte VIP para contactos ilimitados.",
        variant: "destructive"
      });
      return;
    }
    toast({ title: "🚧 Función en desarrollo", description: "¡Puedes solicitarla en tu próximo prompt! 🚀" });
    nextProfile();
  };

  const handlePass = () => {
    nextProfile();
  };

  const nextProfile = () => {
    setCurrentIndex(prev => prev + 1);
  };

  const calculateAge = (birthDate) => {
    if (!birthDate) return '';
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const currentProfile = profiles[currentIndex];

  return (
    <>
      <Helmet>
        <title>Descubrir - AGARCH-AR</title>
        <meta name="description" content="Encuentra y conecta con nuevos perfiles en AGARCH-AR." />
      </Helmet>
      <div className="max-w-md mx-auto">
        <div className="flex justify-between items-center mb-4 px-4">
          <h1 className="text-2xl font-bold text-green-400">Descubrir</h1>
          <FilterSheet filters={filters} setFilters={setFilters} onApply={fetchProfiles} />
        </div>

        <AnimatePresence mode="wait">
          {loading ? (
            <div className="flex items-center justify-center h-96">
              <div className="loading-spinner" />
            </div>
          ) : currentProfile ? (
            <motion.div
              key={currentProfile.id}
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -50, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className="relative"
            >
              <ProfileCard profile={currentProfile} calculateAge={calculateAge} />
              <div className="flex justify-center space-x-8 mt-6">
                <Button onClick={handlePass} variant="outline" className="w-20 h-20 rounded-full bg-red-500/20 border-red-500 text-red-500 hover:bg-red-500/30">
                  <X size={40} />
                </Button>
                <Button onClick={handleLike} variant="outline" className="w-20 h-20 rounded-full bg-green-500/20 border-green-500 text-green-500 hover:bg-green-500/30">
                  <Heart size={40} />
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 text-white"
            >
              <Heart className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-300 mb-2">No hay más perfiles</h2>
              <p className="text-gray-400">Prueba a cambiar los filtros o vuelve más tarde.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

const ProfileCard = ({ profile, calculateAge }) => (
  <div className="relative aspect-[9/14] w-full rounded-2xl overflow-hidden shadow-2xl card-glass">
    <img  
      src={profile.profile_picture_url || `https://source.unsplash.com/random/400x600?portrait&sig=${profile.id}`} 
      alt={profile.alias} 
      className="absolute inset-0 w-full h-full object-cover" 
    />
    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
    {profile.is_vip && (
      <div className="absolute top-4 right-4 flex items-center bg-yellow-400 text-gray-900 px-3 py-1 rounded-full text-sm font-bold">
        <Crown className="w-4 h-4 mr-1" />
        VIP
      </div>
    )}
    <div className="absolute bottom-0 left-0 p-6 text-white w-full">
      <h2 className="text-3xl font-bold">{profile.alias}, {calculateAge(profile.birth_date)}</h2>
      <div className="flex items-center text-gray-200">
        <MapPin className="w-4 h-4 mr-1" />
        <span>{profile.location || 'Ubicación no disponible'}</span>
      </div>
      <p className="mt-2 text-gray-300 line-clamp-2">{profile.bio}</p>
    </div>
  </div>
);

const FilterSheet = ({ filters, setFilters, onApply }) => {
  const [localFilters, setLocalFilters] = useState(filters);

  const handleApply = () => {
    setFilters(localFilters);
    onApply();
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="btn-outline-action">
          <SlidersHorizontal className="w-4 h-4 mr-2" />
          Filtros
        </Button>
      </SheetTrigger>
      <SheetContent className="bg-gray-900 text-white border-l-gray-700">
        <SheetHeader>
          <SheetTitle className="text-green-400">Filtrar Perfiles</SheetTitle>
        </SheetHeader>
        <div className="grid gap-6 py-6">
          <div className="grid gap-2">
            <Label htmlFor="gender" className="text-green-400">Busco</Label>
            <Select value={localFilters.gender} onValueChange={(value) => setLocalFilters(f => ({ ...f, gender: value }))}>
              <SelectTrigger id="gender" className="input-glass"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="hombre">Hombres</SelectItem>
                <SelectItem value="mujer">Mujeres</SelectItem>
                <SelectItem value="no-binario">No binarios</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="sexual_orientation" className="text-green-400">Orientación Sexual</Label>
            <Select value={localFilters.sexual_orientation} onValueChange={(value) => setLocalFilters(f => ({ ...f, sexual_orientation: value }))}>
              <SelectTrigger id="sexual_orientation" className="input-glass"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas</SelectItem>
                <SelectItem value="heterosexual">Heterosexual</SelectItem>
                <SelectItem value="homosexual">Homosexual</SelectItem>
                <SelectItem value="bisexual">Bisexual</SelectItem>
                <SelectItem value="pansexual">Pansexual</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="relationship_status" className="text-green-400">Estado</Label>
            <Select value={localFilters.relationship_status} onValueChange={(value) => setLocalFilters(f => ({ ...f, relationship_status: value }))}>
              <SelectTrigger id="relationship_status" className="input-glass"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="soltero">Soltero/a</SelectItem>
                <SelectItem value="en-una-relacion">En una relación</SelectItem>
                <SelectItem value="es-complicado">Es complicado</SelectItem>
                <SelectItem value="buscando-algo-casual">Algo casual</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label className="text-green-400">Rango de Edad: {localFilters.ageRange[0]} - {localFilters.ageRange[1]}</Label>
            <Slider
              defaultValue={localFilters.ageRange}
              min={18}
              max={99}
              step={1}
              onValueChange={(value) => setLocalFilters(f => ({ ...f, ageRange: value }))}
            />
          </div>
        </div>
        <SheetFooter>
          <SheetClose asChild>
            <Button onClick={handleApply} className="w-full btn-action">Aplicar Filtros</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default DiscoverPage;