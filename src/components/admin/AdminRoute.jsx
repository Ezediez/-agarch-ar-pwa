import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const AdminRoute = ({ children }) => {
  const { profile, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="loading-spinner" />
      </div>
    );
  }

  // Lista de emails autorizados como admin
  const adminEmails = [
    'ezequieldiez@hotmail.com',
    'yanisole0207@gmail.com',
    'admin@agarch-ar.com'
  ];

  if (!user || (profile?.role !== 'admin' && !adminEmails.includes(user.email))) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default AdminRoute;
