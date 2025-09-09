import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useToast } from "@/components/ui/use-toast.jsx";
import { useAuth } from '@/hooks/useAuth';

import RegisterStep1 from '@/components/register/RegisterStep1';
import RegisterStep2 from '@/components/register/RegisterStep2';
import RegisterStep3 from '@/components/register/RegisterStep3';

const MultiStepRegisterPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { signUp, signIn } = useAuth();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1
    nombre_completo: '',
    alias: '',
    documento: '',
    municipio: '',
    provincia: '',
    pais: '',
    telefono: '',
    email: '',
    // Step 2
    password: '',
    confirmPassword: '',
    // Monetización
    paymentValidated: false,
    paymentId: null,
    paymentDate: null,
    // Step 3
    agreedToTerms: false,
    agreedToPrivacy: false,
    agreedToSecurity: false,
  });

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  const updateFormData = (data) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  const handleFinalSubmit = async () => {
    setLoading(true);
    
    // 🔥 VALIDAR QUE EL PAGO ESTÉ COMPLETADO
    if (!formData.paymentValidated) {
      toast({
        variant: "destructive",
        title: "Pago requerido",
        description: "Debes completar la validación de pago antes de crear tu cuenta.",
      });
      setLoading(false);
      return;
    }
    
    const { agreedToTerms, agreedToPrivacy, agreedToSecurity, confirmPassword, ...finalAuthData } = formData;

    const { data: signUpData, error: signUpError } = await signUp(finalAuthData);

    if (signUpError) {
      toast({
        variant: "destructive",
        title: "Error de registro",
        description: signUpError.message === 'User already registered' ? 'El email ya está en uso. Por favor, intenta con otro.' : 'Ocurrió un error al crear tu cuenta: ' + signUpError.message,
      });
      setLoading(false);
      return;
    }
    
    if (signUpData.user) {
      toast({
        title: "¡Cuenta creada exitosamente!",
        description: `Validación de $1 USD completada. ID de pago: ${formData.paymentId}. ¡Bienvenido!`,
        className: "bg-primary text-background"
      });

      await signIn(finalAuthData.email, finalAuthData.password);
      navigate('/profile');
    } else {
        toast({
            variant: "destructive",
            title: "Error inesperado",
            description: "No se pudo crear el usuario. Por favor, intenta de nuevo.",
        });
    }
    setLoading(false);
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return <RegisterStep1 formData={formData} updateFormData={updateFormData} nextStep={nextStep} />;
      case 2:
        return <RegisterStep2 formData={formData} updateFormData={updateFormData} nextStep={nextStep} prevStep={prevStep} />;
      case 3:
        return <RegisterStep3 formData={formData} updateFormData={updateFormData} prevStep={prevStep} handleFinalSubmit={handleFinalSubmit} loading={loading} />;
      default:
        return <RegisterStep1 formData={formData} updateFormData={updateFormData} nextStep={nextStep} />;
    }
  };
  
  const currentStepTitle = `Registro (Paso ${step || 1} de 3) - AGARCH-AR`;

  return (
    <>
      <Helmet>
        <title>{currentStepTitle}</title>
        <meta name="description" content="Crea tu cuenta en AGARCH-AR y empieza a conectar." />
      </Helmet>
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3 }}
        >
          {renderStep()}
        </motion.div>
      </AnimatePresence>
    </>
  );
};

export default MultiStepRegisterPage;
