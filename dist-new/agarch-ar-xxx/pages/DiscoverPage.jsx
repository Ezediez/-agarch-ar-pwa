import React, { Suspense, lazy } from 'react';
import { Helmet } from 'react-helmet-async';

// Lazy load components for better mobile performance
const CreatePost = lazy(() => import('@/components/discover/CreatePost'));
const VipCarousel = lazy(() => import('@/components/feed/VipCarousel'));
const PublicationsFeed = lazy(() => import('@/components/feed/PublicationsFeed'));

const DiscoverPage = () => {
  return (
    <>
      <Helmet>
        <title>Descubrir | AGARCH-AR</title>
        <meta name="description" content="Descubre publicaciones, historias y perfiles cerca tuyo" />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-4 space-y-6">
          {/* Carrusel VIP */}
          <Suspense fallback={
            <div className="flex items-center justify-center py-8">
              <div className="loading-spinner" />
            </div>
          }>
            <VipCarousel />
          </Suspense>

          {/* Botón crear publicación */}
          <Suspense fallback={
            <div className="flex items-center justify-center py-4">
              <div className="loading-spinner" />
            </div>
          }>
            <CreatePost />
          </Suspense>

          {/* Feed de publicaciones */}
          <Suspense fallback={
            <div className="flex items-center justify-center py-8">
              <div className="loading-spinner" />
            </div>
          }>
            <PublicationsFeed />
          </Suspense>
        </div>
      </div>
    </>
  );
};

export default DiscoverPage;