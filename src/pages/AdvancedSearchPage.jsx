import React, { useState, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast.jsx';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Search, Loader2, Frown } from 'lucide-react';
import ProfileCard from '@/components/discover/ProfileCard';
import { Checkbox } from '@/components/ui/checkbox';

const AdvancedSearchPage = () => {
  const { toast } = useToast();
  const { user, profile: currentUserProfile } = useAuth();
  const [filters, setFilters] = useState({
    keyword: '',
    gender: 'Todos',
    sexualOrientation: 'Todas',
    relationshipStatus: 'Todos',
    ageRange: [18, 70],
    distance: 500, // Default to max distance
    intentions: [],
  });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleFilterChange = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleIntentionChange = useCallback((intentionId) => {
    setFilters(prev => {
      const newIntentions = prev.intentions.includes(intentionId)
        ? prev.intentions.filter(id => id !== intentionId)
        : [...prev.intentions, intentionId];
      return { ...prev, intentions: newIntentions };
    });
  }, []);

  const handleSearch = useCallback(async () => {
    if (!user) {
        toast({ variant: 'destructive', title: 'Error', description: 'Debes iniciar sesión para buscar.' });
        return;
    }
    setLoading(true);
    setSearched(true);
    setResults([]);

    try {
        const hasLocation = currentUserProfile?.latitud && currentUserProfile?.longitud;

        if (!hasLocation && filters.distance < 500) {
            toast({
                title: "Ubicación no disponible",
                description: "Para una búsqueda por distancia más precisa, activa tu ubicación en Ajustes.",
            });
        }

        const { data, error } = await supabase.rpc('get_nearby_profiles', {
            p_user_id: user.id,
            p_max_distance_km: filters.distance,
            p_gender: filters.gender === 'Todos' ? null : filters.gender,
            p_min_age: filters.ageRange[0],
            p_max_age: filters.ageRange[1],
            p_search_term: filters.keyword.trim() || null
        });

        if (error) throw error;
      
        let filteredData = data || [];

        // These filters are now redundant because the RPC handles them, but keeping for clarity
        if (filters.sexualOrientation !== 'Todas') {
            filteredData = filteredData.filter(p => p.sexual_orientation === filters.sexualOrientation);
        }
        if (filters.relationshipStatus !== 'Todos') {
            filteredData = filteredData.filter(p => p.relationship_status === filters.relationshipStatus);
        }
        if (filters.intentions.length > 0) {
            filteredData = filteredData.filter(p => p.preferences && filters.intentions.some(i => p.preferences.includes(i)));
        }

        setResults(filteredData);

    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error en la búsqueda",
        description: error.message || "No se pudieron obtener los perfiles. Inténtalo de nuevo.",
      });
    } finally {
      setLoading(false);
    }
  }, [filters, toast, currentUserProfile, user]);
  
  const intentionsList = [
    { id: 'casual', label: 'De Trampa / Casual' },
    { id: 'sexo', label: 'Solo encuentros para sexo' },
    { id: 'chat', label: 'Solo chats' },
    { id: 'relacion', label: 'Relación seria' },
  ];

  const selectContentClass = "bg-surface text-text-primary border-border-color";

  return (
    <>
      <Helmet>
        <title>Buscador Avanzado - AGARCH-AR</title>
        <meta name="description" content="Encuentra exactamente lo que buscas con el buscador avanzado de AGARCH-AR. Filtra por distancia, edad, intereses y más." />
      </Helmet>
      <div className="flex flex-col lg:flex-row gap-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:w-1/3 xl:w-1/4 card-glass p-6 rounded-lg self-start"
        >
          <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
            <Search className="text-primary" />
            Buscador Avanzado
          </h1>
          <p className="text-text-secondary mb-6">Usa los filtros para encontrar exactamente lo que buscas.</p>

          <div className="space-y-6">
            <div>
              <Label htmlFor="keyword" className="text-primary font-semibold">Palabra clave</Label>
              <Input
                id="keyword"
                placeholder="Alias, interés, en la bio..."
                className="input-glass mt-2"
                value={filters.keyword}
                onChange={(e) => handleFilterChange('keyword', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="gender" className="text-primary font-semibold">Busco</Label>
              <Select value={filters.gender} onValueChange={(value) => handleFilterChange('gender', value)}>
                <SelectTrigger id="gender" className="input-glass mt-2">
                  <SelectValue placeholder="Seleccionar género" />
                </SelectTrigger>
                <SelectContent className={selectContentClass}>
                  <SelectItem value="Todos">Todos</SelectItem>
                  <SelectItem value="Hombre">Hombres</SelectItem>
                  <SelectItem value="Mujer">Mujeres</SelectItem>
                  <SelectItem value="No binario">No binarios</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="sexualOrientation" className="text-primary font-semibold">Orientación Sexual</Label>
              <Select value={filters.sexualOrientation} onValueChange={(value) => handleFilterChange('sexualOrientation', value)}>
                <SelectTrigger id="sexualOrientation" className="input-glass mt-2">
                  <SelectValue placeholder="Seleccionar orientación" />
                </SelectTrigger>
                <SelectContent className={selectContentClass}>
                  <SelectItem value="Todas">Todas</SelectItem>
                  <SelectItem value="Heterosexual">Heterosexual</SelectItem>
                  <SelectItem value="Homosexual">Homosexual</SelectItem>
                  <SelectItem value="Bisexual">Bisexual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="relationshipStatus" className="text-primary font-semibold">Estado</Label>
              <Select value={filters.relationshipStatus} onValueChange={(value) => handleFilterChange('relationshipStatus', value)}>
                <SelectTrigger id="relationshipStatus" className="input-glass mt-2">
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent className={selectContentClass}>
                  <SelectItem value="Todos">Todos</SelectItem>
                  <SelectItem value="Soltero/a">Soltero/a</SelectItem>
                  <SelectItem value="En una relación">En una relación</SelectItem>
                  <SelectItem value="Casado/a">Casado/a</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-primary font-semibold">Rango de Edad: {filters.ageRange[0]} - {filters.ageRange[1]}</Label>
              <Slider
                min={18}
                max={99}
                step={1}
                value={filters.ageRange}
                onValueChange={(value) => handleFilterChange('ageRange', value)}
                className="mt-3"
              />
            </div>
            <div>
              <Label className="text-primary font-semibold">Distancia: hasta {filters.distance} km</Label>
              <Slider
                min={1}
                max={500}
                step={1}
                value={[filters.distance]}
                onValueChange={([value]) => handleFilterChange('distance', value)}
                className="mt-3"
                disabled={!(currentUserProfile?.latitud && currentUserProfile?.longitud)}
              />
            </div>
             <div className="space-y-4">
                <Label className="text-primary font-semibold">Intenciones de búsqueda</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {intentionsList.map(item => (
                       <div key={item.id} className="flex items-center space-x-2">
                          <Checkbox id={`intention-${item.id}`} checked={filters.intentions.includes(item.id)} onCheckedChange={() => handleIntentionChange(item.id)} />
                          <label htmlFor={`intention-${item.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{item.label}</label>
                       </div>
                    ))}
                </div>
            </div>
            <Button onClick={handleSearch} className="w-full btn-action" disabled={loading}>
              {loading ? <Loader2 className="animate-spin mr-2" /> : <Search className="mr-2" />}
              {loading ? 'Buscando...' : 'Buscar perfiles'}
            </Button>
          </div>
        </motion.div>

        <div className="flex-1">
          {loading && (
            <div className="flex justify-center items-center h-64">
              <div className="loading-spinner"></div>
            </div>
          )}
          {!loading && searched && results.length === 0 && (
            <div className="text-center py-16 card-glass rounded-lg flex flex-col items-center">
              <Frown className="w-16 h-16 text-primary mb-4" />
              <h2 className="text-xl font-semibold">No se encontraron perfiles</h2>
              <p className="text-text-secondary mt-2">Intenta ajustar tus filtros de búsqueda para obtener más resultados.</p>
            </div>
          )}
          {!loading && results.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4"
            >
              {results.map(profile => (
                <ProfileCard key={profile.id} profile={profile} />
              ))}
            </motion.div>
          )}
           {!loading && !searched && (
            <div className="text-center py-16 card-glass rounded-lg flex flex-col items-center">
              <Search className="w-16 h-16 text-primary mb-4" />
              <h2 className="text-xl font-semibold">Comienza tu búsqueda</h2>
              <p className="text-text-secondary mt-2">Utiliza los filtros para encontrar a alguien especial.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AdvancedSearchPage;