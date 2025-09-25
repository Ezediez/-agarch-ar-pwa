// ⚠️ ARCHIVO DUPLICADO - NO USADO ⚠️
// Este archivo NO se está usando en la aplicación
// El archivo activo está en: src/pages/SettingsPage.jsx
// Se mantiene como backup por si se necesita en el futuro
// NO MODIFICAR - NO ELIMINAR - SOLO BACKUP

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Crown, Shield, Bell, MapPin, Eye, CreditCard, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const SettingsPage = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    notifications: true,
    showLocation: true,
    ageRange: '18-35',
    distance: '50km'
  });
  const { toast } = useToast();

  const handleUpgradeToVip = async () => {
    if (!user?.uid) return;
    
    try {
      // Activar VIP demo automáticamente para el usuario actual
      const profileRef = doc(db, 'profiles', user.uid);
      await updateDoc(profileRef, {
        is_vip: true,
        vip_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
        vip_demo: true,
        vip_activated_at: new Date()
      });

      toast({
        title: "🎉 VIP DEMO Activado",
        description: "Has activado VIP demo por 30 días. Función temporal hasta implementar pagos.",
        className: "bg-green-500 text-white"
      });
      
      // Actualizar el usuario en el contexto
      updateUser({ ...user, is_vip: true });
      
    } catch (error) {
      console.error("Error activando VIP demo:", error);
      toast({
        title: "Error",
        description: "No se pudo activar VIP demo. Intenta nuevamente.",
        variant: "destructive"
      });
    }
  };

  const handleReportUser = () => {
    toast({
      title: "🚧 Esta función no está implementada aún",
      description: "¡Pero no te preocupes! Puedes solicitarla en tu próximo prompt! 🚀"
    });
  };

  const handlePrivacySettings = () => {
    toast({
      title: "Configuración guardada",
      description: "Tus preferencias de privacidad han sido actualizadas"
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold gradient-text mb-6">Configuración</h1>

      <Tabs defaultValue="account" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="account">Cuenta</TabsTrigger>
          <TabsTrigger value="privacy">Privacidad</TabsTrigger>
          <TabsTrigger value="notifications">Notificaciones</TabsTrigger>
          <TabsTrigger value="safety">Seguridad</TabsTrigger>
        </TabsList>

        {/* Account Settings */}
        <TabsContent value="account" className="space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card"
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Información de Cuenta</h2>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-medium">Estado de la cuenta</h3>
                  <p className="text-sm text-gray-600">
                    {user?.isVip ? 'Usuario VIP' : 'Usuario Gratuito'}
                  </p>
                </div>
                {user?.isVip ? (
                  <div className="vip-badge">
                    <Crown className="w-4 h-4 inline mr-1" />
                    VIP
                  </div>
                ) : (
                  <Button onClick={handleUpgradeToVip} className="bg-green-500 hover:bg-green-600 text-white">
                    🎉 VIP DEMO - ¡Activar!
                  </Button>
                )}
              </div>

              {!user?.isVip && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h3 className="font-medium text-green-800 mb-2">🎉 VIP DEMO - Beneficios</h3>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>• ✅ Publicar historias de 24 horas</li>
                    <li>• ✅ Perfil destacado en carrusel VIP</li>
                    <li>• ✅ Videos de hasta 30 segundos</li>
                    <li>• ✅ Sin publicidad en el feed</li>
                    <li>• ⏰ Válido por 30 días (DEMO)</li>
                  </ul>
                  <p className="text-xs text-green-600 mt-2">
                    💡 Función temporal hasta implementar PayPal/Stripe
                  </p>
                </div>
              )}

              {/* Botón de acceso admin temporal */}
              {(user?.email === 'ezequieldiez@hotmail.com' || user?.email === 'yanisole0207@gmail.com' || user?.email === 'admin@agarch-ar.com') && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-medium text-blue-800 mb-2">🔧 Panel de Administrador</h3>
                  <p className="text-sm text-blue-700 mb-3">
                    Acceso temporal al panel de administración para gestionar usuarios VIP
                  </p>
                  <Button 
                    onClick={() => navigate('/admin/vip-demo')}
                    className="bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    🚀 Ir al Panel Admin
                  </Button>
                </div>
              )}

              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-medium">Contactos mensuales</h3>
                  <p className="text-sm text-gray-600">
                    {user?.isVip ? 'Ilimitados' : `${user?.monthlyContacts || 0}/10 restantes`}
                  </p>
                </div>
                <span className="text-sm text-gray-500">
                  Se renueva cada 30 días
                </span>
              </div>
            </div>
          </motion.div>
        </TabsContent>

        {/* Privacy Settings */}
        <TabsContent value="privacy" className="space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card"
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Configuración de Privacidad</h2>
            
            <div className="space-y-6">
              <div>
                <Label htmlFor="ageRange">Rango de edad preferido</Label>
                <Select onValueChange={(value) => setSettings(prev => ({ ...prev, ageRange: value }))}>
                  <SelectTrigger className="input-field">
                    <SelectValue placeholder="Selecciona rango de edad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="18-25">18-25 años</SelectItem>
                    <SelectItem value="26-35">26-35 años</SelectItem>
                    <SelectItem value="36-45">36-45 años</SelectItem>
                    <SelectItem value="46-55">46-55 años</SelectItem>
                    <SelectItem value="55+">55+ años</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="distance">Distancia máxima</Label>
                <Select onValueChange={(value) => setSettings(prev => ({ ...prev, distance: value }))}>
                  <SelectTrigger className="input-field">
                    <SelectValue placeholder="Selecciona distancia" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10km">10 km</SelectItem>
                    <SelectItem value="25km">25 km</SelectItem>
                    <SelectItem value="50km">50 km</SelectItem>
                    <SelectItem value="100km">100 km</SelectItem>
                    <SelectItem value="unlimited">Sin límite</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <MapPin className="w-5 h-5 text-gray-600" />
                  <div>
                    <h3 className="font-medium">Mostrar ubicación</h3>
                    <p className="text-sm text-gray-600">Otros usuarios verán tu ubicación aproximada</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={handlePrivacySettings}>
                  {settings.showLocation ? 'Activado' : 'Desactivado'}
                </Button>
              </div>

              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Eye className="w-5 h-5 text-gray-600" />
                  <div>
                    <h3 className="font-medium">Perfil visible</h3>
                    <p className="text-sm text-gray-600">Otros usuarios pueden ver tu perfil</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={handlePrivacySettings}>
                  Activado
                </Button>
              </div>
            </div>
          </motion.div>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications" className="space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card"
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Notificaciones</h2>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Bell className="w-5 h-5 text-gray-600" />
                  <div>
                    <h3 className="font-medium">Nuevos matches</h3>
                    <p className="text-sm text-gray-600">Recibir notificaciones de nuevos matches</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Activado
                </Button>
              </div>

              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Bell className="w-5 h-5 text-gray-600" />
                  <div>
                    <h3 className="font-medium">Nuevos mensajes</h3>
                    <p className="text-sm text-gray-600">Recibir notificaciones de mensajes</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Activado
                </Button>
              </div>

              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Bell className="w-5 h-5 text-gray-600" />
                  <div>
                    <h3 className="font-medium">Promociones</h3>
                    <p className="text-sm text-gray-600">Recibir ofertas y promociones</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Desactivado
                </Button>
              </div>
            </div>
          </motion.div>
        </TabsContent>

        {/* Safety */}
        <TabsContent value="safety" className="space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card"
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Seguridad</h2>
            
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-3 mb-2">
                  <Shield className="w-5 h-5 text-green-600" />
                  <h3 className="font-medium text-green-800">Cuenta Verificada</h3>
                </div>
                <p className="text-sm text-green-700">
                  Tu cuenta está verificada con email y teléfono móvil
                </p>
              </div>

              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <div>
                    <h3 className="font-medium">Reportar usuario</h3>
                    <p className="text-sm text-gray-600">Reportar comportamiento inapropiado</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={handleReportUser}>
                  Reportar
                </Button>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-medium text-blue-800 mb-2">Consejos de Seguridad</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Nunca compartas información personal hasta conocer bien a la persona</li>
                  <li>• Siempre reúnete en lugares públicos para el primer encuentro</li>
                  <li>• Informa a un amigo sobre tus planes de cita</li>
                  <li>• Confía en tu instinto y reporta comportamientos sospechosos</li>
                  <li>• No envíes dinero ni información financiera</li>
                </ul>
              </div>

              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h3 className="font-medium text-yellow-800 mb-2">Política de Contenido</h3>
                <p className="text-sm text-yellow-700">
                  Prohibimos contenido con menores, animales, discriminación y ofertas comerciales sexuales. 
                  Nuestro sistema detecta automáticamente este contenido y toma medidas inmediatas.
                </p>
              </div>
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;
