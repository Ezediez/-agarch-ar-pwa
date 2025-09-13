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
import { db, auth, storage } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
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
      const profilesRef = collection(db, 'profiles');
      let searchQuery = query(profilesRef, limit(50));

      // Aplicar filtros básicos
      if (filters.gender !== 'todos') {
        searchQuery = query(searchQuery, where('gender', '==', filters.gender));
      }
      if (filters.sexual_orientation !== 'todos') {
        searchQuery = query(searchQuery, where('sexual_orientation', '==', filters.sexual_orientation));
      }
      if (filters.relationship_status !== 'todos') {
        searchQuery = query(searchQuery, where('relationship_status', '==', filters.relationship_status));
      }

      const snapshot = await getDocs(searchQuery);
      let results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Filtrar por keyword en el cliente (Firebase no soporta búsqueda de texto completo)
      if (filters.keyword) {
        const keyword = filters.keyword.toLowerCase();
        results = results.filter(profile => 
          profile.alias?.toLowerCase().includes(keyword) ||
          profile.bio?.toLowerCase().includes(keyword) ||
          profile.interests?.some(interest => interest.toLowerCase().includes(keyword))
        );
      }
      
      // Age filtering (client-side)
      if (filters.ageRange[0] !== 18 || filters.ageRange[1] !== 70) {
        const today = new Date();
        const minBirthDate = new Date(today.getFullYear() - filters.ageRange[1] - 1, today.getMonth(), today.getDate());
        const maxBirthDate = new Date(today.getFullYear() - filters.ageRange[0], today.getMonth(), today.getDate());
        
        results = results.filter(profile => {
          if (!profile.birth_date) return false;
          const birthDate = new Date(profile.birth_date);
          return birthDate >= minBirthDate && birthDate <= maxBirthDate;
        });
      }

      // Distance filtering (client-side - simplified)
      if (currentUserProfile?.latitud && currentUserProfile?.longitud) {
        results = results.filter(profile => {
          if (!profile.latitud || !profile.longitud) return false;
          
          // Simple distance calculation (not exact but functional)
          const distance = Math.sqrt(
            Math.pow(profile.latitud - currentUserProfile.latitud, 2) + 
            Math.pow(profile.longitud - currentUserProfile.longitud, 2)
          ) * 111; // Rough conversion to km
          
          return distance <= filters.distance;
        });
      }

      setSearchResults(results);

    } catch (error) {
      console.error('Search error:', error);
      toast({
        variant: "destructive",
        title: "Error en la búsqueda",
        description: "No se pudieron obtener los resultados. Intenta de nuevo.",
      });
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const toggleIntention = (intention) => {
    setFilters(prev => ({
      ...prev,
      intentions: prev.intentions.includes(intention)
        ? prev.intentions.filter(i => i !== intention)
        : [...prev.intentions, intention]
    }));
  };

  if (showResults) {
    return (
      <>
        <Helmet>
          <title>Resultados de Búsqueda - AGARCH-AR</title>
        </Helmet>
        <div className="min-h-screen bg-background">
          <div className="max-w-md mx-auto bg-background">
            <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
              <div className="flex items-center justify-between p-4">
                <h1 className="text-xl font-bold">Resultados de Búsqueda</h1>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowResults(false)}
                >
                  Volver
                </Button>
              </div>
            </div>

            <div className="p-4 space-y-4">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-sm text-muted-foreground">Buscando...</p>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="text-center py-8">
                  <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No se encontraron resultados</h3>
                  <p className="text-muted-foreground">Intenta ajustar tus filtros de búsqueda.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {searchResults.map((profile) => (
                    <motion.div
                      key={profile.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-card rounded-lg p-4 border"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-lg font-semibold">
                            {profile.alias?.[0] || '?'}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">{profile.alias || 'Usuario'}</h3>
                          <p className="text-sm text-muted-foreground">
                            {profile.age ? `${profile.age} años` : 'Edad no especificada'}
                          </p>
                          {profile.bio && (
                            <p className="text-sm mt-1 line-clamp-2">{profile.bio}</p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Buscar - AGARCH-AR</title>
      </Helmet>
      <div className="min-h-screen bg-background">
        <div className="max-w-md mx-auto bg-background">
          <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
            <div className="flex items-center justify-between p-4">
              <h1 className="text-xl font-bold">Buscar</h1>
            </div>
          </div>

          <div className="p-4 space-y-6">
            {/* Keyword Search */}
            <div className="space-y-2">
              <Label htmlFor="keyword">Palabra clave</Label>
              <Input
                id="keyword"
                placeholder="Buscar por nombre, bio, intereses..."
                value={filters.keyword}
                onChange={(e) => updateFilter('keyword', e.target.value)}
              />
            </div>

            {/* Gender Filter */}
            <div className="space-y-2">
              <Label>Género</Label>
              <Select value={filters.gender} onValueChange={(value) => updateFilter('gender', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="masculino">Masculino</SelectItem>
                  <SelectItem value="femenino">Femenino</SelectItem>
                  <SelectItem value="otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sexual Orientation Filter */}
            <div className="space-y-2">
              <Label>Orientación sexual</Label>
              <Select value={filters.sexual_orientation} onValueChange={(value) => updateFilter('sexual_orientation', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="heterosexual">Heterosexual</SelectItem>
                  <SelectItem value="homosexual">Homosexual</SelectItem>
                  <SelectItem value="bisexual">Bisexual</SelectItem>
                  <SelectItem value="otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Age Range */}
            <div className="space-y-2">
              <Label>Rango de edad: {filters.ageRange[0]} - {filters.ageRange[1]} años</Label>
              <Slider
                value={filters.ageRange}
                onValueChange={(value) => updateFilter('ageRange', value)}
                min={18}
                max={70}
                step={1}
                className="w-full"
              />
            </div>

            {/* Distance */}
            <div className="space-y-2">
              <Label>Distancia: {filters.distance} km</Label>
              <Slider
                value={[filters.distance]}
                onValueChange={(value) => updateFilter('distance', value[0])}
                min={1}
                max={100}
                step={1}
                className="w-full"
              />
            </div>

            {/* Search Button */}
            <Button
              onClick={handleSearch}
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Buscando...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Buscar
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default SearchPage;