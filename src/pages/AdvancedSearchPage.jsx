import React, { useState, useCallback, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient'; // 🔥 Firebase client
import { useToast } from '@/components/ui/use-toast.jsx';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Search, Loader2, Frown, RefreshCw } from 'lucide-react';
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
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const RESULTS_PER_PAGE = 20;

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

  const handleSearch = useCallback(async (isLoadMore = false) => {
    if (!user) {
        toast({ variant: 'destructive', title: 'Error', description: 'Debes iniciar sesión para buscar.' });
        return;
    }
    
    if (!isLoadMore) {
      setLoading(true);
      setSearched(true);
      setResults([]);
      setPage(0);
    }
    
    setError(null);

    try {
        const hasLocation = currentUserProfile?.latitud && currentUserProfile?.longitud;
        let data, queryError;

        // Usar función RPC si hay ubicación y filtro de distancia activo
        if (hasLocation && filters.distance < 500) {
            // Usar función de búsqueda por distancia
            const { data: rpcData, error: rpcError } = await supabase.rpc('get_nearby_profiles', {
                user_lat: currentUserProfile.latitud,
                user_lng: currentUserProfile.longitud,
                radius_km: filters.distance
            });
            
            data = rpcData;
            queryError = rpcError;
            
            // Aplicar filtros adicionales en el cliente
            if (data && !queryError) {
                let filteredData = data;
                
                if (filters.keyword.trim()) {
                    filteredData = filteredData.filter(p => 
                        (p.alias && p.alias.toLowerCase().includes(filters.keyword.toLowerCase())) ||
                        (p.bio && p.bio.toLowerCase().includes(filters.keyword.toLowerCase()))
                    );
                }
                if (filters.gender !== 'Todos') {
                    filteredData = filteredData.filter(p => p.gender === filters.gender);
                }
                if (filters.sexualOrientation !== 'Todas') {
                    filteredData = filteredData.filter(p => p.sexual_orientation === filters.sexualOrientation);
                }
                if (filters.relationshipStatus !== 'Todos') {
                    filteredData = filteredData.filter(p => p.relationship_status === filters.relationshipStatus);
                }
                
                // Aplicar paginación en el cliente
                const from = isLoadMore ? page * RESULTS_PER_PAGE : 0;
                const to = from + RESULTS_PER_PAGE;
                data = filteredData.slice(from, to);
            }
        } else {
            // Usar función RPC de búsqueda general o query tradicional
            if (!hasLocation && filters.distance < 500) {
                toast({
                    title: "Ubicación no disponible",
                    description: "Para una búsqueda por distancia más precisa, activa tu ubicación en Ajustes.",
                });
            }

            // Usar función RPC search_profiles para mejor rendimiento
            const { data: rpcData, error: rpcError } = await supabase.rpc('search_profiles', {
                search_keyword: filters.keyword.trim() || null,
                filter_gender: filters.gender !== 'Todos' ? filters.gender : null,
                filter_orientation: filters.sexualOrientation !== 'Todas' ? filters.sexualOrientation : null,
                filter_status: filters.relationshipStatus !== 'Todos' ? filters.relationshipStatus : null,
                min_age: filters.ageRange[0],
                max_age: filters.ageRange[1],
                result_limit: RESULTS_PER_PAGE,
                result_offset: isLoadMore ? page * RESULTS_PER_PAGE : 0
            });
            
            data = rpcData;
            queryError = rpcError;
        }

        if (queryError) throw queryError;
      
        let filteredData = data || [];

        // Filtros adicionales en el cliente
        if (filters.intentions.length > 0) {
            filteredData = filteredData.filter(p => 
              p.preferences && filters.intentions.some(i => p.preferences.includes(i))
            );
        }

        // Filtro de edad en el cliente (temporal)
        if (filters.ageRange[0] !== 18 || filters.ageRange[1] !== 70) {
            filteredData = filteredData.filter(p => {
                if (!p.birth_date) return true;
                const age = new Date().getFullYear() - new Date(p.birth_date).getFullYear();
                return age >= filters.ageRange[0] && age <= filters.ageRange[1];
            });
        }

        if (isLoadMore) {
          setResults(prev => [...prev, ...filteredData]);
        } else {
          setResults(filteredData);
        }
        
        setHasMore(filteredData.length === RESULTS_PER_PAGE);

    } catch (error) {
      console.error('Search error:', error);
      setError(error.message);
      toast({
        variant: "destructive",
        title: "Error en la búsqueda",
        description: "No se pudieron obtener los resultados. Intenta de nuevo.",
      });
    } finally {
      setLoading(false);
    }
  }, [user, currentUserProfile, filters, page, toast]);

  const handleLoadMore = useCallback(() => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
      handleSearch(true);
    }
  }, [loading, hasMore, handleSearch]);

  // Memoizar resultados para evitar re-renders
  const memoizedResults = useMemo(() => results, [results]);

  const selectContentClass = "bg-surface text-text-primary border-border-color";

  return (
    <>
      <Helmet>
        <title>Buscador Avanzado - AGARCH-AR</title>
        <meta name="description" content="Encuentra perfiles con filtros avanzados en AGARCH-AR." />
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
                  <SelectItem value="Pansexual">Pansexual</SelectItem>
                  <SelectItem value="Asexual">Asexual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="relationshipStatus" className="text-primary font-semibold">Estado Civil</Label>
              <Select value={filters.relationshipStatus} onValueChange={(value) => handleFilterChange('relationshipStatus', value)}>
                <SelectTrigger id="relationshipStatus" className="input-glass mt-2">
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent className={selectContentClass}>
                  <SelectItem value="Todos">Todos</SelectItem>
                  <SelectItem value="Soltero">Soltero/a</SelectItem>
                  <SelectItem value="En relación">En relación</SelectItem>
                  <SelectItem value="Casado">Casado/a</SelectItem>
                  <SelectItem value="Divorciado">Divorciado/a</SelectItem>
                  <SelectItem value="Viudo">Viudo/a</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-primary font-semibold">Rango de edad: {filters.ageRange[0]} - {filters.ageRange[1]} años</Label>
              <Slider 
                defaultValue={filters.ageRange} 
                min={18} 
                max={99} 
                step={1} 
                onValueChange={(value) => handleFilterChange('ageRange', value)}
                className="mt-2"
              />
            </div>
            <div>
              <Label className="text-primary font-semibold">Distancia: hasta {filters.distance} km</Label>
              <Slider 
                defaultValue={[filters.distance]} 
                min={1} 
                max={500} 
                step={1} 
                onValueChange={([value]) => handleFilterChange('distance', value)}
                className="mt-2"
              />
            </div>
            <div>
              <Label className="text-primary font-semibold">Intenciones</Label>
              <div className="space-y-2 mt-2">
                {[
                  { id: 'casual', label: 'De Trampa / Casual' },
                  { id: 'sexo', label: 'Solo encuentros para sexo' },
                  { id: 'chat', label: 'Solo chats' },
                  { id: 'relacion', label: 'Relación seria' }
                ].map(item => (
                  <div key={item.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={item.id} 
                      checked={filters.intentions.includes(item.id)} 
                      onCheckedChange={() => handleIntentionChange(item.id)} 
                    />
                    <label htmlFor={item.id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      {item.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            <Button onClick={() => handleSearch()} className="w-full btn-action" disabled={loading}>
              {loading ? <Loader2 className="animate-spin mr-2" /> : <Search className="mr-2" />}
              {loading ? 'Buscando...' : 'Buscar perfiles'}
            </Button>
          </div>
        </motion.div>

        <div className="flex-1">
          {loading && !searched && (
            <div className="flex justify-center items-center h-64">
              <div className="loading-spinner"></div>
            </div>
          )}
          {error && (
            <div className="text-center py-16 card-glass rounded-lg flex flex-col items-center">
              <Frown className="w-16 h-16 text-primary mb-4" />
              <h2 className="text-xl font-semibold">Error en la búsqueda</h2>
              <p className="text-text-secondary mt-2 mb-4">{error}</p>
              <Button onClick={() => handleSearch()} className="btn-action">
                <RefreshCw className="w-4 h-4 mr-2" />
                Reintentar
              </Button>
            </div>
          )}
          {!loading && searched && memoizedResults.length === 0 && !error && (
            <div className="text-center py-16 card-glass rounded-lg flex flex-col items-center">
              <Frown className="w-16 h-16 text-primary mb-4" />
              <h2 className="text-xl font-semibold">No se encontraron perfiles</h2>
              <p className="text-text-secondary mt-2">Intenta ajustar tus filtros de búsqueda para obtener más resultados.</p>
            </div>
          )}
          {!loading && memoizedResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {memoizedResults.map(profile => (
                  <ProfileCard key={profile.id} profile={profile} />
                ))}
              </div>
              {hasMore && (
                <div className="text-center py-4">
                  <Button 
                    onClick={handleLoadMore} 
                    disabled={loading}
                    variant="outline"
                    className="btn-outline-action"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Cargando...
                      </>
                    ) : (
                      'Cargar más'
                    )}
                  </Button>
                </div>
              )}
            </motion.div>
          )}
           {!loading && !searched && !error && (
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