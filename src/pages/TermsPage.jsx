import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const TermsPage = () => {
  return (
    <>
      <Helmet>
        <title>Términos, Condiciones y Seguridad - AGARCH-AR</title>
        <meta name="description" content="Conoce las reglas de nuestra comunidad y cómo protegemos tu seguridad." />
      </Helmet>
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <div className="w-full max-w-2xl text-center">
          <h1 className="text-4xl font-bold mb-4 text-primary">Términos, Condiciones y Seguridad</h1>
          <p className="text-text-secondary mb-8">
            Esta sección está en construcción. Aquí encontrarás toda la información sobre las reglas de la comunidad y nuestras políticas de seguridad.
          </p>
          <div className="card-glass p-8 rounded-lg text-left">
            <h2 className="text-2xl font-bold mb-4">Puntos Clave (Próximamente)</h2>
            <ul className="list-disc list-inside space-y-2 text-text-secondary">
              <li>Política de Uso Aceptable</li>
              <li>Proceso de Verificación de Perfil</li>
              <li>Normas de la Comunidad</li>
              <li>Política de Privacidad y Manejo de Datos</li>
              <li>Procedimientos de Reporte y Moderación</li>
            </ul>
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

export default TermsPage;