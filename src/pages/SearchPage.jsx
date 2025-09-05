import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import DiscoverPage from './DiscoverPage';
import { supabase } from '@/lib/customSupabaseClient'; // 🔥 Firebase client
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';

const SearchPage = () => {
  const { toast } = useToast();
  const { profile: currentUserProfile } = useAuth();
  const [filters, setFilters] = useState({
    gender: 'todos',
    sexual_orientation: 'todos',
    relationship_status: 'todos',
    ageRange: [18, 70],
    distance: 50,
    intentions: [],
    keyword: '',
  });
  const [showResults, setShowResults] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    setShowResults(true);

    try {
      let query = supabase.from('profiles').select('*');

      if (filters.keyword) {
        query = query.or(`alias.ilike.%${filters.keyword}%,bio.ilike.%${filters.keyword}%,interests.cs.{${filters.keyword}}`);
      }
      if (filters.gender !== 'todos') {
        query = query.eq('gender', filters.gender);
      }
      if (filters.sexual_orientation !== 'todos') {
        query = query.eq('sexual_orientation', filters.sexual_orientation);
      }
      if (filters.relationship_status !== 'todos') {
        query = query.eq('relationship_status', filters.relationship_status);
      }
      
      // Age filtering
      const today = new Date();
      const minBirthDate = new Date(today.getFullYear() - filters.ageRange[1] - 1, today.getMonth(), today.getDate());
      const maxBirthDate = new Date(today.getFullYear() - filters.ageRange[0], today.getMonth(), today.getDate());
      query = query.gte('birth_date', minBirthDate.toISOString());
      query = query.lte('birth_date', maxBirthDate.toISOString());

      // Distance filtering requires a database function for performance.
      // We will call an RPC function `get_nearby_profiles` if location is available.
      if (currentUserProfile?.latitud && currentUserProfile?.longitud) {
          const { data, error } = await supabase.rpc('get_nearby_profiles', {
              user_lat: currentUserProfile.latitud,
              user_lng: currentUserProfile.longitud,
              radius_km: filters.distance
          });

          if (error) throw error;
          
          // Apply other filters on the client-side after getting nearby profiles
          let filteredData = data;
          if (filters.keyword) {
              filteredData = filteredData.filter(p => 
                  (p.alias && p.alias.toLowerCase().includes(filters.keyword.toLowerCase())) ||
                  (p.bio && p.bio.toLowerCase().includes(filters.keyword.toLowerCase())) ||
                  (p.interests && p.interests.some(i => i.toLowerCase().includes(filters.keyword.toLowerCase())))
              );
          }
          if (filters.gender !== 'todos') {
              filteredData = filteredData.filter(p => p.gender === filters.gender);
          }
          // ... add other client-side filters if needed

          setSearchResults(filteredData);

      } else {
          const { data, error } = await query;
          if (error) throw error;
          setSearchResults(data);
          toast({
              title: "Búsqueda sin ubicación",
              description: "Activa tu ubicación para buscar perfiles cercanos.",
          });
      }

    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error en la búsqueda",
        description: "No se pudieron obtener los resultados. " + error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({...prev, [key]: value}));
  };
  
  const handleIntentionChange = (intention) => {
    setFilters(prev => {
      const newIntentions = prev.intentions.includes(intention)
        ? prev.intentions.filter(i => i !== intention)
        : [...prev.intentions, intention];
      return {...prev, intentions: newIntentions};
    });
  };

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
        <title>Buscador - AGARCH-AR</title>
        <meta name="description" content="Encuentra perfiles con filtros avanzados en AGARCH-AR." />
      </Helmet>
      <div className="space-y-6">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-glass p-6"
        >
          <h1 className="text-3xl font-bold text-primary mb-2 flex items-center gap-2">
            <Search /> Buscador Avanzado
          </h1>
          <p className="text-text-secondary mb-6">Usa los filtros para encontrar exactamente lo que buscas.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="keyword" className="text-primary">Palabra clave</Label>
              <Input id="keyword" placeholder="Ej: Viajes, rock, arte..." className="input-glass" value={filters.keyword} onChange={(e) => handleFilterChange('keyword', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender" className="text-primary">Busco</Label>
              <Select value={filters.gender} onValueChange={(v) => handleFilterChange('gender', v)}>
                <SelectTrigger id="gender" className="input-glass"><SelectValue /></SelectTrigger>
                <SelectContent className={selectContentClass}><SelectItem value="todos">Todos</SelectItem><SelectItem value="hombre">Hombres</SelectItem><SelectItem value="mujer">Mujeres</SelectItem><SelectItem value="no-binario">No binarios</SelectItem></SelectContent>
              </Select>
            </div>
             <div className="space-y-2">
              <Label htmlFor="sexual_orientation" className="text-primary">Orientación Sexual</Label>
              <Select value={filters.sexual_orientation} onValueChange={(v) => handleFilterChange('sexual_orientation', v)}>
                <SelectTrigger id="sexual_orientation" className="input-glass"><SelectValue /></SelectTrigger>
                <SelectContent className={selectContentClass}><SelectItem value="todos">Todas</SelectItem><SelectItem value="heterosexual">Heterosexual</SelectItem><SelectItem value="homosexual">Homosexual</SelectItem><SelectItem value="bisexual">Bisexual</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="relationship_status" className="text-primary">Estado</Label>
               <Select value={filters.relationship_status} onValueChange={(v) => handleFilterChange('relationship_status', v)}>
                <SelectTrigger id="relationship_status" className="input-glass"><SelectValue /></SelectTrigger>
                <SelectContent className={selectContentClass}><SelectItem value="todos">Todos</SelectItem><SelectItem value="soltero">Soltero/a</SelectItem><SelectItem value="en-una-relacion">En una relación</SelectItem><SelectItem value="casado">Casado/a</SelectItem></SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-primary">Rango de Edad: {filters.ageRange[0]} - {filters.ageRange[1]}</Label>
              <Slider defaultValue={filters.ageRange} min={18} max={99} step={1} onValueChange={(v) => handleFilterChange('ageRange', v)} />
            </div>
             <div className="space-y-2">
              <Label className="text-primary">Distancia: hasta {filters.distance} km</Label>
              <Slider defaultValue={[filters.distance]} min={1} max={500} step={1} onValueChange={([v]) => handleFilterChange('distance', v)} />
            </div>
          </div>
          
          <div className="mt-6">
             <Label className="text-primary block mb-3">Intenciones de búsqueda</Label>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {intentionsList.map(item => (
                   <div key={item.id} className="flex items-center space-x-2">
                      <Checkbox id={item.id} checked={filters.intentions.includes(item.id)} onCheckedChange={() => handleIntentionChange(item.id)} />
                      <label htmlFor={item.id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{item.label}</label>
                   </div>
                ))}
             </div>
          </div>

          <div className="mt-8 flex justify-end">
            <Button onClick={handleSearch} disabled={loading} className="btn-action flex items-center gap-2">
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Buscando...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Buscar Perfiles
                </>
              )}
            </Button>
          </div>
        </motion.div>

        {showResults && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8"
          >
            <h2 className="text-2xl font-bold text-primary mb-4">Resultados de la Búsqueda</h2>
             <DiscoverPage isSearchResult={true} searchResults={searchResults} searchLoading={loading} />
          </motion.div>
        )}
      </div>
    </>
  );
};

export default SearchPage;