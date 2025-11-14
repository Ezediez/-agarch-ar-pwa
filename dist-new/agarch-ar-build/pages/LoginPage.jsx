import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { Heart } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    if (!error) {
       navigate('/');
    }
    setLoading(false);
  };

  return (
    <>
      <Helmet>
        <title>Iniciar Sesión - AGARCH-AR</title>
      </Helmet>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md space-y-8"
      >
        <div className="text-center">
          <Heart className="mx-auto h-12 w-12 text-brand-red" />
          <h2 className="mt-6 text-3xl font-extrabold text-text-primary">
            ¡Bienvenido de vuelta!
          </h2>
          <p className="mt-2 text-sm text-text-secondary">
            Ingresa para continuar la diversión.
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <Label htmlFor="email-address" className="sr-only">Email</Label>
              <Input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="input-glass rounded-b-none"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="input-glass rounded-t-none"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
          
           <div className="flex items-center justify-end">
              <div className="text-sm">
                <Link to="/recover-password" className="font-medium text-primary hover:text-green-400">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
            </div>

          <div>
            <Button type="submit" className="w-full btn-action" disabled={loading}>
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Iniciando sesión...
                </>
              ) : 'Iniciar Sesión'}
            </Button>
          </div>
        </form>
        <p className="mt-2 text-center text-sm text-text-secondary">
          ¿No tienes una cuenta?{' '}
          <Link to="/register" className="font-medium text-primary hover:text-green-400">
            Regístrate
          </Link>
        </p>
      </motion.div>
    </>
  );
};

export default LoginPage;
