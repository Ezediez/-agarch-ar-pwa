import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { db, auth, storage } from '@/lib/firebase';
import { ArrowLeft, LogIn, Plus, Upload, CreditCard, DollarSign, Calendar, Image, FileText } from 'lucide-react';

const AdLoginPage = () => {
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
    cover_image: null,
    ad_type: 'standard', // 'standard' or 'premium'
    duration: 'once' // 'once' or '30days'
  });
  
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Simular login
    setTimeout(() => {
      toast({
        title: "Login Exitoso",
        description: "Bienvenido al portal de anunciantes",
        className: "bg-primary text-white"
      });
      setIsLoggedIn(true);
      setLoading(false);
    }, 1000);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAdData(prev => ({ ...prev, cover_image: file }));
      toast({
        title: "Imagen Cargada",
        description: `Archivo: ${file.name}`,
      });
    }
  };

  const calculatePrice = () => {
    if (adData.duration === 'once') return 10;
    if (adData.duration === '30days') return 30;
    return 0;
  };

  const handlePayment = async () => {
    const price = calculatePrice();
    toast({
      title: "Procesando Pago",
      description: `Redirigiendo a PSP para pagar $${price} USD...`,
    });

    // Simular proceso de pago
    setTimeout(() => {
      toast({
        title: "¡Pago Exitoso!",
        description: `Anuncio publicado correctamente. Costo: $${price} USD`,
        className: "bg-green-600 text-white"
      });
      
      // Resetear formulario
      setAdData({
        title: '',
        description: '',
        category: '',
        company_info: '',
        contact_phone: '',
        contact_email: '',
        contact_website: '',
        cover_image: null,
        ad_type: 'standard',
        duration: 'once'
      });
      setShowCreateAd(false);
    }, 2000);
  };

  const renderLoginForm = () => (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <LogIn className="w-12 h-12 text-primary mx-auto mb-3" />
        <h1 className="text-4xl font-bold mb-4 text-primary">Portal de Anunciantes</h1>
        <p className="text-text-secondary">Inicia sesión para gestionar tus anuncios</p>
      </div>

      <form onSubmit={handleLogin} className="card-glass p-8 rounded-lg space-y-6">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={loginData.email}
            onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
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
            onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
            placeholder="Tu contraseña"
            required
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'} <LogIn className="ml-2 h-4 w-4" />
        </Button>
      </form>

      <div className="text-center mt-6">
        <p className="text-text-secondary mb-4">¿No tienes cuenta?</p>
        <Button asChild variant="outline">
          <Link to="/ad-register">Crear Cuenta Publicitaria</Link>
        </Button>
      </div>
    </div>
  );

  const renderDashboard = () => (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-primary">Dashboard Publicitario</h1>
          <p className="text-text-secondary">Gestiona tus anuncios y campañas</p>
        </div>
        <Button onClick={() => setShowCreateAd(true)} className="bg-green-600 hover:bg-green-700">
          <Plus className="mr-2 h-4 w-4" /> Crear Anuncio
        </Button>
      </div>

      {/* Anuncios Activos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="card-glass p-6 rounded-lg">
          <h3 className="font-semibold text-lg mb-2">Anuncios Activos</h3>
          <p className="text-3xl font-bold text-green-500">3</p>
          <p className="text-text-secondary text-sm">Publicaciones vigentes</p>
        </div>
        
        <div className="card-glass p-6 rounded-lg">
          <h3 className="font-semibold text-lg mb-2">Anuncios Vencidos</h3>
          <p className="text-3xl font-bold text-yellow-500">1</p>
          <p className="text-text-secondary text-sm">Requieren renovación</p>
        </div>
        
        <div className="card-glass p-6 rounded-lg">
          <h3 className="font-semibold text-lg mb-2">Total Gastado</h3>
          <p className="text-3xl font-bold text-primary">$70</p>
          <p className="text-text-secondary text-sm">USD este mes</p>
        </div>
      </div>

      {/* Lista de Anuncios */}
      <div className="card-glass p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Mis Anuncios</h2>
        <div className="space-y-4">
          {/* Anuncio Activo */}
          <div className="flex items-center justify-between p-4 border border-green-200 rounded-lg bg-green-50">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Image className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold">Restaurante "El Buen Sabor"</h3>
                <p className="text-sm text-text-secondary">Activo • Expira en 15 días</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">Activo</span>
              <Button size="sm" variant="outline">Editar</Button>
            </div>
          </div>

          {/* Anuncio Vencido */}
          <div className="flex items-center justify-between p-4 border border-yellow-200 rounded-lg bg-yellow-50">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Image className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <h3 className="font-semibold">Tienda de Ropa "Fashion Style"</h3>
                <p className="text-sm text-text-secondary">Vencido • Hace 3 días</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">Vencido</span>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                <DollarSign className="mr-1 h-3 w-3" /> Renovar $30
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCreateAdForm = () => (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-primary">Crear Nuevo Anuncio</h2>
        <Button onClick={() => setShowCreateAd(false)} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver
        </Button>
      </div>

      <div className="card-glass p-8 rounded-lg space-y-6">
        <div>
          <Label htmlFor="title">Título del Anuncio</Label>
          <Input
            id="title"
            value={adData.title}
            onChange={(e) => setAdData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Ej: Restaurante El Buen Sabor - Comida Casera"
            required
          />
        </div>

        <div>
          <Label htmlFor="category">Categoría</Label>
          <Select value={adData.category} onValueChange={(value) => setAdData(prev => ({ ...prev, category: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="restaurante">Restaurante</SelectItem>
              <SelectItem value="tienda">Tienda/Comercio</SelectItem>
              <SelectItem value="servicios">Servicios</SelectItem>
              <SelectItem value="inmobiliaria">Inmobiliaria</SelectItem>
              <SelectItem value="automotor">Automotor</SelectItem>
              <SelectItem value="salud">Salud y Belleza</SelectItem>
              <SelectItem value="educacion">Educación</SelectItem>
              <SelectItem value="otros">Otros</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="cover_image">Foto de Portada</Label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              id="cover_image"
            />
            <label htmlFor="cover_image" className="cursor-pointer">
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-text-secondary">
                {adData.cover_image ? adData.cover_image.name : 'Subir imagen (máximo 1 foto)'}
              </p>
            </label>
          </div>
        </div>

        <div>
          <Label htmlFor="description">Descripción del Producto/Servicio</Label>
          <Textarea
            id="description"
            value={adData.description}
            onChange={(e) => setAdData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Describe tu producto o servicio de manera atractiva..."
            rows={4}
            required
          />
        </div>

        <div>
          <Label htmlFor="company_info">Información General de la Empresa</Label>
          <Textarea
            id="company_info"
            value={adData.company_info}
            onChange={(e) => setAdData(prev => ({ ...prev, company_info: e.target.value }))}
            placeholder="Información sobre tu empresa, historia, valores, etc."
            rows={3}
          />
        </div>

        {/* Datos de Contacto */}
        <div className="border-t pt-6">
          <h3 className="font-semibold text-lg mb-4">Datos de Contacto</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="contact_phone">Teléfono</Label>
              <Input
                id="contact_phone"
                value={adData.contact_phone}
                onChange={(e) => setAdData(prev => ({ ...prev, contact_phone: e.target.value }))}
                placeholder="+54 11 1234-5678"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="contact_email">Email</Label>
              <Input
                id="contact_email"
                type="email"
                value={adData.contact_email}
                onChange={(e) => setAdData(prev => ({ ...prev, contact_email: e.target.value }))}
                placeholder="contacto@empresa.com"
                required
              />
            </div>
          </div>
          
          <div className="mt-4">
            <Label htmlFor="contact_website">Sitio Web (opcional)</Label>
            <Input
              id="contact_website"
              value={adData.contact_website}
              onChange={(e) => setAdData(prev => ({ ...prev, contact_website: e.target.value }))}
              placeholder="https://miempresa.com"
            />
          </div>
        </div>

        {/* Tipo de Publicación */}
        <div className="border-t pt-6">
          <h3 className="font-semibold text-lg mb-4">Tipo de Publicación</h3>
          <div className="space-y-4">
            <div 
              className={`p-4 border rounded-lg cursor-pointer ${adData.duration === 'once' ? 'border-primary bg-primary/10' : 'border-gray-300'}`}
              onClick={() => setAdData(prev => ({ ...prev, duration: 'once' }))}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">Publicación Estándar - $10 USD</h4>
                  <p className="text-sm text-text-secondary">Se publica una vez y va quedando hacia abajo en el feed</p>
                </div>
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>

            <div 
              className={`p-4 border rounded-lg cursor-pointer ${adData.duration === '30days' ? 'border-primary bg-primary/10' : 'border-gray-300'}`}
              onClick={() => setAdData(prev => ({ ...prev, duration: '30days' }))}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">Publicación Premium - $30 USD</h4>
                  <p className="text-sm text-text-secondary">Se vuelve a mostrar cada 8 publicaciones por 30 días</p>
                </div>
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        <Button 
          onClick={handlePayment} 
          className="w-full bg-green-600 hover:bg-green-700"
          disabled={!adData.title || !adData.description || !adData.contact_phone || !adData.contact_email}
        >
          <CreditCard className="mr-2 h-4 w-4" />
          Pagar ${calculatePrice()} USD y Publicar
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <Helmet>
        <title>Portal de Anunciantes - AGARCH-AR</title>
        <meta name="description" content="Gestiona tus anuncios y campañas publicitarias en AGARCH-AR." />
      </Helmet>
      <div className="min-h-screen bg-background p-4">
        <div className="container mx-auto py-8">
          {!isLoggedIn ? renderLoginForm() : 
           showCreateAd ? renderCreateAdForm() : 
           renderDashboard()}
          
          {/* Back to Landing */}
          <div className="text-center mt-8">
            <Button asChild variant="outline" className="group">
              <Link to="/landing">
                <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                Volver al Inicio
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdLoginPage;
