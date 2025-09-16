// Service Worker Configuration for AGARCH-AR PWA - FIREBASE VERSION
const CACHE_NAME = 'agarch-ar-firebase-v5';
const STATIC_CACHE = 'agarch-ar-static-v5';
const DYNAMIC_CACHE = 'agarch-ar-dynamic-v5';

// Force update version
const FORCE_UPDATE_VERSION = 'v5-firebase-optimized';

// URLs to cache immediately
const STATIC_URLS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/pwa-512x512.png'
];

// Routes that should always fallback to index.html
const SPA_ROUTES = [
  '/discover',
  '/chat',
  '/my-profile',
  '/profile',
  '/search',
  '/settings',
  '/create-post',
  '/payments',
  '/login',
  '/register',
  '/landing',
  '/admin',
  '/ad-register',
  '/ad-login',
  '/contact',
  '/terms',
  '/privacy'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('🔥 Service Worker installing - Firebase v5 optimizado...');
  event.waitUntil(
    // Delete all old caches first
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            console.log('🗑️ Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Open new cache
      return caches.open(STATIC_CACHE);
    }).then(cache => {
      console.log('📦 Caching static assets');
      return cache.addAll(STATIC_URLS);
    }).then(() => {
      console.log('✅ Service Worker installed - Firebase v5 optimizado');
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('🔥 Service Worker activating - Firebase v5 optimizado...');
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ Service Worker activated - Firebase v5 optimizado');
        return self.clients.claim();
      })
  );
});

// Fetch event - handle navigation and API calls
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Handle navigation requests (HTML)
  if (request.destination === 'document' || request.destination === '') {
    event.respondWith(handleNavigation(request));
    return;
  }
  
  // Handle static assets
  if (request.destination === 'script' || 
      request.destination === 'style' || 
      request.destination === 'image') {
    event.respondWith(handleStaticAsset(request));
    return;
  }
  
  // Handle API calls
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleAPI(request));
    return;
  }
});

// Handle navigation requests
async function handleNavigation(request) {
  try {
    // Try network first
    const response = await fetch(request);
    if (response.ok) {
      return response;
    }
  } catch (error) {
    console.log('Network failed for navigation, trying cache');
  }
  
  // Fallback to cache or index.html
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // For SPA routes, return index.html
  const url = new URL(request.url);
  if (SPA_ROUTES.some(route => url.pathname.startsWith(route))) {
    const indexResponse = await caches.match('/index.html');
    if (indexResponse) {
      return indexResponse;
    }
  }
  
  // Final fallback
  return caches.match('/index.html');
}

// Handle static assets - Optimizado para móviles
async function handleStaticAsset(request) {
  const url = new URL(request.url);
  
  // Para imágenes, usar cache-first para mejor rendimiento móvil
  if (request.destination === 'image') {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    try {
      const response = await fetch(request);
      if (response.ok) {
        const cache = await caches.open(DYNAMIC_CACHE);
        cache.put(request, response.clone());
      }
      return response;
    } catch (error) {
      console.log('Failed to fetch image:', request.url);
      return new Response('Image not available', { status: 404 });
    }
  }
  
  // Para CSS y JS, usar network-first con cache fallback
  const cachedResponse = await caches.match(request);
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    if (cachedResponse) {
      console.log('Using cached asset for:', request.url);
      return cachedResponse;
    }
    console.log('Failed to fetch static asset:', request.url);
    return new Response('Asset not available', { status: 404 });
  }
}

// Handle API calls - Optimizado para Firebase
async function handleAPI(request) {
  const url = new URL(request.url);
  
  // Para Firebase APIs, no cachear para evitar datos obsoletos
  if (url.hostname.includes('firebase') || url.hostname.includes('googleapis')) {
    try {
      const response = await fetch(request);
      return response;
    } catch (error) {
      console.log('Firebase API call failed:', request.url);
      return new Response('Firebase API not available', { status: 503 });
    }
  }
  
  // Para otras APIs, usar cache con TTL corto
  try {
    const response = await fetch(request);
    if (response.ok) {
      // Solo cachear respuestas exitosas por 5 minutos
      const cache = await caches.open(DYNAMIC_CACHE);
      const responseToCache = response.clone();
      responseToCache.headers.set('sw-cache-timestamp', Date.now().toString());
      cache.put(request, responseToCache);
    }
    return response;
  } catch (error) {
    // Intentar usar cache como fallback
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      const cacheTime = cachedResponse.headers.get('sw-cache-timestamp');
      if (cacheTime && (Date.now() - parseInt(cacheTime)) < 300000) { // 5 minutos
        console.log('Using cached API response for:', request.url);
        return cachedResponse;
      }
    }
    console.log('API call failed:', request.url);
    return new Response('API not available', { status: 503 });
  }
}

// Handle push notifications (if needed)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/pwa-512x512.png',
      badge: '/pwa-512x512.png',
      data: data.data || {}
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

console.log('Service Worker configuration loaded');
















