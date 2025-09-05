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
    try {
      // Formatear datos para envío por email
      const emailBody = `
REQUERIMIENTO LEGAL - AGARCH-AR

Nombre del Solicitante: ${data.officialName}
Email de Contacto: ${data.email}
Institución/Entidad: ${data.institution}
Número de Causa/Expediente: ${data.caseNumber}

Detalles del Requerimiento:
${data.requestDetails}

---
Solicitud generada automáticamente desde AGARCH-AR
Fecha: ${new Date().toLocaleString()}
      `.trim();

      // Crear enlace mailto para legales@agarch-ar.com
      const mailtoLink = `mailto:legales@agarch-ar.com?subject=Requerimiento Legal - Caso ${data.caseNumber}&body=${encodeURIComponent(emailBody)}`;
      
      // Abrir cliente de correo
      window.location.href = mailtoLink;
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Solicitud Preparada",
        description: "Se ha abierto su cliente de correo. El requerimiento se enviará a legales@agarch-ar.com",
      });
      setOpen(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo procesar el requerimiento. Intente nuevamente.",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
      <div className="grid gap-2">
        <Label htmlFor="officialName">Nombre Completo del Solicitante</Label>
        <Input id="officialName" {...register('officialName', { required: 'El nombre es requerido' })} className="input-glass" />
        {errors.officialName && <p className="text-red-500 text-sm">{errors.officialName.message}</p>}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="email">Email del Consultante</Label>
        <Input 
          id="email" 
          type="email"
          {...register('email', { 
            required: 'El email es requerido',
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: 'Email inválido'
            }
          })} 
          className="input-glass" 
          placeholder="consulta@institucion.gov"
        />
        {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
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