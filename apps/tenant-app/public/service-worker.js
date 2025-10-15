// Service Worker for Offline Support
// Version 1.0.0

const CACHE_NAME = 'cortiware-tenant-v1';
const RUNTIME_CACHE = 'cortiware-runtime-v1';
const DATA_CACHE = 'cortiware-data-v1';

// Critical pages to cache for offline access
const CRITICAL_PAGES = [
  '/',
  '/dashboard',
  '/customers',
  '/jobs',
  '/invoices',
  '/offline',
];

// Static assets to cache
const STATIC_ASSETS = [
  '/favicon.ico',
  '/manifest.json',
];

// Install event - cache critical resources
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Install');
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Caching critical pages and assets');
      return cache.addAll([...CRITICAL_PAGES, ...STATIC_ASSETS].filter(Boolean));
    }).catch((error) => {
      console.error('[ServiceWorker] Cache failed:', error);
    })
  );
  
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activate');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE && cacheName !== DATA_CACHE) {
            console.log('[ServiceWorker] Removing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Take control of all pages immediately
  return self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }
  
  // Handle API requests differently
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }
  
  // Handle page requests
  if (request.mode === 'navigate') {
    event.respondWith(handlePageRequest(request));
    return;
  }
  
  // Handle static assets
  event.respondWith(handleStaticRequest(request));
});

// Handle API requests - network first, cache fallback
async function handleApiRequest(request) {
  try {
    const response = await fetch(request);
    
    // Cache successful GET requests
    if (request.method === 'GET' && response.ok) {
      const cache = await caches.open(DATA_CACHE);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('[ServiceWorker] Network request failed, trying cache:', request.url);
    
    // Try to serve from cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline response for failed API requests
    return new Response(
      JSON.stringify({ error: 'Offline', offline: true }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// Handle page requests - cache first, network fallback
async function handlePageRequest(request) {
  try {
    // Try cache first
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      // Update cache in background
      fetch(request).then((response) => {
        if (response.ok) {
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, response);
          });
        }
      }).catch(() => {
        // Ignore network errors in background update
      });
      
      return cachedResponse;
    }
    
    // Fetch from network
    const response = await fetch(request);
    
    // Cache successful responses
    if (response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('[ServiceWorker] Page request failed:', request.url);
    
    // Try to serve offline page
    const offlineResponse = await caches.match('/offline');
    if (offlineResponse) {
      return offlineResponse;
    }
    
    // Return basic offline response
    return new Response(
      '<html><body><h1>Offline</h1><p>You are currently offline. Please check your connection.</p></body></html>',
      {
        status: 503,
        headers: { 'Content-Type': 'text/html' },
      }
    );
  }
}

// Handle static assets - cache first, network fallback
async function handleStaticRequest(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const response = await fetch(request);
    
    // Cache successful responses
    if (response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('[ServiceWorker] Static request failed:', request.url);
    return new Response('Offline', { status: 503 });
  }
}

// Handle background sync for queued actions
self.addEventListener('sync', (event) => {
  console.log('[ServiceWorker] Background sync:', event.tag);
  
  if (event.tag === 'sync-queued-actions') {
    event.waitUntil(syncQueuedActions());
  }
});

// Sync queued actions when connection is restored
async function syncQueuedActions() {
  try {
    // Get queued actions from IndexedDB
    const db = await openDatabase();
    const actions = await getQueuedActions(db);
    
    console.log('[ServiceWorker] Syncing', actions.length, 'queued actions');
    
    // Execute each action
    for (const action of actions) {
      try {
        const response = await fetch(action.url, {
          method: action.method,
          headers: action.headers,
          body: action.body,
        });
        
        if (response.ok) {
          // Remove from queue
          await removeQueuedAction(db, action.id);
          console.log('[ServiceWorker] Synced action:', action.id);
        }
      } catch (error) {
        console.error('[ServiceWorker] Failed to sync action:', action.id, error);
      }
    }
  } catch (error) {
    console.error('[ServiceWorker] Sync failed:', error);
  }
}

// IndexedDB helpers
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('CortiwareOffline', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('queuedActions')) {
        db.createObjectStore('queuedActions', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

function getQueuedActions(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['queuedActions'], 'readonly');
    const store = transaction.objectStore('queuedActions');
    const request = store.getAll();
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function removeQueuedAction(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['queuedActions'], 'readwrite');
    const store = transaction.objectStore('queuedActions');
    const request = store.delete(id);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

