import React, { useState, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, LogIn, Plus, Upload, CreditCard, DollarSign, Calendar, Image, FileText, Building, User, Phone, Mail, Globe, X, Loader2 } from 'lucide-react';
import { db, storage } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

const AdvertisingPortal = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showCreateAd, setShowCreateAd] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
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
    cover_image_preview: null,
    ad_plan: 'standard', // 'standard' ($10), 'premium' ($30)
  });
  
  const fileInputRef = useRef(null);
  
  const { toast } = useToast();
  const navigate = useNavigate();

  // Función para manejar la selección de imagen
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'La imagen debe ser menor a 5MB'
        });
        return;
      }

      setAdData(prev => ({
        ...prev,
        cover_image: file
      }));

      // Crear preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setAdData(prev => ({
          ...prev,
          cover_image_preview: e.target.result
        }));
      };
      reader.readAsDataURL(file);

      toast({
        title: 'Imagen seleccionada',
        description: 'Vista previa disponible'
      });
    }
  };

  // Función para eliminar imagen
  const handleRemoveImage = () => {
    setAdData(prev => ({
      ...prev,
      cover_image: null,
      cover_image_preview: null
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Función para obtener el precio del plan
  const getPlanPrice = (plan) => {
    switch (plan) {
      case 'standard': return 10;
      case 'premium': return 30;
      default: return 10; // Plan estándar por defecto
    }
  };

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
      // Validaciones
      if (!adData.title.trim()) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'El título es requerido'
        });
        return;
      }

      if (!adData.description.trim()) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'La descripción es requerida'
        });
        return;
      }

      if (!adData.contact_email.trim()) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'El email de contacto es requerido'
        });
        return;
      }

      // Subir imagen a Firebase Storage si existe
      let imageUrl = null;
      if (adData.cover_image) {
        try {
          const fileName = `advertisements/${Date.now()}_${adData.cover_image.name}`;
          const storageRef = ref(storage, fileName);
          
          const uploadTask = uploadBytesResumable(storageRef, adData.cover_image);
          
          imageUrl = await new Promise((resolve, reject) => {
            uploadTask.on('state_changed',
              (snapshot) => {
                // Progreso de subida
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                console.log('Subiendo imagen:', progress + '%');
              },
              (error) => {
                console.error('Error subiendo imagen:', error);
                reject(error);
              },
              async () => {
                try {
                  const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                  resolve(downloadURL);
                } catch (error) {
                  reject(error);
                }
              }
            );
          });
          
          console.log('✅ Imagen subida exitosamente:', imageUrl);
        } catch (error) {
          console.error('❌ Error subiendo imagen:', error);
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'No se pudo subir la imagen. Intenta de nuevo.'
          });
          return;
        }
      }

      // Crear el anuncio en Firestore
      const adDataToSave = {
        title: adData.title.trim(),
        description: adData.description.trim(),
        category: adData.category,
        company_info: adData.company_info.trim(),
        contact_phone: adData.contact_phone,
        contact_email: adData.contact_email.trim(),
        contact_website: adData.contact_website.trim(),
        contact_whatsapp: adData.contact_whatsapp,
        cover_image_url: imageUrl,
        ad_plan: adData.ad_plan,
        price: getPlanPrice(adData.ad_plan),
        status: 'active', // Cambiado a 'active' para que aparezca inmediatamente
        created_at: new Date().toISOString(),
        advertiser_id: 'demo_user', // En producción sería el ID del anunciante logueado
        views: 0,
        clicks: 0,
      };

      // Guardar realmente en Firestore
      console.log('🔥 Guardando anuncio en Firestore:', adDataToSave);
      const docRef = await addDoc(collection(db, 'advertisements'), adDataToSave);
      console.log('✅ Anuncio guardado con ID:', docRef.id);
      
      toast({
        title: 'Anuncio creado exitosamente',
        description: `Plan ${adData.ad_plan} - $${getPlanPrice(adData.ad_plan)} USD. Procesando pago...`
      });
      
      // Limpiar formulario
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
        cover_image_preview: null,
        ad_plan: 'standard'
      });
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      setShowCreateAd(false);
      setShowPaymentModal(false);
    } catch (error) {
      console.error('Error creating ad:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo crear el anuncio. Intenta de nuevo.'
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

                  <form onSubmit={(e) => {
                    e.preventDefault();
                    // Validar campos requeridos
                    if (!adData.title.trim() || !adData.description.trim() || !adData.contact_email.trim()) {
                      toast({
                        variant: 'destructive',
                        title: 'Error',
                        description: 'Completa los campos requeridos (título, descripción y email)'
                      });
                      return;
                    }
                    setShowCreateAd(false);
                    setShowPaymentModal(true);
                  }} className="space-y-4">
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
                          <SelectTrigger id="category">
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
                      <Label htmlFor="description">Descripción del Producto/Servicio</Label>
                      <Textarea
                        id="description"
                        value={adData.description}
                        onChange={(e) => setAdData({...adData, description: e.target.value})}
                        placeholder="Servicios Digitales"
                        className="min-h-[100px]"
                        required
                      />
                    </div>

                    {/* Foto de Portada con Vista Previa */}
                    <div>
                      <Label htmlFor="cover_image">Foto de Portada</Label>
                      <div className="space-y-3">
                        <input
                          ref={fileInputRef}
                          type="file"
                          id="cover_image"
                          accept="image/*"
                          onChange={handleImageSelect}
                          name="cover_image"
                          className="hidden"
                        />
                        
                        {adData.cover_image_preview ? (
                          <div className="relative">
                            <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-300">
                              <img
                                src={adData.cover_image_preview}
                                alt="Preview"
                                className="w-full h-full object-cover"
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="absolute top-2 right-2"
                                onClick={handleRemoveImage}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                            <p className="text-sm text-green-600 mt-1">
                              ✓ Imagen seleccionada: {adData.cover_image?.name}
                            </p>
                          </div>
                        ) : (
                          <div
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition-colors"
                          >
                            <Upload className="w-8 h-8 text-gray-400 mb-2" />
                            <p className="text-sm text-gray-500">Haz clic para subir imagen</p>
                            <p className="text-xs text-gray-400">JPG, PNG hasta 5MB</p>
                          </div>
                        )}
                      </div>
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
                      <h3 className="text-lg font-semibold mb-4">Datos de Contacto</h3>
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
                            placeholder="marketing@eu"
                            required
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Label htmlFor="contact_website">Sitio Web (opcional)</Label>
                          <Input
                            id="contact_website"
                            value={adData.contact_website}
                            onChange={(e) => setAdData({...adData, contact_website: e.target.value})}
                            placeholder="www.tendigitalservicellc.com"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Resumen simplificado */}
                    <div className="border-t pt-4">
                      <div className="bg-blue-50 rounded-lg p-4 mb-4">
                        <h4 className="font-semibold mb-2">📝 Resumen del Anuncio</h4>
                        <p className="text-sm text-gray-600">Título: {adData.title || 'Sin título'}</p>
                        <p className="text-sm text-gray-600">Categoría: {adData.category || 'Sin categoría'}</p>
                        <p className="text-sm text-gray-600">Email: {adData.contact_email || 'Sin email'}</p>
                        <p className="text-xs text-blue-600 mt-2">
                          ✅ Haz clic en "Elegir Plan de Pago" para continuar
                        </p>
                      </div>

                      <div className="flex gap-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowCreateAd(false)}
                          className="flex-1"
                          disabled={loading}
                        >
                          Cancelar
                        </Button>
                        <Button
                          type="button"
                          disabled={loading || !adData.title.trim() || !adData.description.trim() || !adData.contact_email.trim()}
                          className="flex-1"
                          onClick={() => {
                            setShowCreateAd(false);
                            setShowPaymentModal(true);
                          }}
                        >
                              <CreditCard className="w-4 h-4 mr-2" />
                          Elegir Plan de Pago
                        </Button>
                      </div>
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

        {/* Modal de Pagos Simplificado */}
        {showPaymentModal && (
          <div 
            className="fixed inset-0 bg-black/50 z-50"
            style={{
              animation: 'fadeIn 0.2s ease-out',
            }}
            onClick={() => setShowPaymentModal(false)}
          >
            <div className="bg-white rounded-lg max-w-md w-full mx-auto mt-20 p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">🚀 Elegir Plan de Publicidad</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPaymentModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="space-y-3 mb-6">
                {/* Plan Estándar */}
                <div 
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    adData.ad_plan === 'standard' 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-gray-200 hover:border-green-300'
                  }`}
                  onClick={() => setAdData({...adData, ad_plan: 'standard'})}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        checked={adData.ad_plan === 'standard'}
                        onChange={() => setAdData({...adData, ad_plan: 'standard'})}
                        className="w-4 h-4 text-green-500"
                      />
                    <div>
                        <h4 className="font-semibold">📢 Plan Estándar</h4>
                        <p className="text-sm text-gray-600">Publicación única que aparecerá arriba y se irá perdiendo en el feed</p>
                    </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-500">$10</p>
                      <p className="text-xs text-gray-500">USD</p>
                    </div>
                  </div>
                </div>

                {/* Plan Premium */}
                <div 
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    adData.ad_plan === 'premium' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                  onClick={() => setAdData({...adData, ad_plan: 'premium'})}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        checked={adData.ad_plan === 'premium'}
                        onChange={() => setAdData({...adData, ad_plan: 'premium'})}
                        className="w-4 h-4 text-blue-500"
                      />
                    <div>
                        <h4 className="font-semibold">⭐ Plan Premium</h4>
                        <p className="text-sm text-gray-600">Se muestra cada 6 posts de usuarios + 2 banners promocionales por 30 días</p>
                    </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-500">$30</p>
                      <p className="text-xs text-gray-500">USD</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="text-center">
                  <Button
                    onClick={() => handleCreateAd({ preventDefault: () => {} })}
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
                        Pagar ${getPlanPrice(adData.ad_plan)} USD
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-gray-500 text-center mt-2">
                  * Pago simulado por ahora - Se publica inmediatamente
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default AdvertisingPortal;
