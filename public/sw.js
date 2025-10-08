/**
 * Service Worker for EasyPost Dashboard 2025
 * Progressive Web App (PWA) Support
 */

const CACHE_NAME = 'easypost-dashboard-v4.1.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/app.js',
  '/advanced-features.js',
  '/analytics-enhanced.js',
  '/ui-enhancements.js',
  '/style.css',
  '/advanced-styles.css',
  '/favicon.ico',
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip API requests (always fetch from network)
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return new Response(
            JSON.stringify({ 
              error: 'Offline', 
              message: 'You are currently offline. API requests require network connection.' 
            }),
            { 
              status: 503,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        })
    );
    return;
  }

  // Cache-first strategy for static assets
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          console.log('[SW] Serving from cache:', event.request.url);
          return cachedResponse;
        }

        console.log('[SW] Fetching from network:', event.request.url);
        return fetch(event.request)
          .then((response) => {
            // Don't cache if not successful
            if (!response || response.status !== 200 || response.type === 'error') {
              return response;
            }

            // Clone response (can only use once)
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // Return offline page if available
            return caches.match('/offline.html') || new Response(
              '<html><body><h1>Offline</h1><p>You are currently offline</p></body></html>',
              { headers: { 'Content-Type': 'text/html' } }
            );
          });
      })
  );
});

// Background sync for failed requests
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-shipments') {
    event.waitUntil(syncShipments());
  }
});

async function syncShipments() {
  // Retry failed shipment creations
  const db = await openDB();
  const pending = await db.getAll('pending-shipments');

  for (const shipment of pending) {
    try {
      const response = await fetch('/api/shipments/create', {
        method: 'POST',
        headers: shipment.headers,
        body: JSON.stringify(shipment.data),
      });

      if (response.ok) {
        await db.delete('pending-shipments', shipment.id);
        console.log('[SW] Synced shipment:', shipment.id);
      }
    } catch (error) {
      console.error('[SW] Failed to sync shipment:', error);
    }
  }
}

// Push notifications
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  
  const options = {
    body: data.message || 'New update available',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: data.id || 1
    },
    actions: [
      { action: 'view', title: 'View', icon: '/icons/view.png' },
      { action: 'close', title: 'Close', icon: '/icons/close.png' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'EasyPost Update', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Helper function for IndexedDB
async function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('easypost-db', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pending-shipments')) {
        db.createObjectStore('pending-shipments', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

console.log('[SW] Service Worker loaded successfully!');
