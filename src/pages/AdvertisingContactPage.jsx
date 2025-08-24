import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast.jsx';
import { supabase } from '@/lib/customSupabaseClient';
import { useNavigate } from 'react-router-dom';

const AdvertisingContactPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const MAX_MESSAGE_LENGTH = 500;

  const handleChange = (e) => {
    const { id, value } = e.target;
    if (id === "message" && value.length > MAX_MESSAGE_LENGTH) {
      return;
    }
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!formData.name || !formData.email || !formData.message) {
      toast({
        variant: "destructive",
        title: "Campos incompletos",
        description: "Por favor, rellena todos los campos obligatorios.",
      });
      setLoading(false);
      return;
    }

    const { error } = await supabase.from('emails').insert({
      user_id: null, // No user associated with this contact form
      recipient: 'advertising@agarch-ar.com', // Fixed recipient for advertising inquiries
      subject: `Consulta de Publicidad de ${formData.name} (${formData.company || 'N/A'})`,
      content: `Nombre: ${formData.name}\nEmail: ${formData.email}\nEmpresa: ${formData.company || 'N/A'}\nMensaje:\n${formData.message}`,
      status: 'pending',
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error al enviar",
        description: "No se pudo enviar tu mensaje. Inténtalo de nuevo.",
      });
    } else {
      toast({
        title: "Mensaje Enviado",
        description: "Gracias por tu interés en publicitar. Nos pondremos en contacto contigo pronto.",
        className: "bg-primary text-background"
      });
      setFormData({ name: '', email: '', company: '', message: '' }); // Clear form
      navigate('/landing'); // Redirect back to landing page
    }

    setLoading(false);
  };

  return (
    <>
      <Helmet>
        <title>Publicidad - AGARCH-AR</title>
        <meta name="description" content="Contacta con AGARCH-AR para oportunidades de publicidad." />
      </Helmet>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto card-glass p-6 sm:p-8"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-primary">Publicita con Nosotros</h1>
          <p className="text-text-secondary mt-2">
            ¿Interesado en llegar a nuestra comunidad? Completa el formulario y nos pondremos en contacto.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="name" className="text-primary">Tu Nombre</Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              placeholder="Tu Nombre Completo"
              required
              className="input-glass mt-1"
            />
          </div>
          <div>
            <Label htmlFor="email" className="text-primary">Tu Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="tu@email.com"
              required
              className="input-glass mt-1"
            />
          </div>
          <div>
            <Label htmlFor="company" className="text-primary">Empresa (Opcional)</Label>
            <Input
              id="company"
              type="text"
              value={formData.company}
              onChange={handleChange}
              placeholder="Nombre de tu empresa"
              className="input-glass mt-1"
            />
          </div>
          <div>
            <Label htmlFor="message" className="text-primary">Mensaje</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={handleChange}
              placeholder="Describe tu propuesta o consulta de publicidad."
              required
              className="input-glass mt-1"
              rows={6}
              maxLength={MAX_MESSAGE_LENGTH}
            />
            <p className="text-xs text-text-secondary text-right mt-1">
              {formData.message.length}/{MAX_MESSAGE_LENGTH}
            </p>
          </div>
          <Button type="submit" disabled={loading} className="w-full btn-action">
            {loading ? 'Enviando...' : 'Enviar Consulta'}
          </Button>
        </form>
      </motion.div>
    </>
  );
};

export default AdvertisingContactPage;