import React from 'react';
import { Helmet } from 'react-helmet-async';
import VipDemoForm from '@/components/demo/VipDemoForm';

const VipDemoPage = () => {
  return (
    <>
      <Helmet>
        <title>Demo VIP/Premium - Admin | AGARCH-AR</title>
        <meta name="description" content="Panel de administración para activar demos VIP y Premium" />
      </Helmet>
      
      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary mb-2">
              Panel Demo VIP/Premium
            </h1>
            <p className="text-muted-foreground">
              Activa demos de funciones VIP y Premium para pruebas
            </p>
          </div>
          
          <VipDemoForm />
        </div>
      </div>
    </>
  );
};

export default VipDemoPage;
