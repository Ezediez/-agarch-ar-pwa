import React, { Suspense, lazy, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { Search, Bell, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Lazy load components for better mobile performance
const CreatePost = lazy(() => import('@/components/discover/CreatePost'));
const VipCarousel = lazy(() => import('@/components/feed/VipCarousel'));
const PublicationsFeed = lazy(() => import('@/components/feed/PublicationsFeed'));

const DiscoverPage = () => {
  const feedRef = useRef(null);
  return (
    <>
      <Helmet>
        <title>Descubrir | AGARCH-AR</title>
        <meta name="description" content="Descubre publicaciones, historias y perfiles cerca tuyo" />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        {/* Header con título y acciones */}
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-primary">Descubrir</h1>
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="p-2"
                  onClick={() => {
                    if (feedRef.current?.handleRefresh) {
                      feedRef.current.handleRefresh();
                    }
                  }}
                >
                  <RefreshCw className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="sm" className="p-2">
                  <Bell className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>

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
            <PublicationsFeed ref={feedRef} />
          </Suspense>
        </div>
      </div>
    </>
  );
};

export default DiscoverPage;