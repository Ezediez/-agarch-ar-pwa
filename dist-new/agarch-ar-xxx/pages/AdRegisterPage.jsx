import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { db, auth } from '@/lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { ArrowLeft, Building, User, Phone, Mail, Globe } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PhoneInput from '@/components/ui/PhoneInput';

// Lista de países eliminada - ahora se usa PhoneInput component
/*
const paisesTelefono = [
  { codigo: '+54', pais: 'Argentina', bandera: '🇦🇷' },
  { codigo: '+1', pais: 'Estados Unidos', bandera: '🇺🇸' },
  { codigo: '+1', pais: 'Canadá', bandera: '🇨🇦' },
  { codigo: '+52', pais: 'México', bandera: '🇲🇽' },
  { codigo: '+55', pais: 'Brasil', bandera: '🇧🇷' },
  { codigo: '+56', pais: 'Chile', bandera: '🇨🇱' },
  { codigo: '+57', pais: 'Colombia', bandera: '🇨🇴' },
  { codigo: '+51', pais: 'Perú', bandera: '🇵🇪' },
  { codigo: '+58', pais: 'Venezuela', bandera: '🇻🇪' },
  { codigo: '+593', pais: 'Ecuador', bandera: '🇪🇨' },
  { codigo: '+591', pais: 'Bolivia', bandera: '🇧🇴' },
  { codigo: '+598', pais: 'Uruguay', bandera: '🇺🇾' },
  { codigo: '+595', pais: 'Paraguay', bandera: '🇵🇾' },
  { codigo: '+34', pais: 'España', bandera: '🇪🇸' },
  { codigo: '+39', pais: 'Italia', bandera: '🇮🇹' },
  { codigo: '+33', pais: 'Francia', bandera: '🇫🇷' },
  { codigo: '+49', pais: 'Alemania', bandera: '🇩🇪' },
  { codigo: '+44', pais: 'Reino Unido', bandera: '🇬🇧' },
  { codigo: '+31', pais: 'Países Bajos', bandera: '🇳🇱' },
  { codigo: '+41', pais: 'Suiza', bandera: '🇨🇭' },
  { codigo: '+43', pais: 'Austria', bandera: '🇦🇹' },
  { codigo: '+351', pais: 'Portugal', bandera: '🇵🇹' },
  { codigo: '+90', pais: 'Turquía', bandera: '🇹🇷' },
  { codigo: '+7', pais: 'Rusia', bandera: '🇷🇺' },
  { codigo: '+86', pais: 'China', bandera: '🇨🇳' },
  { codigo: '+81', pais: 'Japón', bandera: '🇯🇵' },
  { codigo: '+82', pais: 'Corea del Sur', bandera: '🇰🇷' },
  { codigo: '+91', pais: 'India', bandera: '🇮🇳' },
  { codigo: '+61', pais: 'Australia', bandera: '🇦🇺' },
  { codigo: '+64', pais: 'Nueva Zelanda', bandera: '🇳🇿' },
  { codigo: '+27', pais: 'Sudáfrica', bandera: '🇿🇦' },
  { codigo: '+966', pais: 'Arabia Saudí', bandera: '🇸🇦' },
  { codigo: '+971', pais: 'Emiratos Árabes', bandera: '🇦🇪' },
  { codigo: '+972', pais: 'Israel', bandera: '🇮🇱' },
  { codigo: '+20', pais: 'Egipto', bandera: '🇪🇬' },
  { codigo: '+234', pais: 'Nigeria', bandera: '🇳🇬' },
  { codigo: '+254', pais: 'Kenia', bandera: '🇰🇪' },
  { codigo: '+55', pais: 'Brasil', bandera: '🇧🇷' },
];
*/

const AdRegisterPage = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Datos Personales
    nombre_completo: '',
    documento_identidad: '',
    email: '',
    telefono_comercial: '',
    codigo_pais: '+54', // Argentina por defecto
    // Datos de Empresa
    nombre_empresa: '',
    tipo_empresa: '',
    numero_identificacion_comercial: '', // Genérico para LATAM/EEUU/Europa
    sitio_web: '', // Opcional
    // Seguridad
    password: '',
    confirmPassword: ''
  });
  
  const { toast } = useToast();
  const navigate = useNavigate();

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Función eliminada - ahora se usa PhoneInput component
  // const handleCountryChange = (value) => {
  //   setFormData(prev => ({ 
  //     ...prev, 
  //     codigo_pais: value,
  //     telefono_comercial: '' // Limpiar teléfono al cambiar país
  //   }));
  // };

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.nombre_completo || !formData.documento_identidad || !formData.email || 
        !formData.telefono_comercial || !formData.nombre_empresa || !formData.tipo_empresa ||
        !formData.numero_identificacion_comercial || !formData.password || !formData.confirmPassword) {
      toast({
        variant: "destructive",
        title: "Campos incompletos",
        description: "Por favor, completa todos los campos obligatorios.",
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        variant: "destructive",
        title: "Contraseñas no coinciden",
        description: "Las contraseñas deben ser iguales.",
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        variant: "destructive",
        title: "Contraseña muy corta",
        description: "La contraseña debe tener al menos 6 caracteres.",
      });
      return;
    }

    setLoading(true);

    try {
      console.log('🔄 Intentando crear usuario con:', {
        email: formData.email,
        passwordLength: formData.password.length,
        telefono: formData.telefono_comercial,
        codigoPais: formData.codigo_pais
      });

      // Crear usuario en Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;
      
      console.log('✅ Usuario creado exitosamente:', user.uid);

      // Crear perfil de anunciante en Firestore
      await setDoc(doc(db, 'advertisers', user.uid), {
        // Datos Personales
        nombre_completo: formData.nombre_completo,
        documento_identidad: formData.documento_identidad,
        email: formData.email,
        telefono_comercial: `${formData.codigo_pais} ${formData.telefono_comercial}`,
        codigo_pais: formData.codigo_pais,
        
        // Datos de Empresa
        nombre_empresa: formData.nombre_empresa,
        tipo_empresa: formData.tipo_empresa,
        numero_identificacion_comercial: formData.numero_identificacion_comercial,
        sitio_web: formData.sitio_web || '',
        
        // Metadatos
        created_at: new Date(),
        last_login: new Date(),
        status: 'active',
        subscription_type: 'basic',
        budget: 0.00,
        spent: 0.00,
        ads_count: 0
      });

      toast({
        title: "Cuenta creada exitosamente",
        description: "Tu cuenta de anunciante ha sido creada. Ya puedes acceder al Portal de Anunciantes.",
        className: "bg-green-500 text-white"
      });

      // Redirigir al Portal de Anunciantes
      navigate('/advertising-portal');

    } catch (error) {
      console.error('❌ Error creating advertiser account:', error);
      console.error('❌ Error code:', error.code);
      console.error('❌ Error message:', error.message);
      console.error('❌ Form data:', {
        email: formData.email,
        passwordLength: formData.password?.length,
        nombre: formData.nombre_completo,
        empresa: formData.nombre_empresa
      });
      
      let errorMessage = 'Error al crear la cuenta. Inténtalo de nuevo.';
      let errorTitle = 'Error';
      
      if (error.code === 'auth/email-already-in-use') {
        errorTitle = 'Email ya registrado';
        errorMessage = 'Este email ya está en uso. Por favor, usa un email diferente o intenta iniciar sesión.';
      } else if (error.code === 'auth/invalid-email') {
        errorTitle = 'Email inválido';
        errorMessage = 'El formato del email no es válido. Por favor, verifica tu email.';
      } else if (error.code === 'auth/weak-password') {
        errorTitle = 'Contraseña débil';
        errorMessage = 'La contraseña debe tener al menos 6 caracteres. Por favor, elige una contraseña más segura.';
      } else if (error.code === 'auth/operation-not-allowed') {
        errorTitle = 'Operación no permitida';
        errorMessage = 'El registro está temporalmente deshabilitado. Contacta al administrador.';
      } else if (error.code === 'auth/too-many-requests') {
        errorTitle = 'Demasiados intentos';
        errorMessage = 'Has intentado registrarte muchas veces. Espera unos minutos antes de intentar de nuevo.';
      } else if (error.code === 'auth/network-request-failed') {
        errorTitle = 'Error de conexión';
        errorMessage = 'Problema de conexión. Verifica tu internet e intenta de nuevo.';
      } else {
        errorMessage = `Error técnico: ${error.code}. ${error.message}`;
      }
      
      toast({
        variant: "destructive",
        title: errorTitle,
        description: errorMessage,
        duration: 10000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Registro Publicitario - AGARCH-AR</title>
      </Helmet>
      
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
                <Building className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-primary mb-2">Registro Publicitario</h1>
            <p className="text-muted-foreground">Crea tu cuenta para gestionar anuncios</p>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center space-x-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= 1 ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
              }`}>
                1
              </div>
              <div className={`w-16 h-1 ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= 2 ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
              }`}>
                2
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="card-glass p-6 rounded-lg">
            <form onSubmit={handleSubmit}>
              {step === 1 && (
                <>
                  <div className="mb-6">
                    <div className="flex items-center justify-center mb-4">
                      <User className="w-8 h-8 text-primary" />
                    </div>
                    <h2 className="text-xl font-bold text-primary text-center mb-2">Datos Personales</h2>
                    <p className="text-muted-foreground text-center text-sm">Información del responsable</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="nombre_completo">Nombre y Apellido del Responsable</Label>
                      <Input
                        id="nombre_completo"
                        value={formData.nombre_completo}
                        onChange={(e) => updateFormData('nombre_completo', e.target.value)}
                        placeholder="Juan Pérez"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="documento_identidad">Nº de Documento/Cédula/Pasaporte</Label>
                      <Input
                        id="documento_identidad"
                        value={formData.documento_identidad}
                        onChange={(e) => updateFormData('documento_identidad', e.target.value)}
                        placeholder="12.345.678 o AB1234567"
                        required
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Documento de identidad válido en tu país
                      </p>
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

                    <PhoneInput
                      label="Teléfono de Contacto Comercial"
                      value={formData.telefono_comercial}
                      onChange={(value) => updateFormData('telefono_comercial', value)}
                      placeholder="9 11 1234-5678"
                      required
                    />
                  </div>

                  <div className="flex gap-4 mt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate('/')}
                      className="flex-1"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Volver al Inicio
                    </Button>
                    <Button
                      type="button"
                      onClick={nextStep}
                      className="flex-1"
                    >
                      Continuar →
                    </Button>
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <div className="mb-6">
                    <div className="flex items-center justify-center mb-4">
                      <Building className="w-8 h-8 text-primary" />
                    </div>
                    <h2 className="text-xl font-bold text-primary text-center mb-2">Datos de Empresa</h2>
                    <p className="text-muted-foreground text-center text-sm">Información comercial</p>
                  </div>

                  <div className="space-y-4">
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
                        placeholder="SRL, LLC, S.A., etc."
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="numero_identificacion_comercial">Número de Identificación Comercial</Label>
                      <Input
                        id="numero_identificacion_comercial"
                        value={formData.numero_identificacion_comercial}
                        onChange={(e) => updateFormData('numero_identificacion_comercial', e.target.value)}
                        placeholder="RUC, CUIT, EIN, VAT, etc."
                        required
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        RUC, CUIT, EIN, VAT, o equivalente en tu país
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="sitio_web">Sitio Web (Opcional)</Label>
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
                        minLength={6}
                      />
                      {formData.password && formData.password.length < 6 && (
                        <p className="text-sm text-red-500 mt-1">
                          La contraseña debe tener al menos 6 caracteres
                        </p>
                      )}
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
                      {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                        <p className="text-sm text-red-500 mt-1">
                          Las contraseñas no coinciden
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-4 mt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={prevStep}
                      className="flex-1"
                    >
                      ← Anterior
                    </Button>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="flex-1"
                    >
                      {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
                    </Button>
                  </div>
                </>
              )}
            </form>
          </div>

          {/* Login Link */}
          <div className="text-center mt-6">
            <p className="text-muted-foreground">
              ¿Ya tienes cuenta?{' '}
              <Link to="/ad-login" className="text-primary hover:underline">
                Iniciar sesión
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdRegisterPage;