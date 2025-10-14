import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import PhoneInput from '@/components/ui/PhoneInput';
import { ArrowLeft, Upload, Plus } from 'lucide-react';

const CreateAdPage = () => {
  const [adData, setAdData] = useState({
    title: '',
    description: '',
    category: '',
    company_info: '',
    contact_phone: '',
    contact_email: '',
    contact_website: '',
    cover_image: null
  });
  
  const { toast } = useToast();
  const navigate = useNavigate();

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

  const handleNextStep = () => {
    // Validar campos requeridos
    if (!adData.title.trim() || !adData.description.trim() || !adData.contact_email.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Completa los campos requeridos (título, descripción y email)'
      });
      return;
    }
    
    // Guardar datos en localStorage para la siguiente página
    localStorage.setItem('adData', JSON.stringify(adData));
    
    // Navegar a la página de pagos
    navigate('/ad-payment');
  };

  return (
    <>
      <Helmet>
        <title>Crear Anuncio - AGARCH-AR</title>
        <meta name="description" content="Crea tu anuncio publicitario en AGARCH-AR." />
      </Helmet>
      
      <div className="min-h-screen bg-background p-4">
        <div className="container mx-auto py-8">
          <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold text-primary">Crear Nuevo Anuncio</h1>
              <Button asChild variant="outline">
                <Link to="/ad-login">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Volver
                </Link>
              </Button>
            </div>

            {/* Formulario */}
            <div className="card-glass p-8 rounded-lg space-y-6">
              {/* Título */}
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

              {/* Categoría */}
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

              {/* Foto de Portada */}
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

              {/* Descripción */}
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

              {/* Información de la Empresa */}
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
                    <PhoneInput
                      label="Teléfono"
                      value={adData.contact_phone}
                      onChange={(value) => setAdData(prev => ({ ...prev, contact_phone: value }))}
                      placeholder="Número de teléfono"
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

              {/* Botón Continuar */}
              <Button 
                onClick={handleNextStep}
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={!adData.title || !adData.description || !adData.contact_phone || !adData.contact_email}
              >
                <Plus className="mr-2 h-4 w-4" />
                Continuar al Plan de Pago
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CreateAdPage;
