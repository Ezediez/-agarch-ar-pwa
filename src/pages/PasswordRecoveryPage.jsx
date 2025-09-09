import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { db, auth, storage } from '@/lib/firebase'; // 🔥 Firebase client
import { ArrowLeft, Mail } from 'lucide-react';

const PasswordRecoveryPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handlePasswordRecovery = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const redirectTo = `${window.location.origin}/update-password`;

    const { error } = await db.auth.resetPasswordForEmail(email, {
      redirectTo: redirectTo,
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } else {
      toast({
        title: "Correo enviado",
        description: "Revisa tu bandeja de entrada para restablecer tu contraseña.",
        className: "bg-primary text-background"
      });
    }

    setLoading(false);
  };

  return (
    <>
      <Helmet>
        <title>Recuperar Cuenta - AGARCH-AR</title>
        <meta name="description" content="Recupera el acceso a tu cuenta de AGARCH-AR." />
      </Helmet>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md space-y-8"
      >
        <div className="text-center">
          <Mail className="mx-auto h-12 w-12 text-primary" />
          <h2 className="mt-6 text-3xl font-extrabold text-text-primary">
            ¿Olvidaste tu contraseña?
          </h2>
          <p className="mt-2 text-sm text-text-secondary">
            No te preocupes. Ingresa tu email y te enviaremos un enlace para que la recuperes.
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handlePasswordRecovery}>
          <div>
            <Label htmlFor="email" className="sr-only">Correo electrónico</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="input-glass"
              placeholder="Correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <Button type="submit" className="w-full btn-action" disabled={loading}>
              {loading ? (
                 <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Enviando...
                 </>
              ) : 'Enviar enlace de recuperación'}
            </Button>
          </div>
        </form>
         <div className="text-sm text-center">
            <Link to="/login" className="font-medium text-primary hover:text-green-400 flex items-center justify-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Volver a Iniciar Sesión
            </Link>
        </div>
      </motion.div>
    </>
  );
};

export default PasswordRecoveryPage;
