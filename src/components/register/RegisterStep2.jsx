import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from "@/components/ui/use-toast.jsx";
import { validatePassword } from '@/utils/validation';
import { CheckCircle, XCircle, Eye, EyeOff, Loader2 } from 'lucide-react';
// import { processMonetizationPayment } from '@/lib/monetization'; // Temporalmente deshabilitado

const PasswordRequirement = ({ isValid, text }) => (
  <div className={`flex items-center text-xs ${isValid ? 'text-green-400' : 'text-text-secondary'}`}>
    {isValid ? <CheckCircle className="w-3 h-3 mr-1.5" /> : <XCircle className="w-3 h-3 mr-1.5" />}
    {text}
  </div>
);

// PayPalIcon removido temporalmente - se implementará con Google Play Store

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

    // 🚀 REGISTRO SIMPLIFICADO - SIN VALIDACIÓN DE PAGO TEMPORAL
    // TODO: Implementar monetización real con Google Play Store en el futuro
    
    // Simular validación exitosa para continuar el flujo
    updateFormData({
      paymentValidated: true, // Temporalmente true
      paymentId: `TEMP-${Date.now()}`, // ID temporal
      paymentDate: new Date(), // Fecha actual
    });

    toast({
      title: "¡Contraseña configurada correctamente!",
      description: "Procediendo al siguiente paso del registro.",
      className: "bg-green-600 text-white"
    });

    // Continuar al siguiente paso inmediatamente
    setTimeout(() => {
      nextStep();
    }, 1000);
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

          {/* Sección de Validación Temporalmente Ocultada */}
          {/* TODO: Implementar monetización real con Google Play Store */}
          <div className="space-y-4 border-t border-border-color pt-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <h3 className="text-lg font-semibold text-green-800 mb-2">✅ Registro Simplificado</h3>
              <p className="text-sm text-green-700">
                La validación de identidad se implementará cuando publiques la app en Google Play Store.
                Por ahora, puedes continuar con el registro normal.
              </p>
            </div>
            
            <Button 
              type="submit" 
              className="w-full btn-action bg-primary hover:bg-primary/90 text-white font-bold py-3 text-lg flex items-center justify-center gap-2"
              disabled={isProcessingPayment}
            >
              {isProcessingPayment ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  Continuar Registro
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
