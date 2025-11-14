import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const LandingFooter = () => {
  const { user, profile } = useAuth();
  const isAdmin = user && profile?.role === 'admin';

  return (
    <footer className="bg-surface py-8 px-4">
      <div className="container mx-auto text-center text-text-secondary">
        <div className="flex justify-center items-center space-x-4 mb-4">
          <Link to="/contact" className="hover:text-primary transition-colors">Contacto</Link>
          <Link to="/advertising-contact" className="hover:text-primary transition-colors">Publicidad</Link>
          <Link to="/terms" className="hover:text-primary transition-colors">Términos y Seguridad</Link>
          {isAdmin && (
            <Link to="/admin" className="hover:text-primary transition-colors font-bold">Panel Admin</Link>
          )}
        </div>
        <p>&copy; {new Date().getFullYear()} AGARCH-AR. Todos los derechos reservados.</p>
        <p className="text-xs mt-2">
          Esta plataforma está destinada a mayores de 18 años. Se prohíben actividades ilegales.
        </p>
      </div>
    </footer>
  );
};

export default LandingFooter;
