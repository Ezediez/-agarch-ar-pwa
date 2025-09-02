// Service Worker Configuration for AGARCH-AR PWA
const CACHE_NAME = 'agarch-ar-v1';
const STATIC_CACHE = 'agarch-ar-static-v1';
const DYNAMIC_CACHE = 'agarch-ar-dynamic-v1';

// URLs to cache immediately
const STATIC_URLS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/pwa-192x192.png',
  '/pwa-512x512.png'
];

// Routes that should always fallback to index.html
const SPA_ROUTES = [
  '/discover',
  '/chat',
  '/profile',
  '/search',
  '/settings',
  '/create-post',
  '/payments',
  '/login',
  '/register',
  '/landing',
  '/admin'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('Caching static assets');
        return cache.addAll(STATIC_URLS);
      })
      .then(() => {
        console.log('Service Worker installed');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker activated');
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

// Handle static assets
async function handleStaticAsset(request) {
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
    console.log('Failed to fetch static asset:', request.url);
    return new Response('Asset not available', { status: 404 });
  }
}

// Handle API calls
async function handleAPI(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      // Cache successful API responses briefly
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
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
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      data: data.data || {}
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

console.log('Service Worker configuration loaded');










