import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, LogIn, Plus, Upload, CreditCard, DollarSign, Calendar, Image, FileText, Building, User, Phone, Mail, Globe } from 'lucide-react';

const AdvertisingPortal = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showCreateAd, setShowCreateAd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });
  const [adData, setAdData] = useState({
    title: '',
    description: '',
    category: '',
    company_info: '',
    contact_phone: '',
    contact_email: '',
    contact_website: '',
    contact_whatsapp: '',
    cover_image: null,
    ad_type: 'standard', // 'standard' or 'premium'
    duration: 'once' // 'once' or '30days'
  });
  
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Aquí implementarías la autenticación específica para anunciantes
      // Por ahora, simulamos el login
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setIsLoggedIn(true);
      toast({
        title: 'Bienvenido',
        description: 'Has iniciado sesión en el Portal de Anunciantes.'
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Credenciales incorrectas.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAd = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Aquí implementarías la creación del anuncio en Firestore
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: 'Anuncio creado',
        description: 'Tu anuncio se ha publicado exitosamente.'
      });
      
      setAdData({
        title: '',
        description: '',
        category: '',
        company_info: '',
        contact_phone: '',
        contact_email: '',
        contact_website: '',
        contact_whatsapp: '',
        cover_image: null,
        ad_type: 'standard',
        duration: 'once'
      });
      setShowCreateAd(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo crear el anuncio.'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <>
        <Helmet>
          <title>Portal de Anunciantes - AGARCH-AR</title>
        </Helmet>
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-2xl">→</span>
                </div>
              </div>
              <h1 className="text-3xl font-bold text-primary mb-2">Portal de Anunciantes</h1>
              <p className="text-muted-foreground">Inicia sesión para gestionar tus anuncios</p>
            </div>

            {/* Login Form */}
            <div className="card-glass p-6 rounded-lg">
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={loginData.email}
                    onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                    placeholder="tu-email@empresa.com"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    value={loginData.password}
                    onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                    placeholder="Tu contraseña"
                    required
                  />
                </div>
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? 'Iniciando sesión...' : 'Iniciar Sesión →'}
                </Button>
              </form>
            </div>

            {/* Navigation */}
            <div className="mt-6 text-center">
              <Button
                variant="outline"
                onClick={() => navigate('/')}
                className="w-full"
              >
                ← Volver al Inicio
              </Button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Dashboard - Portal de Anunciantes</title>
      </Helmet>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-primary text-white p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">Portal de Anunciantes</h1>
            <Button
              variant="ghost"
              onClick={() => setIsLoggedIn(false)}
              className="text-white hover:bg-white/20"
            >
              Cerrar Sesión
            </Button>
          </div>
        </div>

        <div className="p-4">
          {/* Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="card-glass p-4 rounded-lg">
              <div className="flex items-center gap-3">
                <DollarSign className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Anuncios Activos</p>
                  <p className="text-2xl font-bold">3</p>
                </div>
              </div>
            </div>
            <div className="card-glass p-4 rounded-lg">
              <div className="flex items-center gap-3">
                <CreditCard className="w-8 h-8 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Presupuesto</p>
                  <p className="text-2xl font-bold">$500</p>
                </div>
              </div>
            </div>
            <div className="card-glass p-4 rounded-lg">
              <div className="flex items-center gap-3">
                <Calendar className="w-8 h-8 text-orange-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Vistas Hoy</p>
                  <p className="text-2xl font-bold">1,247</p>
                </div>
              </div>
            </div>
          </div>

          {/* Create Ad Button */}
          <div className="mb-6">
            <Button
              onClick={() => setShowCreateAd(true)}
              className="w-full md:w-auto"
            >
              <Plus className="w-4 h-4 mr-2" />
              Crear Nuevo Anuncio
            </Button>
          </div>

          {/* Create Ad Modal */}
          {showCreateAd && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-card rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold">Crear Anuncio</h2>
                    <Button
                      variant="ghost"
                      onClick={() => setShowCreateAd(false)}
                    >
                      ✕
                    </Button>
                  </div>

                  <form onSubmit={handleCreateAd} className="space-y-4">
                    {/* Información básica */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="title">Título del Anuncio</Label>
                        <Input
                          id="title"
                          value={adData.title}
                          onChange={(e) => setAdData({...adData, title: e.target.value})}
                          placeholder="Restaurante El Buen Sabor"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="category">Categoría</Label>
                        <Select value={adData.category} onValueChange={(value) => setAdData({...adData, category: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona una categoría" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="restaurant">Restaurante</SelectItem>
                            <SelectItem value="fashion">Moda</SelectItem>
                            <SelectItem value="beauty">Belleza</SelectItem>
                            <SelectItem value="fitness">Fitness</SelectItem>
                            <SelectItem value="education">Educación</SelectItem>
                            <SelectItem value="technology">Tecnología</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="description">Descripción</Label>
                      <Textarea
                        id="description"
                        value={adData.description}
                        onChange={(e) => setAdData({...adData, description: e.target.value})}
                        placeholder="Describe tu negocio o servicio..."
                        className="min-h-[100px]"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="company_info">Información de la Empresa</Label>
                      <Textarea
                        id="company_info"
                        value={adData.company_info}
                        onChange={(e) => setAdData({...adData, company_info: e.target.value})}
                        placeholder="Más de 20 años sirviendo a la comunidad..."
                        className="min-h-[80px]"
                      />
                    </div>

                    {/* Información de contacto */}
                    <div className="border-t pt-4">
                      <h3 className="text-lg font-semibold mb-4">Información de Contacto</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="contact_phone">Teléfono</Label>
                          <Input
                            id="contact_phone"
                            value={adData.contact_phone}
                            onChange={(e) => setAdData({...adData, contact_phone: e.target.value})}
                            placeholder="+54 11 1234-5678"
                          />
                        </div>
                        <div>
                          <Label htmlFor="contact_email">Email</Label>
                          <Input
                            id="contact_email"
                            type="email"
                            value={adData.contact_email}
                            onChange={(e) => setAdData({...adData, contact_email: e.target.value})}
                            placeholder="contacto@empresa.com"
                          />
                        </div>
                        <div>
                          <Label htmlFor="contact_website">Sitio Web</Label>
                          <Input
                            id="contact_website"
                            value={adData.contact_website}
                            onChange={(e) => setAdData({...adData, contact_website: e.target.value})}
                            placeholder="https://www.empresa.com"
                          />
                        </div>
                        <div>
                          <Label htmlFor="contact_whatsapp">WhatsApp</Label>
                          <Input
                            id="contact_whatsapp"
                            value={adData.contact_whatsapp}
                            onChange={(e) => setAdData({...adData, contact_whatsapp: e.target.value})}
                            placeholder="+54 9 11 1234-5678"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Configuración del anuncio */}
                    <div className="border-t pt-4">
                      <h3 className="text-lg font-semibold mb-4">Configuración</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="ad_type">Tipo de Anuncio</Label>
                          <Select value={adData.ad_type} onValueChange={(value) => setAdData({...adData, ad_type: value})}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="standard">Estándar</SelectItem>
                              <SelectItem value="premium">Premium</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="duration">Duración</Label>
                          <Select value={adData.duration} onValueChange={(value) => setAdData({...adData, duration: value})}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="once">Una vez</SelectItem>
                              <SelectItem value="30days">30 días</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    {/* Botones */}
                    <div className="flex gap-4 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowCreateAd(false)}
                        className="flex-1"
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        disabled={loading}
                        className="flex-1"
                      >
                        {loading ? 'Creando...' : 'Crear Anuncio'}
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Existing Ads */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Mis Anuncios</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Aquí se mostrarían los anuncios existentes */}
              <div className="card-glass p-4 rounded-lg">
                <h3 className="font-semibold">Restaurante El Buen Sabor</h3>
                <p className="text-sm text-muted-foreground">Activo • 247 vistas</p>
              </div>
              <div className="card-glass p-4 rounded-lg">
                <h3 className="font-semibold">Tienda Fashion Style</h3>
                <p className="text-sm text-muted-foreground">Activo • 189 vistas</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdvertisingPortal;
