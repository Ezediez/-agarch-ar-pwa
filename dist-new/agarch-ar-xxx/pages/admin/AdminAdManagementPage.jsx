import React from 'react';
import { Helmet } from 'react-helmet-async';

const AdminAdManagementPage = () => {
  return (
    <>
      <Helmet>
        <title>Gestión de Publicidad - Admin</title>
      </Helmet>
      <div>
        <h1 className="text-3xl font-bold text-primary mb-4">Gestión de Publicidad</h1>
        <p className="text-text-secondary">
          Sube, activa o desactiva los banners publicitarios de la plataforma.
        </p>

        <div className="mt-8 card-glass p-6 rounded-lg">
           <h2 className="text-xl font-semibold mb-4">Funcionalidad en Desarrollo</h2>
           <p className="text-text-secondary">
             🚧 ¡Próximamente podrás gestionar los anuncios y banners desde esta sección! 🚧
           </p>
        </div>
      </div>
    </>
  );
};

export default AdminAdManagementPage;
