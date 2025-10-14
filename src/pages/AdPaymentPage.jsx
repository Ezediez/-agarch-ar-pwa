import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ArrowLeft, CreditCard, DollarSign, Calendar, Loader2, Check } from 'lucide-react';

const AdPaymentPage = () => {
  const [adData, setAdData] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState('standard');
  const [loading, setLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Cargar datos del anuncio desde localStorage
    const savedAdData = localStorage.getItem('adData');
    if (savedAdData) {
      setAdData(JSON.parse(savedAdData));
    } else {
      // Si no hay datos, redirigir a crear anuncio
      navigate('/ad-create');
    }
  }, [navigate]);

  const plans = {
    standard: {
      name: 'Publicación Estándar',
      price: 10,
      description: 'Se publica una vez y va quedando hacia abajo en el feed',
      icon: DollarSign,
      color: 'green'
    },
    premium: {
      name: 'Publicación Premium',
      price: 30,
      description: 'Se vuelve a mostrar cada 8 publicaciones por 30 días',
      icon: Calendar,
      color: 'blue'
    }
  };

  const handlePayment = async () => {
    setLoading(true);
    
    try {
      // Simular proceso de pago
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Preparar datos para guardar en Firebase
      const adDataToSave = {
        ...adData,
        ad_type: selectedPlan,
        price: plans[selectedPlan].price,
        status: 'active',
        advertiser_id: 'temp-advertiser', // Temporal - en producción sería el UID del anunciante
        created_at: serverTimestamp(),
        expires_at: selectedPlan === 'standard' 
          ? new Date(Date.now() + 24 * 60 * 60 * 1000) // Estándar: 24 horas (se pierde abajo)
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Premium: 30 días (luego EXPIRA hasta renovar)
        payment_status: 'completed',
        views: 0,
        clicks: 0,
        position: selectedPlan === 'standard' ? 'bottom' : 'intercalated' // Posición en el feed
      };
      
      // Guardar publicidad en Firebase
      const docRef = await addDoc(collection(db, 'advertisements'), adDataToSave);
      
      toast({
        title: "¡Pago Exitoso!",
        description: `Anuncio publicado correctamente. Costo: $${plans[selectedPlan].price} USD`,
        className: "bg-green-600 text-white"
      });
      
      setPaymentSuccess(true);
      
      // Limpiar localStorage
      localStorage.removeItem('adData');
      
      // Redirigir al feed principal donde se muestra la publicidad
      setTimeout(() => {
        navigate('/discover');
      }, 2000);
      
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo procesar el pago. Intenta de nuevo.'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!adData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Cargando datos del anuncio...</p>
        </div>
      </div>
    );
  }

  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-green-600 mb-2">¡Pago Exitoso!</h2>
          <p className="text-text-secondary mb-4">Tu anuncio ha sido publicado correctamente</p>
          <p className="text-sm text-text-secondary">Redirigiendo al dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Elegir Plan de Pago - AGARCH-AR</title>
        <meta name="description" content="Selecciona tu plan de publicidad en AGARCH-AR." />
      </Helmet>
      
      <div className="min-h-screen bg-background p-4">
        <div className="container mx-auto py-8">
          <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold text-primary">Tipo de Publicación</h1>
              <Button asChild variant="outline">
                <Link to="/ad-create">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Volver
                </Link>
              </Button>
            </div>

            {/* Resumen del Anuncio */}
            <div className="card-glass p-6 rounded-lg mb-6">
              <h3 className="font-semibold text-lg mb-3">Resumen de tu Anuncio</h3>
              <div className="space-y-2">
                <p><span className="font-medium">Título:</span> {adData.title}</p>
                <p><span className="font-medium">Categoría:</span> {adData.category}</p>
                <p><span className="font-medium">Email:</span> {adData.contact_email}</p>
              </div>
            </div>

            {/* Planes de Pago */}
            <div className="space-y-4 mb-6">
              {Object.entries(plans).map(([key, plan]) => {
                const IconComponent = plan.icon;
                const isSelected = selectedPlan === key;
                
                return (
                  <div 
                    key={key}
                    className={`border-2 rounded-lg p-6 cursor-pointer transition-all ${
                      isSelected 
                        ? `border-${plan.color}-500 bg-${plan.color}-50` 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedPlan(key)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <input
                          type="radio"
                          checked={isSelected}
                          onChange={() => setSelectedPlan(key)}
                          className={`w-5 h-5 text-${plan.color}-500`}
                        />
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 bg-${plan.color}-100 rounded-lg flex items-center justify-center`}>
                            <IconComponent className={`w-5 h-5 text-${plan.color}-600`} />
                          </div>
                          <div>
                            <h4 className="font-semibold text-lg">{plan.name}</h4>
                            <p className="text-sm text-text-secondary">{plan.description}</p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold text-primary">${plan.price}</p>
                        <p className="text-sm text-text-secondary">USD</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Botón de Pago */}
            <div className="card-glass p-6 rounded-lg">
              <div className="text-center">
                <Button
                  onClick={handlePayment}
                  disabled={loading}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Procesando Pago...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5 mr-2" />
                      Pagar ${plans[selectedPlan].price} USD
                    </>
                  )}
                </Button>
                <p className="text-xs text-text-secondary text-center mt-3">
                  * Pago simulado por ahora - Se publica inmediatamente
                </p>
              </div>
            </div>

            {/* Botón Volver al Inicio */}
            <div className="text-center mt-6">
              <Button asChild variant="outline">
                <Link to="/ad-login">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Volver al Inicio
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdPaymentPage;
