import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';

const AdminLoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await signIn(email, password);

    if (error || !data.user) {
      toast({
        variant: 'destructive',
        title: 'Error de acceso',
        description: 'Credenciales incorrectas o no tienes permiso de administrador.',
      });
      setLoading(false);
      return;
    }

    // After sign-in, the useAuth hook will update the profile.
    // We need to check the role from the fetched profile.
    // The profile might not be immediately available, so we check on the next render.
  };

  React.useEffect(() => {
    if (profile) {
      if (profile.role === 'admin') {
        toast({
          title: '¡Bienvenido, Admin!',
          description: 'Has iniciado sesión correctamente.',
          className: "bg-primary text-background"
        });
        navigate('/admin');
      } else {
        toast({
          variant: 'destructive',
          title: 'Acceso Denegado',
          description: 'No tienes permisos para acceder a esta sección.',
        });
         // logout the user if they are not an admin
      }
      setLoading(false);
    }
  }, [profile, navigate, toast]);


  return (
    <>
      <Helmet>
        <title>Login de Administrador - AGARCH-AR</title>
      </Helmet>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center min-h-screen bg-background p-4"
      >
        <div className="w-full max-w-md card-glass p-8 rounded-lg shadow-lg">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary">Acceso de Administrador</h1>
            <p className="text-text-secondary mt-2">Introduce tus credenciales para continuar</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@agarch-ar.com"
                required
                className="input-glass mt-1"
              />
            </div>
            <div>
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="input-glass mt-1"
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full btn-action">
              {loading ? 'Ingresando...' : 'Ingresar al Panel'}
            </Button>
          </form>
        </div>
      </motion.div>
    </>
  );
};

export default AdminLoginPage;
