import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast.jsx';
import { supabase } from '@/lib/customSupabaseClient';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, X, FileImage } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

const ContactPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: user?.email || '',
    reported_profile_alias: '',
    subject: '',
    message: '',
  });
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const MAX_MESSAGE_LENGTH = 200;

  const handleFileChange = (e) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      if (files.length + newFiles.length > 2) {
        toast({
          variant: "destructive",
          title: "Límite de archivos excedido",
          description: "Puedes subir un máximo de 2 imágenes.",
        });
        return;
      }
      setFiles((prevFiles) => [...prevFiles, ...newFiles]);
    }
  };

  const removeFile = (index) => {
    setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
  };

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

    if (!formData.subject || !formData.message) {
      toast({
        variant: "destructive",
        title: "Campos incompletos",
        description: "Por favor, rellena el asunto y el mensaje.",
      });
      setLoading(false);
      return;
    }

    let imageUrls = [];
    if (files.length > 0) {
      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${uuidv4()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('report_images')
          .upload(filePath, file);

        if (uploadError) {
          toast({ variant: "destructive", title: "Error al subir imagen", description: `No se pudo subir ${file.name}.` });
          setLoading(false);
          return;
        }

        const { data: urlData } = supabase.storage.from('report_images').getPublicUrl(filePath);
        imageUrls.push(urlData.publicUrl);
      }
    }

    const { error } = await supabase.from('reports').insert({
      user_id: user?.id,
      email: formData.email,
      reported_profile_alias: formData.reported_profile_alias,
      subject: formData.subject,
      message: formData.message,
      image_urls: imageUrls,
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
        description: "Gracias por tu reporte. Lo revisaremos pronto.",
        className: "bg-primary text-background"
      });
      navigate(user ? '/settings' : '/');
    }

    setLoading(false);
  };

  return (
    <>
      <Helmet>
        <title>Contacto y Denuncias - AGARCH-AR</title>
        <meta name="description" content="Reporta un problema o contacta con el soporte de AGARCH-AR." />
      </Helmet>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto card-glass p-6 sm:p-8"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-primary">Denuncia o Reporta un Problema</h1>
          <p className="text-text-secondary mt-2">
            Tu seguridad es nuestra prioridad. Usa este formulario para reportar cualquier inconveniente.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="email" className="text-primary">Tu Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="tu@email.com"
              required
              disabled={!!user}
              className="input-glass mt-1"
            />
          </div>
          <div>
            <Label htmlFor="reported_profile_alias" className="text-primary">Nombre o alias del perfil denunciado</Label>
            <Input
              id="reported_profile_alias"
              type="text"
              value={formData.reported_profile_alias}
              onChange={handleChange}
              placeholder="Ej: aliasdelperfil"
              className="input-glass mt-1"
            />
          </div>
          <div>
            <Label htmlFor="subject" className="text-primary">Asunto</Label>
            <Input
              id="subject"
              type="text"
              value={formData.subject}
              onChange={handleChange}
              placeholder="Ej: Reporte de perfil inapropiado"
              required
              className="input-glass mt-1"
            />
          </div>
          <div>
            <Label htmlFor="message" className="text-primary">Mensaje</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={handleChange}
              placeholder="Describe el problema en detalle. Incluye nombres de usuario o cualquier dato relevante."
              required
              className="input-glass mt-1"
              rows={6}
              maxLength={MAX_MESSAGE_LENGTH}
            />
            <p className="text-xs text-text-secondary text-right mt-1">
              {formData.message.length}/{MAX_MESSAGE_LENGTH}
            </p>
          </div>
          <div>
            <Label className="text-primary">Adjuntar capturas (máx. 2)</Label>
            <div className="mt-2 flex justify-center rounded-lg border border-dashed border-border-color px-6 py-10 input-glass">
              <div className="text-center">
                <UploadCloud className="mx-auto h-12 w-12 text-text-secondary" aria-hidden="true" />
                <div className="mt-4 flex text-sm leading-6 text-text-secondary">
                  <label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-semibold text-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 hover:text-primary/80">
                    <span>Sube tus archivos</span>
                    <input id="file-upload" name="file-upload" type="file" className="sr-only" multiple accept="image/*" onChange={handleFileChange} disabled={files.length >= 2} />
                  </label>
                  <p className="pl-1">o arrástralos aquí</p>
                </div>
                <p className="text-xs leading-5 text-text-secondary">PNG, JPG, GIF hasta 10MB</p>
              </div>
            </div>
            {files.length > 0 && (
              <div className="mt-4 space-y-2">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 rounded-md bg-surface/50">
                    <div className="flex items-center space-x-2">
                       <FileImage className="h-5 w-5 text-text-secondary"/>
                       <span className="text-sm text-text-primary truncate">{file.name}</span>
                    </div>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeFile(index)} className="text-text-secondary hover:text-destructive">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <Button type="submit" disabled={loading} className="w-full btn-action">
            {loading ? 'Enviando...' : 'Enviar Reporte'}
          </Button>
        </form>
      </motion.div>
    </>
  );
};

export default ContactPage;