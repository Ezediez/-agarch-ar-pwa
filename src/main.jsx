import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import App from '@/App';
import '@/index.css';
// 🔥 Registrar Service Worker optimizado para Firebase - TEMPORALMENTE DESHABILITADO
// import './register-sw.js';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/hooks/useAuth.jsx';
import { HelmetProvider } from 'react-helmet-async';
import { ToastProvider } from '@/components/ui/use-toast.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider>
      <Router>
        <ToastProvider>
          <AuthProvider>
            <App />
            <Toaster />
          </AuthProvider>
        </ToastProvider>
      </Router>
    </HelmetProvider>
  </React.StrictMode>
);

// Build timestamp: 2025-09-20 21:20:00 - Force Netlify detection