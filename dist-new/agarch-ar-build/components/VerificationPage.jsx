import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Shield, Mail, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { getUsers, saveUser } from '@/utils/storage';

const VerificationPage = ({ user, onVerificationSuccess }) => {
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleVerification = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Simular verificación
    setTimeout(() => {
      if (verificationCode === user.verificationToken) {
        const users = getUsers();
        const updatedUser = { ...user, isVerified: true };
        const userIndex = users.findIndex(u => u.email === user.email);
        
        if (userIndex >= 0) {
          users[userIndex] = updatedUser;
          localStorage.setItem('dating_app_users', JSON.stringify(users));
        }

        toast({
          title: "¡Verificación exitosa!",
          description: "Tu cuenta ha sido verificada. Ya puedes usar ConectaAmor"
        });

        onVerificationSuccess(updatedUser);
      } else {
        toast({
          title: "Código incorrecto",
          description: "El código de verificación no es válido. Inténtalo de nuevo.",
          variant: "destructive"
        });
      }
      setLoading(false);
    }, 1500);
  };

  const resendCode = () => {
    toast({
      title: "Código reenviado",
      description: `Nuevo código enviado a ${user.email} y ${user.phone}`
    });
  };

  return (
    <>
      <Helmet>
        <title>Verificar Cuenta - ConectaAmor</title>
        <meta name="description" content="Verifica tu cuenta de ConectaAmor para comenzar a conectar de forma segura." />
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
                <Shield className="w-16 h-16 text-green-500" />
              </div>
              <h1 className="text-3xl font-bold gradient-text mb-2">Verificar Cuenta</h1>
              <p className="text-gray-600 mb-4">
                Hemos enviado un código de verificación a:
              </p>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-center space-x-2 text-gray-700">
                  <Mail className="w-4 h-4" />
                  <span>{user.email}</span>
                </div>
                <div className="flex items-center justify-center space-x-2 text-gray-700">
                  <Smartphone className="w-4 h-4" />
                  <span>{user.phone}</span>
                </div>
              </div>
            </div>

            <form onSubmit={handleVerification} className="space-y-6">
              <div>
                <Label htmlFor="code">Código de Verificación</Label>
                <Input
                  id="code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  className="input-field text-center text-lg tracking-widest"
                  placeholder="Ingresa el código"
                  maxLength={9}
                  required
                />
                <p className="text-xs text-gray-500 mt-1 text-center">
                  Código de prueba: {user.verificationToken}
                </p>
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
                    'Verificar Cuenta'
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={resendCode}
                >
                  Reenviar Código
                </Button>
              </div>
            </form>

            <div className="mt-6 text-center text-sm text-gray-600">
              <p>¿No recibiste el código? Revisa tu carpeta de spam o solicita uno nuevo.</p>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default VerificationPage;
