import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const AdRegisterPage = () => {
  return (
    <>
      <Helmet>
        <title>Registro Publicitario - AGARCH-AR</title>
        <meta name="description" content="Crea tu cuenta de anunciante para publicitar en AGARCH-AR." />
      </Helmet>
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <div className="w-full max-w-md text-center">
          <h1 className="text-4xl font-bold mb-4 text-primary">Registro Publicitario</h1>
          <p className="text-text-secondary mb-8">
            Esta sección está en construcción. Aquí podrás crear tu cuenta para mostrar anuncios a nuestra comunidad.
          </p>
          <div className="card-glass p-8 rounded-lg">
            <p className="text-lg font-semibold">🚧 ¡Próximamente! 🚧</p>
            <p className="text-text-secondary mt-2">
              Estamos trabajando para traerte la mejor plataforma de anuncios.
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

export default AdRegisterPage;