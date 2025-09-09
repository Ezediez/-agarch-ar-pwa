import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from "@/components/ui/use-toast.jsx";
import { validatePassword } from '@/utils/validation';
import { CheckCircle, XCircle, Eye, EyeOff, Loader2 } from 'lucide-react';
import { processMonetizationPayment } from '@/lib/monetization';

const PasswordRequirement = ({ isValid, text }) => (
  <div className={`flex items-center text-xs ${isValid ? 'text-green-400' : 'text-text-secondary'}`}>
    {isValid ? <CheckCircle className="w-3 h-3 mr-1.5" /> : <XCircle className="w-3 h-3 mr-1.5" />}
    {text}
  </div>
);

const PayPalIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7.72 4.28a.2.2 0 0 0-.18.32l2.35 12.33a.2.2 0 0 0 .2.16h2.86a.2.2 0 0 0 .2-.16L15.48 4.6a.2.2 0 0 0-.19-.32h-3.1a.2.2 0 0 1-.2-.16L9.64 2.3a.2.2 0 0 0-.2-.16H6.5a.2.2 0 0 0-.2.16L3.95 16.9a.2.2 0 0 0 .2.16h2.82a.2.2 0 0 0 .2-.16l.7-3.66h.1a.2.2 0 0 0 .2-.16l.29-1.5a.2.2 0 0 0-.2-.25h-2.1a.2.2 0 0 1-.2-.16l.94-4.88a.2.2 0 0 1 .2-.16h2.92a.2.2 0 0 1 .2.16L7.72 4.28z"/>
  </svg>
);

const RegisterStep2 = ({ formData, updateFormData, nextStep, prevStep }) => {
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const passwordValidation = useMemo(() => {
    const { errors } = validatePassword(formData.password);
    return {
      minLength: !errors.minLength,
      hasUppercase: !errors.hasUppercase,
      hasSymbol: !errors.hasSymbol,
    };
  }, [formData.password]);

  const handleChange = (e) => {
    updateFormData({ [e.target.id]: e.target.value });
  };
  
  const handleNext = async (e) => {
    e.preventDefault();

    const { isValid } = validatePassword(formData.password);
    if (!isValid) {
      toast({ variant: "destructive", title: "Contraseña inválida", description: "Asegúrate de que tu contraseña cumpla los requisitos." });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({ variant: "destructive", title: "Las contraseñas no coinciden", description: "Por favor, verifica tu contraseña." });
      return;
    }

    // 🔥 PROCESAR PAGO CON FIREBASE
    setIsProcessingPayment(true);
    
    try {
      // Generar un ID temporal para el usuario (antes de crear la cuenta)
      const tempUserId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const paymentResult = await processMonetizationPayment(tempUserId, {
        email: formData.email,
        nombre: formData.nombre_completo,
        alias: formData.alias,
      });

      if (paymentResult.success) {
        // Guardar datos del pago en el formData para el siguiente paso
        updateFormData({
          paymentValidated: true,
          paymentId: paymentResult.paymentData.paymentId,
          paymentDate: paymentResult.paymentData.timestamp,
        });

        toast({
          title: "¡Validación con PayPal exitosa!",
          description: `Pago de $1 USD procesado. ID: ${paymentResult.paymentData.paymentId}`,
          className: "bg-green-600 text-white"
        });

        // Continuar al siguiente paso
        setTimeout(() => {
          nextStep();
        }, 1500);
      } else {
        toast({
          variant: "destructive",
          title: "Error en el pago",
          description: paymentResult.error || "No se pudo procesar el pago. Intenta nuevamente.",
        });
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      toast({
        variant: "destructive",
        title: "Error inesperado",
        description: "Ocurrió un problema al procesar el pago. Intenta nuevamente.",
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  return (
    <Card className="w-full max-w-lg bg-surface border-secondary/30 text-text-primary">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl font-bold text-secondary">2° PASO</CardTitle>
        <CardDescription className="text-text-secondary">Crea tu contraseña y valida tu cuenta.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleNext} className="space-y-6">
          {/* Password Section */}
          <div className="space-y-4">
            <div className="space-y-2 relative">
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" type={showPassword ? "text" : "password"} value={formData.password} onChange={handleChange} required className="input-glass pr-10" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-9 text-text-secondary">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <div className="space-y-2 relative">
              <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
              <Input id="confirmPassword" type={showConfirmPassword ? "text" : "password"} value={formData.confirmPassword} onChange={handleChange} required className="input-glass pr-10" />
               <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-9 text-text-secondary">
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <div className="pt-1 space-y-1">
              <PasswordRequirement isValid={passwordValidation.minLength} text="8+ caracteres" />
              <PasswordRequirement isValid={passwordValidation.hasUppercase} text="1 mayúscula" />
              <PasswordRequirement isValid={passwordValidation.hasSymbol} text="1 símbolo" />
            </div>
          </div>

          {/* PayPal Validation Section */}
          <div className="space-y-4 border-t border-border-color pt-6">
            <h3 className="text-lg font-semibold text-center text-primary">Validación de Identidad</h3>
            <p className="text-sm text-center text-text-secondary">
              Para prevenir cuentas falsas y asegurar la calidad de nuestra comunidad, requerimos una validación única de 1 USD a través de PayPal. Esto NO es una suscripción ni monetización.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-center text-blue-700 font-semibold">
                💡 <strong>Nota:</strong> La monetización real será a través de Play Store/App Store cuando publiques la app. Este pago es solo para validación de identidad.
              </p>
            </div>
             <p className="text-xs text-center text-brand-red font-semibold pt-2">
              (El titular de la cuenta de PayPal debe ser el mismo que el del perfil que se está creando)
            </p>
            <Button 
              type="submit" 
              className="w-full btn-action bg-[#0070BA] hover:bg-[#005ea6] text-white font-bold py-3 text-lg flex items-center justify-center gap-2"
              disabled={isProcessingPayment}
            >
              {isProcessingPayment ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Procesando pago...
                </>
              ) : (
                <>
                  <PayPalIcon/>
                  Pagar 1 USD con PayPal
                </>
              )}
            </Button>
          </div>

          <div className="flex justify-between items-center pt-4">
            <Button type="button" variant="outline" onClick={prevStep}>Atrás</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default RegisterStep2;
