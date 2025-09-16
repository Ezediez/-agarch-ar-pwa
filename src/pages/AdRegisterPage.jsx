import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { db, auth, storage } from '@/lib/firebase';
import { ArrowLeft, Building, User, Phone, Mail, CreditCard, Shield } from 'lucide-react';

const AdRegisterPage = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Datos Personales
    nombre_completo: '',
    documento: '',
    email: '',
    telefono: '',
    // Datos de Empresa
    nombre_empresa: '',
    tipo_empresa: '',
    ruc_cuit: '',
    direccion_empresa: '',
    // Datos de Contacto
    email_empresa: '',
    telefono_empresa: '',
    sitio_web: '',
    // Validación
    password: '',
    confirmPassword: ''
  });
  
  const { toast } = useToast();
  const navigate = useNavigate();

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  const handleValidationPayment = async () => {
    toast({
      title: "Redirigiendo a PayPal",
      description: "Serás redirigido para completar la validación de $1 USD",
    });

    // Simular redirección a PayPal
    setTimeout(() => {
      toast({
        title: "Pago Simulado Exitoso",
        description: "Validación de identidad completada. Creando cuenta...",
        className: "bg-green-600 text-white"
      });
      handleFinalSubmit();
    }, 2000);
  };

  const handleFinalSubmit = async () => {
    setLoading(true);
    
    try {
      // Crear cuenta de anunciante en Firebase
      const advertiserData = {
        ...formData,
        account_type: 'advertiser',
        verification_status: 'verified',
        validation_payment: 1.00,
        created_at: new Date()
      };

      // Simular creación de cuenta
      setTimeout(() => {
        toast({
          title: "¡Cuenta Publicitaria Creada!",
          description: "Ya puedes iniciar sesión y crear tus anuncios",
          className: "bg-primary text-white"
        });
        navigate('/ad-login');
      }, 1500);

    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error al crear cuenta",
        description: "No se pudo crear la cuenta publicitaria. Intenta nuevamente."
      });
    }
    
    setLoading(false);
  };

  const renderPersonalData = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <User className="w-12 h-12 text-primary mx-auto mb-3" />
        <h2 className="text-2xl font-bold text-primary">Datos Personales</h2>
        <p className="text-text-secondary">Información del responsable de la cuenta</p>
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        <div>
          <Label htmlFor="nombre_completo">Nombre Completo</Label>
          <Input
            id="nombre_completo"
            value={formData.nombre_completo}
            onChange={(e) => updateFormData('nombre_completo', e.target.value)}
            placeholder="Juan Pérez"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="documento">Documento de Identidad</Label>
          <Input
            id="documento"
            value={formData.documento}
            onChange={(e) => updateFormData('documento', e.target.value)}
            placeholder="12.345.678"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="email">Email Personal</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => updateFormData('email', e.target.value)}
            placeholder="juan@email.com"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="telefono">Teléfono</Label>
          <Input
            id="telefono"
            value={formData.telefono}
            onChange={(e) => updateFormData('telefono', e.target.value)}
            placeholder="+54 9 11 1234-5678"
            required
          />
        </div>
      </div>

      <Button onClick={nextStep} className="w-full">
        Continuar <ArrowLeft className="ml-2 h-4 w-4 rotate-180" />
      </Button>
    </div>
  );

  const renderCompanyData = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <Building className="w-12 h-12 text-primary mx-auto mb-3" />
        <h2 className="text-2xl font-bold text-primary">Datos de Empresa</h2>
        <p className="text-text-secondary">Información comercial</p>
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        <div>
          <Label htmlFor="nombre_empresa">Nombre de la Empresa</Label>
          <Input
            id="nombre_empresa"
            value={formData.nombre_empresa}
            onChange={(e) => updateFormData('nombre_empresa', e.target.value)}
            placeholder="Mi Empresa SRL"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="tipo_empresa">Tipo de Empresa</Label>
          <Input
            id="tipo_empresa"
            value={formData.tipo_empresa}
            onChange={(e) => updateFormData('tipo_empresa', e.target.value)}
            placeholder="SRL, SA, Monotributo, etc."
            required
          />
        </div>
        
        <div>
          <Label htmlFor="ruc_cuit">RUC/CUIT</Label>
          <Input
            id="ruc_cuit"
            value={formData.ruc_cuit}
            onChange={(e) => updateFormData('ruc_cuit', e.target.value)}
            placeholder="20-12345678-9"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="direccion_empresa">Dirección</Label>
          <Input
            id="direccion_empresa"
            value={formData.direccion_empresa}
            onChange={(e) => updateFormData('direccion_empresa', e.target.value)}
            placeholder="Av. Corrientes 1234, CABA"
            required
          />
        </div>
      </div>

      <div className="flex gap-3">
        <Button onClick={prevStep} variant="outline" className="flex-1">
          <ArrowLeft className="mr-2 h-4 w-4" /> Anterior
        </Button>
        <Button onClick={nextStep} className="flex-1">
          Continuar <ArrowLeft className="ml-2 h-4 w-4 rotate-180" />
        </Button>
      </div>
    </div>
  );

  const renderContactValidation = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <Shield className="w-12 h-12 text-primary mx-auto mb-3" />
        <h2 className="text-2xl font-bold text-primary">Validación de Identidad</h2>
        <p className="text-text-secondary">Último paso: validación con $1 USD</p>
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        <div>
          <Label htmlFor="email_empresa">Email de Contacto</Label>
          <Input
            id="email_empresa"
            type="email"
            value={formData.email_empresa}
            onChange={(e) => updateFormData('email_empresa', e.target.value)}
            placeholder="contacto@miempresa.com"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="telefono_empresa">Teléfono Comercial</Label>
          <Input
            id="telefono_empresa"
            value={formData.telefono_empresa}
            onChange={(e) => updateFormData('telefono_empresa', e.target.value)}
            placeholder="+54 11 4000-0000"
          />
        </div>
        
        <div>
          <Label htmlFor="sitio_web">Sitio Web (opcional)</Label>
          <Input
            id="sitio_web"
            value={formData.sitio_web}
            onChange={(e) => updateFormData('sitio_web', e.target.value)}
            placeholder="https://miempresa.com"
          />
        </div>

        <div>
          <Label htmlFor="password">Contraseña</Label>
          <Input
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) => updateFormData('password', e.target.value)}
            placeholder="Mínimo 6 caracteres"
            required
          />
        </div>

        <div>
          <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
          <Input
            id="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => updateFormData('confirmPassword', e.target.value)}
            placeholder="Repetir contraseña"
            required
          />
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center">
          <CreditCard className="w-5 h-5 text-yellow-600 mr-2" />
          <span className="font-semibold text-yellow-800">Validación de Identidad</span>
        </div>
        <p className="text-yellow-700 text-sm mt-2">
          Para verificar tu identidad y prevenir cuentas falsas, se requiere un pago único de <strong>$1 USD via PayPal</strong>.
          Este monto no es reembolsable y valida tu cuenta permanentemente.
        </p>
      </div>

      <div className="flex gap-3">
        <Button onClick={prevStep} variant="outline" className="flex-1">
          <ArrowLeft className="mr-2 h-4 w-4" /> Anterior
        </Button>
        <Button 
          onClick={handleValidationPayment} 
          className="flex-1 bg-blue-600 hover:bg-blue-700"
          disabled={loading || formData.password !== formData.confirmPassword}
        >
          {loading ? 'Procesando...' : 'Pagar $1 USD'} <CreditCard className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <Helmet>
        <title>Registro Publicitario - AGARCH-AR</title>
        <meta name="description" content="Crea tu cuenta de anunciante para publicitar en AGARCH-AR." />
      </Helmet>
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-primary mb-4">Registro Publicitario</h1>
            <div className="flex justify-center items-center space-x-2 mb-6">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-primary text-white' : 'bg-gray-300'}`}>1</div>
              <div className={`w-12 h-1 ${step >= 2 ? 'bg-primary' : 'bg-gray-300'}`}></div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-primary text-white' : 'bg-gray-300'}`}>2</div>
              <div className={`w-12 h-1 ${step >= 3 ? 'bg-primary' : 'bg-gray-300'}`}></div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-primary text-white' : 'bg-gray-300'}`}>3</div>
            </div>
          </div>

          {/* Form */}
          <div className="card-glass p-8 rounded-lg">
            {step === 1 && renderPersonalData()}
            {step === 2 && renderCompanyData()}
            {step === 3 && renderContactValidation()}
          </div>

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

export default AdRegisterPage;
