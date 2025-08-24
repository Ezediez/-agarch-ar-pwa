import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const AdLoginPage = () => {
  return (
    <>
      <Helmet>
        <title>Login de Anunciante - AGARCH-AR</title>
        <meta name="description" content="Inicia sesión en tu cuenta de anunciante de AGARCH-AR." />
      </Helmet>
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <div className="w-full max-w-md text-center">
          <h1 className="text-4xl font-bold mb-4 text-primary">Portal de Anunciantes</h1>
          <p className="text-text-secondary mb-8">
            Esta sección está en construcción. Aquí podrás iniciar sesión para gestionar tus campañas publicitarias.
          </p>
          <div className="card-glass p-8 rounded-lg">
            <p className="text-lg font-semibold">🚧 ¡Próximamente! 🚧</p>
            <p className="text-text-secondary mt-2">
              El portal para anunciantes estará disponible muy pronto.
            </p>
          </div>
          <Button asChild variant="outline" className="mt-8 group">
            <Link to="/landing">
              <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
              Volver al Inicio
            </Link>
          </Button>
        </div>
      </div>
    </>
  );
};

export default AdLoginPage;