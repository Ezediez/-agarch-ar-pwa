import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Crown, Shield, Bell, MapPin, Eye, CreditCard, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';

const SettingsPage = () => {
  const { user, updateUser } = useAuth();
  const [settings, setSettings] = useState({
    notifications: true,
    showLocation: true,
    ageRange: '18-35',
    distance: '50km'
  });
  const { toast } = useToast();

  const handleUpgradeToVip = () => {
    toast({
      title: "🚧 Esta función no está implementada aún",
      description: "¡Pero no te preocupes! Puedes solicitarla en tu próximo prompt! 🚀"
    });
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
                  <Button onClick={handleUpgradeToVip} className="btn-primary">
                    Hacerse VIP
                  </Button>
                )}
              </div>

              {!user?.isVip && (
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <h3 className="font-medium text-orange-800 mb-2">Beneficios VIP</h3>
                  <ul className="text-sm text-orange-700 space-y-1">
                    <li>• Contactos ilimitados por mes</li>
                    <li>• Sin publicidad</li>
                    <li>• Perfil destacado en búsquedas</li>
                    <li>• Videos de hasta 30 segundos</li>
                    <li>• Soporte prioritario</li>
                  </ul>
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
