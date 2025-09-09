import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Heart, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const LoginPage = ({ onLogin, onBackToLanding }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await signIn(formData.email, formData.password);
      
      if (error) {
        toast({
          title: "Error de autenticación",
          description: error.message,
          variant: "destructive"
        });
      } else if (data?.user) {
        toast({
          title: "¡Bienvenido!",
          description: "Has iniciado sesión exitosamente"
        });
        
        // Si hay callback onLogin, lo llamamos
        if (onLogin) {
          onLogin(data.user);
        } else {
          // Si no hay callback, navegamos a la página principal
          navigate('/');
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Error inesperado",
        description: "Ocurrió un problema al iniciar sesión",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Iniciar Sesión - ConectaAmor</title>
        <meta name="description" content="Inicia sesión en ConectaAmor y conecta con personas increíbles cerca de ti." />
      </Helmet>

      <div className="min-h-screen hero-pattern flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="card">
            <div className="text-center mb-8">
              <div className="flex justify-center items-center mb-4">
                <Heart className="w-12 h-12 text-orange-500" />
              </div>
              <h1 className="text-3xl font-bold gradient-text mb-2">Bienvenido de vuelta</h1>
              <p className="text-gray-600">Inicia sesión para continuar conectando</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="input-field"
                  placeholder="tu@email.com"
                  required
                />
              </div>

              <div>
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="input-field pr-12"
                    placeholder="Tu contraseña"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <Button
                  type="submit"
                  className="btn-primary w-full"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="loading-spinner w-5 h-5" />
                  ) : (
                    'Iniciar Sesión'
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={onBackToLanding}
                >
                  Volver al inicio
                </Button>
              </div>
            </form>

            <div className="mt-6 text-center">
              <button 
                className="text-orange-500 hover:text-orange-600 font-medium"
                onClick={() => navigate('/recover-password')}
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default LoginPage;
