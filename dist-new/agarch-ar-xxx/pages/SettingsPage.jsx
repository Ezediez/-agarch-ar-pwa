import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Crown, Shield, Bell, CreditCard, AlertTriangle, LogOut, Trash2, Vibrate, BellOff, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast.jsx';
import { useAuth } from '@/hooks/useAuth';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { db } from '@/lib/firebase'; // 🔥 Firebase client
import { doc, updateDoc } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import LocationSettings from '@/components/settings/LocationSettings';


const PayPalIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
    <path d="M7.72 4.28a.2.2 0 0 0-.18.32l2.35 12.33a.2.2 0 0 0 .2.16h2.86a.2.2 0 0 0 .2-.16L15.48 4.6a.2.2 0 0 0-.19-.32h-3.1a.2.2 0 0 1-.2-.16L9.64 2.3a.2.2 0 0 0-.2-.16H6.5a.2.2 0 0 0-.2.16L3.95 16.9a.2.2 0 0 0 .2.16h2.82a.2.2 0 0 0 .2-.16l.7-3.66h.1a.2.2 0 0 0 .2-.16l.29-1.5a.2.2 0 0 0-.2-.25h-2.1a.2.2 0 0 1-.2-.16l.94-4.88a.2.2 0 0 1 .2-.16h2.92a.2.2 0 0 1 .2.16L7.72 4.28z"/>
  </svg>
);

const SettingsPage = () => {
  const { profile, signOut, deleteAccount, refreshProfile, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [deleteInput, setDeleteInput] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      if (profile && !loading) {
        setNotificationSettings({
          notifications_new_like: profile.notifications_new_like ?? true,
          notifications_new_message: profile.notifications_new_message ?? true,
          notifications_promotions: profile.notifications_promotions ?? true,
          notification_sound: profile.notification_sound || 'sound',
        });
        setError(null);
      }
    } catch (err) {
      console.error('Error loading settings:', err);
      setError('Error al cargar la configuración');
    }
  }, [profile, loading]);

  // Mostrar loading mientras se carga el perfil
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="loading-spinner" />
      </div>
    );
  }

  // Mostrar error si no hay perfil
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Error al cargar configuración</h2>
          <p className="text-gray-400 mb-4">No se pudo cargar tu perfil</p>
          <Button onClick={() => window.location.reload()} className="btn-action">
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  const handleFeatureClick = async () => {
    if (!profile?.uid) return;
    
    try {
      // Activar VIP demo automáticamente para el usuario actual
      const profileRef = doc(db, 'profiles', profile.uid);
      await updateDoc(profileRef, {
        is_vip: true,
        vip_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
        vip_demo: true,
        vip_activated_at: new Date()
      });

      toast({
        title: "🎉 VIP DEMO Activado",
        description: "Has activado VIP demo por 30 días. Función temporal hasta implementar PayPal/Stripe.",
        className: "bg-green-500 text-white"
      });
      
      // Refrescar el perfil para mostrar cambios
      await refreshProfile();
      
    } catch (error) {
      console.error("Error activando VIP demo:", error);
      toast({
        title: "Error",
        description: "No se pudo activar VIP demo. Intenta nuevamente.",
        variant: "destructive"
      });
    }
  };

  const handleVerificationRequest = async () => {
    try {
      // Simular proceso de verificación - redireccionar a página de verificación
      toast({
        title: "Proceso de Verificación",
        description: "Serás redirigido al proceso de verificación. Costo: $1 USD",
      });
      
      // Aquí puedes agregar la lógica para ir a la página de verificación
      // navigate('/verification-process');
      
      // Por ahora, mostrar mensaje informativo
      setTimeout(() => {
        toast({
          title: "Información",
          description: "El proceso de verificación incluye validación de identidad por $1 USD vía PayPal.",
        });
      }, 2000);
      
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo iniciar el proceso de verificación.",
      });
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteInput.toLowerCase() !== 'eliminar') {
      toast({
        variant: "destructive",
        title: "Confirmación incorrecta",
        description: "Por favor, escribe 'eliminar' para confirmar.",
      });
      return;
    }
    setDeleteLoading(true);
    try {
      await deleteAccount();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo eliminar la cuenta. Intenta de nuevo.",
      });
    } finally {
      setDeleteLoading(false);
    }
  };
  
  const handleSaveSettings = async (settingsData) => {
    setSaving(true);
    try {
      const profileRef = doc(db, 'profiles', profile.id);
      await updateDoc(profileRef, settingsData);
      
      toast({ title: "¡Éxito!", description: "Tus ajustes se han guardado." });
      await refreshProfile();
      setSaving(false);
      return true;
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Error inesperado al guardar configuración." });
      setSaving(false);
      return false;
    }
  };

  return (
    <>
      <Helmet>
        <title>Ajustes - AGARCH-AR</title>
        <meta name="description" content="Gestiona tu cuenta, privacidad y notificaciones en AGARCH-AR." />
      </Helmet>
      <div className="max-w-4xl mx-auto space-y-8 text-white">
        <h1 className="text-3xl font-bold text-primary">Ajustes</h1>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-glass"
        >
          <h2 className="text-2xl font-bold mb-4 text-primary">Cuenta</h2>
          <div className="space-y-4">
            <SettingsItem
              icon={<Crown className="text-yellow-400" />}
              title="Membresía"
              description={profile?.is_vip ? 'Eres un miembro VIP' : 'Membresía Gratuita'}
            >
              {!profile?.is_vip && (
                 <Button 
                  onClick={handleFeatureClick} 
                  className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  🎉 VIP DEMO - ¡Activar!
                </Button>
              )}
            </SettingsItem>

            {/* Botón de acceso admin para emails autorizados */}
            {(profile?.email === 'ezequieldiez@hotmail.com' || profile?.email === 'yanisole0207@gmail.com' || profile?.email === 'admin@agarch-ar.com') && (
              <SettingsItem
                icon={<Crown className="text-blue-400" />}
                title="Panel de Administrador"
                description="Acceso temporal al panel de administración"
              >
                <Button 
                  onClick={() => navigate('/admin/vip-demo')}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  🚀 Ir al Panel Admin
                </Button>
              </SettingsItem>
            )}

            <SettingsItem
              icon={<Shield className="text-green-400" />}
              title="Verificación"
              description={profile?.is_verified ? 'Tu cuenta ha sido verificada.' : 'Cuenta no verificada.'}
            >
              {!profile?.is_verified && (
                <Button 
                  onClick={handleVerificationRequest} 
                  className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg font-medium"
                >
                  Verificar Cuenta
                </Button>
              )}
            </SettingsItem>
            <SettingsItem
              icon={<CreditCard className="text-blue-400" />}
              title="Pagos y Suscripciones"
              description="Gestiona tus pagos con PayPal."
            >
              <Button onClick={() => navigate('/payments')} variant="outline" className="btn-outline-action">
                Gestionar
              </Button>
            </SettingsItem>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card-glass"
        >
          <h2 className="text-2xl font-bold mb-4 text-primary">Privacidad y Seguridad</h2>
          <div className="space-y-4">
            <SettingsItem
              icon={<Bell className="text-orange-400" />}
              title="Notificaciones"
              description="Elige qué y cómo recibir notificaciones."
            >
              <Dialog>
                <DialogTrigger asChild>
                   <Button variant="default" className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg font-medium">
                     Configurar
                   </Button>
                </DialogTrigger>
               <DialogContent className="card-glass bg-surface">
                <DialogHeader>
                  <DialogTitle className="text-primary">Notificaciones</DialogTitle>
                  <DialogDescription>
                    Gestiona las alertas que recibes.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-6">
                    <div>
                      <Label className="text-base font-medium text-text-primary">Alertas</Label>
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center space-x-2">
                            <Checkbox id="notif-like" checked={notificationSettings.notifications_new_like} onCheckedChange={(checked) => setNotificationSettings(prev => ({...prev, notifications_new_like: checked}))}/>
                            <Label htmlFor="notif-like">Nuevos Me Gusta</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="notif-message" checked={notificationSettings.notifications_new_message} onCheckedChange={(checked) => setNotificationSettings(prev => ({...prev, notifications_new_message: checked}))}/>
                            <Label htmlFor="notif-message">Nuevos Mensajes</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="notif-promo" checked={notificationSettings.notifications_promotions} onCheckedChange={(checked) => setNotificationSettings(prev => ({...prev, notifications_promotions: checked}))}/>
                            <Label htmlFor="notif-promo">Ofertas y Promociones</Label>
                        </div>
                      </div>
                    </div>
                     <div>
                      <Label className="text-base font-medium text-text-primary">Modo de alerta</Label>
                       <div className="mt-2 grid grid-cols-3 gap-2">
                          <button
                            onClick={() => setNotificationSettings(prev => ({...prev, notification_sound: 'sound'}))}
                            className={cn('flex flex-col items-center p-2 rounded-lg border-2', notificationSettings.notification_sound === 'sound' ? 'border-primary bg-primary/20' : 'border-border-color hover:bg-surface/80')}
                          >
                            <Volume2/> <span className="text-sm mt-1">Sonido</span>
                          </button>
                           <button
                             onClick={() => setNotificationSettings(prev => ({...prev, notification_sound: 'vibrate'}))}
                            className={cn('flex flex-col items-center p-2 rounded-lg border-2', notificationSettings.notification_sound === 'vibrate' ? 'border-primary bg-primary/20' : 'border-border-color hover:bg-surface/80')}
                          >
                            <Vibrate/> <span className="text-sm mt-1">Vibración</span>
                          </button>
                           <button
                             onClick={() => setNotificationSettings(prev => ({...prev, notification_sound: 'silent'}))}
                            className={cn('flex flex-col items-center p-2 rounded-lg border-2', notificationSettings.notification_sound === 'silent' ? 'border-primary bg-primary/20' : 'border-border-color hover:bg-surface/80')}
                          >
                            <BellOff/> <span className="text-sm mt-1">Silencio</span>
                          </button>
                       </div>
                    </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild><Button type="button" variant="secondary" className="btn-secondary-action">Cancelar</Button></DialogClose>
                  <DialogClose asChild>
                    <Button onClick={() => handleSaveSettings(notificationSettings)} disabled={saving} className="btn-action">
                      {saving ? 'Guardando...' : 'Guardar'}
                    </Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
              </Dialog>
            </SettingsItem>
            <SettingsItem
              icon={<AlertTriangle className="text-brand-red" />}
              title="Denuncia, o reporta un problema"
              description="Ayúdanos a mantener la comunidad segura."
            >
              <Button onClick={() => navigate('/contact')} variant="outline" className="btn-outline-action border-brand-red text-brand-red hover:bg-brand-red/10">
                Reportar
              </Button>
            </SettingsItem>
          </div>
        </motion.div>

        <LocationSettings />
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card-glass"
        >
           <h2 className="text-2xl font-bold mb-4 text-primary">Acciones de la Cuenta</h2>
           <div className="space-y-4">
             <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="w-full justify-between btn-outline-action">
                    <span>Cerrar Sesión</span>
                    <LogOut className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="card-glass bg-surface">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-primary">¿Estás seguro?</AlertDialogTitle>
                    <AlertDialogDescription className="text-text-secondary">
                      Podrás volver a iniciar sesión en cualquier momento.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="btn-secondary-action">Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={signOut} className="btn-action">Cerrar Sesión</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full justify-between">
                    <span>Eliminar mi Cuenta</span>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="card-glass bg-surface">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-destructive">¿Estás absolutamente seguro?</AlertDialogTitle>
                    <AlertDialogDescription className="text-text-secondary">
                      Esta acción es irreversible. Todos tus datos, perfil, fotos y publicaciones serán eliminados permanentemente. Esta información no se podrá recuperar.
                      <br/><br/>
                      Para confirmar, escribe <strong>eliminar</strong> a continuación:
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <Input
                    type="text"
                    value={deleteInput}
                    onChange={(e) => setDeleteInput(e.target.value)}
                    placeholder="eliminar"
                    className="input-glass bg-surface/50 my-4"
                  />
                  <AlertDialogFooter>
                    <AlertDialogCancel className="btn-secondary-action" onClick={() => setDeleteInput('')}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleDeleteAccount} 
                      disabled={deleteInput.toLowerCase() !== 'eliminar' || deleteLoading}
                      className="bg-destructive hover:bg-red-700"
                    >
                       {deleteLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Eliminando...
                        </>
                      ) : (
                        'Sí, eliminar mi cuenta'
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
           </div>
        </motion.div>
      </div>
    </>
  );
};

const SettingsItem = ({ icon, title, description, children }) => (
  <div className="flex items-center justify-between p-4 bg-surface/50 rounded-lg">
    <div className="flex items-center space-x-4">
      {icon}
      <div>
        <h3 className="font-semibold">{title}</h3>
        <p className="text-sm text-text-secondary">{description}</p>
      </div>
    </div>
    {children}
  </div>
);

export default SettingsPage;
