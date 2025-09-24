import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from "@/components/ui/use-toast.jsx";
import { Link } from 'react-router-dom';
import { countries, getProvincesByCountry, getCountryCode } from '@/utils/locationData';
import { containsProhibitedContent, containsCommercialContent, containsContactInfo, validateEmail } from '@/utils/validation';
import PhoneInput from '@/components/ui/PhoneInput';

const RegisterStep1 = ({ formData, updateFormData, nextStep }) => {
  const { toast } = useToast();

  const provinces = useMemo(() => getProvincesByCountry(formData.pais), [formData.pais]);

  const handleChange = (e) => {
    updateFormData({ [e.target.id]: e.target.value });
  };

  const handleSelectChange = (id, value) => {
    const newForm = { [id]: value };
    if (id === 'pais') {
      newForm.provincia = '';
      const countryCode = getCountryCode(value);
      if (countryCode) {
        newForm.telefono = `+${countryCode}`;
      }
    }
    updateFormData(newForm);
  };

  const handleNext = (e) => {
    e.preventDefault();
    
    const requiredFields = ['nombre_completo', 'alias', 'documento', 'pais', 'provincia', 'municipio', 'telefono', 'email'];
    for (const field of requiredFields) {
      if (!formData[field]) {
        toast({ variant: "destructive", title: "Campos incompletos", description: "Por favor, completa todos los campos." });
        return;
      }
    }

    if (!validateEmail(formData.email)) {
        toast({ variant: "destructive", title: "Email inválido", description: "Por favor, ingresa un correo electrónico válido." });
        return;
    }

    const fieldsToValidate = [formData.nombre_completo, formData.alias, formData.municipio];
    for (const field of fieldsToValidate) {
      if (containsProhibitedContent(field) || containsCommercialContent(field) || containsContactInfo(field)) {
        toast({
          variant: "destructive",
          title: "Contenido no permitido",
          description: "Hemos detectado contenido inapropiado en uno de los campos. Por favor, revísalo.",
        });
        return;
      }
    }
    nextStep();
  };

  return (
    <Card className="w-full max-w-lg bg-surface border-secondary/30 text-text-primary">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl font-bold text-secondary">1° PASO</CardTitle>
        <CardDescription className="text-text-secondary">Es rápido, fácil y el primer paso para conectar.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleNext} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nombre_completo" className="text-primary">Nombre completo</Label>
              <Input id="nombre_completo" value={formData.nombre_completo} onChange={handleChange} required className="input-glass" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="alias" className="text-primary">Alias (apodo)</Label>
              <Input id="alias" value={formData.alias} onChange={handleChange} required className="input-glass" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="documento" className="text-primary">DNI / Cédula / Pasaporte</Label>
            <Input id="documento" value={formData.documento} onChange={handleChange} required className="input-glass" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pais" className="text-primary">País / Región</Label>
              <Select onValueChange={(value) => handleSelectChange('pais', value)} value={formData.pais} required>
                <SelectTrigger id="pais" className="input-glass"><SelectValue placeholder="Selecciona tu país" /></SelectTrigger>
                <SelectContent>
                  {countries.map(country => (
                    <SelectItem key={country.code} value={country.name}>{country.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="provincia" className="text-primary">Provincia / Estado</Label>
              <Select onValueChange={(value) => handleSelectChange('provincia', value)} value={formData.provincia} disabled={!formData.pais} required>
                <SelectTrigger id="provincia" className="input-glass"><SelectValue placeholder="Selecciona tu provincia" /></SelectTrigger>
                <SelectContent>
                  {provinces.map(prov => (
                    <SelectItem key={prov} value={prov}>{prov}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="municipio" className="text-primary">Municipio / Localidad</Label>
            <Input id="municipio" value={formData.municipio} onChange={handleChange} required className="input-glass" />
          </div>

          <PhoneInput
            label="Teléfono"
            value={formData.telefono}
            onChange={(value) => updateFormData('telefono', value)}
            placeholder="11 2345-6789"
            required
            className="input-glass"
          />
          <div className="space-y-2">
            <Label htmlFor="email" className="text-primary">Correo electrónico</Label>
            <Input id="email" type="email" value={formData.email} onChange={handleChange} required className="input-glass" />
          </div>
          <Button type="submit" className="w-full btn-action">
            Continuar
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col items-center">
        <p className="mt-2 text-center text-sm text-text-secondary">
          ¿Ya tienes una cuenta?{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Inicia Sesión
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
};

export default RegisterStep1;
