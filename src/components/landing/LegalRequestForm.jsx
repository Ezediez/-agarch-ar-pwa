import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

const LegalRequestForm = ({ setOpen }) => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
  const { toast } = useToast();

  const onSubmit = async (data) => {
    // Here you would typically send the data to a secure backend endpoint
    // For now, we'll simulate a successful submission
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('Legal Request Data:', data);

    toast({
      title: "Solicitud Enviada",
      description: "Hemos recibido su requerimiento. Nuestro equipo legal se pondrá en contacto a la brevedad.",
    });
    setOpen(false);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
      <div className="grid gap-2">
        <Label htmlFor="officialName">Nombre Completo del Solicitante</Label>
        <Input id="officialName" {...register('officialName', { required: 'El nombre es requerido' })} className="input-glass" />
        {errors.officialName && <p className="text-red-500 text-sm">{errors.officialName.message}</p>}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="institution">Institución/Entidad</Label>
        <Input id="institution" {...register('institution', { required: 'La institución es requerida' })} className="input-glass" />
        {errors.institution && <p className="text-red-500 text-sm">{errors.institution.message}</p>}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="caseNumber">Número de Causa/Expediente</Label>
        <Input id="caseNumber" {...register('caseNumber', { required: 'El número de causa es requerido' })} className="input-glass" />
        {errors.caseNumber && <p className="text-red-500 text-sm">{errors.caseNumber.message}</p>}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="requestDetails">Detalles del Requerimiento</Label>
        <Textarea id="requestDetails" {...register('requestDetails', { required: 'Los detalles son requeridos' })} className="input-glass" />
        {errors.requestDetails && <p className="text-red-500 text-sm">{errors.requestDetails.message}</p>}
      </div>
      <Button type="submit" disabled={isSubmitting} className="w-full btn-action">
        {isSubmitting ? 'Enviando...' : 'Enviar Requerimiento'}
      </Button>
    </form>
  );
};

export default LegalRequestForm;