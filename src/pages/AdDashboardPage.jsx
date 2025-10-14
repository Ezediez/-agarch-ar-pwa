import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { renewPremiumAd, getAdStats } from '@/lib/adRenewal';
import { ArrowLeft, Plus, Image, DollarSign, Calendar, TrendingUp, Loader2 } from 'lucide-react';

const AdDashboardPage = () => {
  const [stats, setStats] = useState({
    activeAds: 0,
    expiredAds: 0,
    totalSpent: 0
  });
  const [loading, setLoading] = useState(false);
  const [renewingAd, setRenewingAd] = useState(null);
  
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Cargar estadísticas reales
  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const adStats = await getAdStats('temp-advertiser'); // En producción sería el UID real
      
      // Calcular total gastado (simulado)
      const totalSpent = (adStats.premium_active * 30) + (adStats.standard_active * 10);
      
      setStats({
        activeAds: adStats.total_active,
        expiredAds: adStats.total_expired,
        totalSpent: totalSpent
      });
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudieron cargar las estadísticas'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRenewAd = async (adId, adPrice) => {
    try {
      setRenewingAd(adId);
      
      // Simular proceso de pago
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Renovar publicidad
      await renewPremiumAd(adId, 'temp-advertiser');
      
      toast({
        title: "¡Renovación Exitosa!",
        description: `Publicidad renovada por 30 días más. Costo: $${adPrice} USD`,
        className: "bg-green-600 text-white"
      });
      
      // Recargar estadísticas
      await loadStats();
      
    } catch (error) {
      console.error('Error renovando publicidad:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo renovar la publicidad'
      });
    } finally {
      setRenewingAd(null);
    }
  };

  const ads = [
    {
      id: 1,
      title: 'Restaurante "El Buen Sabor"',
      status: 'active',
      expiresIn: 15,
      type: 'premium',
      price: 30
    },
    {
      id: 2,
      title: 'Tienda de Ropa "Fashion Style"',
      status: 'expired',
      expiredDays: 3,
      type: 'standard',
      price: 10
    },
    {
      id: 3,
      title: 'Servicios de Limpieza "Clean Pro"',
      status: 'active',
      expiresIn: 8,
      type: 'premium',
      price: 30
    }
  ];

  return (
    <>
      <Helmet>
        <title>Dashboard Publicitario - AGARCH-AR</title>
        <meta name="description" content="Gestiona tus anuncios y campañas publicitarias en AGARCH-AR." />
      </Helmet>
      
      <div className="min-h-screen bg-background p-4">
        <div className="container mx-auto py-8">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold text-primary">Mi Panel Publicitario</h1>
                <p className="text-text-secondary">Gestiona tus anuncios y campañas</p>
              </div>
              <div className="flex gap-3">
                <Button asChild variant="outline">
                  <Link to="/ad-login">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Volver
                  </Link>
                </Button>
                <Button asChild className="bg-green-600 hover:bg-green-700">
                  <Link to="/ad-create">
                    <Plus className="mr-2 h-4 w-4" /> Crear Anuncio
                  </Link>
                </Button>
              </div>
            </div>

            {/* Métricas Principales */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Anuncios Activos */}
              <div className="card-glass p-6 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Anuncios Activos</h3>
                    <p className="text-3xl font-bold text-green-500">{stats.activeAds}</p>
                    <p className="text-text-secondary text-sm">Publicaciones vigentes</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>
              
              {/* Anuncios Vencidos */}
              <div className="card-glass p-6 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Anuncios Vencidos</h3>
                    <p className="text-3xl font-bold text-yellow-500">{stats.expiredAds}</p>
                    <p className="text-text-secondary text-sm">Requieren renovación</p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
              </div>
              
              {/* Total Gastado */}
              <div className="card-glass p-6 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Total Gastado</h3>
                    <p className="text-3xl font-bold text-primary">${stats.totalSpent}</p>
                    <p className="text-text-secondary text-sm">USD este mes</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Lista de Anuncios */}
            <div className="card-glass p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-6">Mis Anuncios</h2>
              <div className="space-y-4">
                {ads.map((ad) => (
                  <div 
                    key={ad.id}
                    className={`flex items-center justify-between p-4 border rounded-lg ${
                      ad.status === 'active' 
                        ? 'border-green-200 bg-green-50' 
                        : 'border-yellow-200 bg-yellow-50'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        ad.status === 'active' ? 'bg-green-100' : 'bg-yellow-100'
                      }`}>
                        <Image className={`w-6 h-6 ${
                          ad.status === 'active' ? 'text-green-600' : 'text-yellow-600'
                        }`} />
                      </div>
                      <div>
                        <h3 className="font-semibold">{ad.title}</h3>
                        <p className="text-sm text-text-secondary">
                          {ad.status === 'active' 
                            ? `Activo • Expira en ${ad.expiresIn} días` 
                            : `Vencido • Hace ${ad.expiredDays} días`
                          }
                        </p>
                        <p className="text-xs text-text-secondary">
                          {ad.type === 'premium' ? 'Plan Premium' : 'Plan Estándar'} • ${ad.price} USD
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        ad.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {ad.status === 'active' ? 'Activo' : 'Vencido'}
                      </span>
                      {ad.status === 'active' ? (
                        <Button size="sm" variant="outline">Editar</Button>
                      ) : (
                        <Button 
                          size="sm" 
                          className="bg-blue-600 hover:bg-blue-700"
                          onClick={() => handleRenewAd(ad.id, ad.price)}
                          disabled={renewingAd === ad.id}
                        >
                          {renewingAd === ad.id ? (
                            <>
                              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                              Renovando...
                            </>
                          ) : (
                            <>
                              <DollarSign className="mr-1 h-3 w-3" /> 
                              Renovar ${ad.price}
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
};

export default AdDashboardPage;
