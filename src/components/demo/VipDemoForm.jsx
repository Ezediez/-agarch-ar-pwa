import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { Crown, Star, Zap, Shield } from 'lucide-react';

const VipDemoForm = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [demoData, setDemoData] = useState({
    vip_duration: 30, // días
    premium_duration: 30, // días
    custom_message: 'Demo VIP activado'
  });

  const handleVipDemo = async (type) => {
    if (!user?.uid) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Usuario no autenticado'
      });
      return;
    }

    setLoading(true);
    try {
      const profileRef = doc(db, 'profiles', user.uid);
      const now = new Date();
      const expiresAt = new Date(now.getTime() + (demoData.vip_duration * 24 * 60 * 60 * 1000));

      if (type === 'vip') {
        await updateDoc(profileRef, {
          is_vip: true,
          vip_expires_at: expiresAt.toISOString(),
          vip_activated_at: now.toISOString(),
          vip_demo: true
        });

        toast({
          title: '🎉 VIP Demo Activado',
          description: `Has activado VIP demo por ${demoData.vip_duration} días`
        });
      } else if (type === 'premium') {
        await updateDoc(profileRef, {
          is_premium: true,
          premium_expires_at: expiresAt.toISOString(),
          premium_activated_at: now.toISOString(),
          premium_demo: true
        });

        toast({
          title: '⭐ Premium Demo Activado',
          description: `Has activado Premium demo por ${demoData.premium_duration} días`
        });
      }

      // Crear registro de suscripción
      const subscriptionData = {
        user_id: user.uid,
        type: type,
        status: 'active',
        activated_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
        is_demo: true,
        created_at: now.toISOString()
      };

      await setDoc(doc(db, 'subscriptions', `${user.uid}_${type}_demo`), subscriptionData);

    } catch (error) {
      console.error('Error activating demo:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo activar la demo'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetDemo = async () => {
    if (!user?.uid) return;

    setLoading(true);
    try {
      const profileRef = doc(db, 'profiles', user.uid);
      await updateDoc(profileRef, {
        is_vip: false,
        is_premium: false,
        vip_expires_at: null,
        premium_expires_at: null,
        vip_demo: false,
        premium_demo: false
      });

      toast({
        title: '🔄 Demo Reset',
        description: 'Todas las demos han sido desactivadas'
      });
    } catch (error) {
      console.error('Error resetting demo:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo resetear la demo'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="w-6 h-6 text-yellow-500" />
            Panel Demo VIP/Premium
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="vip" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="vip">VIP Demo</TabsTrigger>
              <TabsTrigger value="premium">Premium Demo</TabsTrigger>
            </TabsList>

            <TabsContent value="vip" className="space-y-4">
              <div className="flex items-center gap-2 p-4 bg-yellow-50 rounded-lg">
                <Crown className="w-8 h-8 text-yellow-500" />
                <div>
                  <h3 className="font-semibold text-yellow-800">VIP Demo</h3>
                  <p className="text-sm text-yellow-600">
                    Acceso completo a funciones premium por tiempo limitado
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="vip_duration">Duración (días)</Label>
                  <Input
                    id="vip_duration"
                    type="number"
                    value={demoData.vip_duration}
                    onChange={(e) => setDemoData(prev => ({
                      ...prev,
                      vip_duration: parseInt(e.target.value) || 30
                    }))}
                    min="1"
                    max="365"
                  />
                </div>

                <div>
                  <Label htmlFor="vip_message">Mensaje personalizado</Label>
                  <Input
                    id="vip_message"
                    value={demoData.custom_message}
                    onChange={(e) => setDemoData(prev => ({
                      ...prev,
                      custom_message: e.target.value
                    }))}
                    placeholder="Mensaje para el usuario VIP"
                  />
                </div>

                <Button
                  onClick={() => handleVipDemo('vip')}
                  disabled={loading}
                  className="w-full bg-yellow-500 hover:bg-yellow-600"
                >
                  <Crown className="w-4 h-4 mr-2" />
                  Activar VIP Demo
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="premium" className="space-y-4">
              <div className="flex items-center gap-2 p-4 bg-blue-50 rounded-lg">
                <Star className="w-8 h-8 text-blue-500" />
                <div>
                  <h3 className="font-semibold text-blue-800">Premium Demo</h3>
                  <p className="text-sm text-blue-600">
                    Funciones avanzadas y contenido exclusivo
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="premium_duration">Duración (días)</Label>
                  <Input
                    id="premium_duration"
                    type="number"
                    value={demoData.premium_duration}
                    onChange={(e) => setDemoData(prev => ({
                      ...prev,
                      premium_duration: parseInt(e.target.value) || 30
                    }))}
                    min="1"
                    max="365"
                  />
                </div>

                <div>
                  <Label htmlFor="premium_message">Mensaje personalizado</Label>
                  <Input
                    id="premium_message"
                    value={demoData.custom_message}
                    onChange={(e) => setDemoData(prev => ({
                      ...prev,
                      custom_message: e.target.value
                    }))}
                    placeholder="Mensaje para el usuario Premium"
                  />
                </div>

                <Button
                  onClick={() => handleVipDemo('premium')}
                  disabled={loading}
                  className="w-full bg-blue-500 hover:bg-blue-600"
                >
                  <Star className="w-4 h-4 mr-2" />
                  Activar Premium Demo
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-6 pt-6 border-t">
            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={handleResetDemo}
                disabled={loading}
                className="flex-1"
              >
                <Shield className="w-4 h-4 mr-2" />
                Resetear Todas las Demos
              </Button>
            </div>
          </div>

          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold mb-2">Estado Actual del Usuario:</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>VIP:</span>
                <span className={profile?.is_vip ? 'text-green-600 font-semibold' : 'text-gray-500'}>
                  {profile?.is_vip ? '✅ Activo' : '❌ Inactivo'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Premium:</span>
                <span className={profile?.is_premium ? 'text-blue-600 font-semibold' : 'text-gray-500'}>
                  {profile?.is_premium ? '✅ Activo' : '❌ Inactivo'}
                </span>
              </div>
              {profile?.vip_expires_at && (
                <div className="flex justify-between">
                  <span>VIP Expira:</span>
                  <span className="text-yellow-600">
                    {new Date(profile.vip_expires_at).toLocaleDateString()}
                  </span>
                </div>
              )}
              {profile?.premium_expires_at && (
                <div className="flex justify-between">
                  <span>Premium Expira:</span>
                  <span className="text-blue-600">
                    {new Date(profile.premium_expires_at).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VipDemoForm;
