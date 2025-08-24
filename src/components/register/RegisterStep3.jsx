import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from "@/components/ui/use-toast.jsx";

const RegisterStep3 = ({ formData, updateFormData, prevStep, handleFinalSubmit, loading }) => {
  const { toast } = useToast();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.agreedToTerms || !formData.agreedToPrivacy || !formData.agreedToSecurity) {
      toast({
        variant: "destructive",
        title: "Aceptación requerida",
        description: "Debes aceptar todos los términos y políticas para continuar.",
      });
      return;
    }
    handleFinalSubmit();
  };

  return (
    <Card className="w-full max-w-lg bg-surface border-secondary/30 text-text-primary">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl font-bold text-secondary">3° YA VALIDASTE TUS DATOS</CardTitle>
        <CardDescription className="text-text-secondary">Solo un paso más para unirte a la comunidad.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <Checkbox id="agreedToTerms" checked={formData.agreedToTerms} onCheckedChange={(checked) => updateFormData({ agreedToTerms: checked })} className="mt-1" />
              <Label htmlFor="agreedToTerms" className="font-normal">
                Acepto los <a href="/terms" target="_blank" className="text-primary hover:underline">Términos y Condiciones</a>.
              </Label>
            </div>
            <div className="flex items-start space-x-3">
              <Checkbox id="agreedToPrivacy" checked={formData.agreedToPrivacy} onCheckedChange={(checked) => updateFormData({ agreedToPrivacy: checked })} className="mt-1" />
              <Label htmlFor="agreedToPrivacy" className="font-normal">
                Acepto las <a href="/privacy" target="_blank" className="text-primary hover:underline">Políticas de Privacidad</a>.
              </Label>
            </div>
            <div className="flex items-start space-x-3">
              <Checkbox id="agreedToSecurity" checked={formData.agreedToSecurity} onCheckedChange={(checked) => updateFormData({ agreedToSecurity: checked })} className="mt-1" />
              <Label htmlFor="agreedToSecurity" className="font-normal">
                Acepto las <a href="/security" target="_blank" className="text-primary hover:underline">Políticas de Seguridad</a>.
              </Label>
            </div>
          </div>

          <div className="text-center text-sm text-text-secondary pt-4">
            <p>Crea tu cuenta y pasarás a completar tu perfil de búsquedas y tu primera publicación.</p>
          </div>

          <div className="flex justify-between items-center pt-4">
            <Button type="button" variant="outline" onClick={prevStep}>Atrás</Button>
            <Button type="submit" disabled={loading} className="btn-action">
              {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default RegisterStep3;