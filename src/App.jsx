import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth.jsx';
import { useAutoLocationUpdate } from '@/hooks/useAutoLocationUpdate';
import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/LoginPage';
import MultiStepRegisterPage from '@/pages/MultiStepRegisterPage';
import MainApp from '@/components/MainApp';
import AuthLayout from '@/components/layouts/AuthLayout';
import PasswordRecoveryPage from '@/pages/PasswordRecoveryPage';
import UpdatePasswordPage from '@/pages/UpdatePasswordPage';
import ContactPage from '@/pages/ContactPage';
import { useToast } from '@/components/ui/use-toast.jsx';
import AdRegisterPage from '@/pages/AdRegisterPage';
import AdLoginPage from '@/pages/AdLoginPage';
import TermsPage from '@/pages/TermsPage';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminDashboardPage from '@/pages/admin/AdminDashboardPage';
import AdminUserManagementPage from '@/pages/admin/AdminUserManagementPage';
import AdminAdManagementPage from '@/pages/admin/AdminAdManagementPage';
import AdminRoute from '@/components/admin/AdminRoute';
import AdvertisingContactPage from '@/pages/AdvertisingContactPage';
import AdminLoginPage from '@/pages/admin/AdminLoginPage';
import CompleteProfilePage from '@/pages/CompleteProfilePage';

const App = () => {
  const { user, loading, profile } = useAuth();
  const location = useLocation();
  useAutoLocationUpdate(user);
  const { toast } = useToast();

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        toast({
          title: "¡Aplicación actualizada!",
          description: "La aplicación se ha actualizado a la última versión. Los cambios se aplicarán al recargar."
        });
      });
    }
  }, [toast]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="loading-spinner" />
      </div>
    );
  }

  const ProtectedRoutes = () => {
    if (!user) {
      return <Navigate to="/landing" state={{ from: location }} replace />;
    }
    if (!profile?.alias) {
      return <Navigate to="/complete-profile" replace />;
    }
    return <MainApp />;
  };

  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/landing" element={!user ? <LandingPage /> : <Navigate to="/" />} />
        <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/" />} />
        <Route path="/register" element={!user ? <MultiStepRegisterPage /> : <Navigate to="/" />} />
        <Route path="/recover-password" element={!user ? <PasswordRecoveryPage /> : <Navigate to="/" />} />
        <Route path="/update-password" element={<UpdatePasswordPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/advertising-contact" element={<AdvertisingContactPage />} />
        <Route path="/ad-register" element={<AdRegisterPage />} />
        <Route path="/ad-login" element={<AdLoginPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/admin-login" element={<AdminLoginPage />} />
      </Route>
      
      {user && !profile?.alias && (
         <Route path="/complete-profile" element={<CompleteProfilePage />} />
      )}

      <Route 
        path="/admin/*"
        element={
          <AdminRoute>
            <AdminLayout>
              <Routes>
                <Route path="/" element={<AdminDashboardPage />} />
                <Route path="users" element={<AdminUserManagementPage />} />
                <Route path="ads" element={<AdminAdManagementPage />} />
              </Routes>
            </AdminLayout>
          </AdminRoute>
        }
      />

      <Route path="/*" element={<ProtectedRoutes />} />
      
      <Route path="*" element={<Navigate to={user ? "/" : "/landing"} />} />
    </Routes>
  );
};

export default App;