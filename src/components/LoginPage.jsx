import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Heart, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { getUsers } from '@/utils/storage';

const LoginPage = ({ onLogin, onBackToLanding }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Simular delay de autenticación
    setTimeout(() => {
      const users = getUsers();
      const user = users.find(u => u.email === formData.email && u.password === formData.password);

      if (user) {
        if (!user.isVerified) {
          toast({
            title: "Cuenta no verificada",
            description: "Por favor verifica tu cuenta con el token enviado a tu email y móvil",
            variant: "destructive"
          });
        } else {
          toast({
            title: "¡Bienvenido!",
            description: `Hola ${user.firstName}, es genial tenerte de vuelta`
          });
          onLogin(user);
        }
      } else {
        toast({
          title: "Error de autenticación",
          description: "Email o contraseña incorrectos",
          variant: "destructive"
        });
      }
      setLoading(false);
    }, 1500);
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
                onClick={() => {
                  toast({
                    title: "🚧 Esta función no está implementada aún",
                    description: "¡Pero no te preocupes! Puedes solicitarla en tu próximo prompt! 🚀"
                  });
                }}
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