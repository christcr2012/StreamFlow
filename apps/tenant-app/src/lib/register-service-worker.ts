'use client';

/**
 * Service Worker Registration
 * 
 * Registers the service worker for offline support:
 * - Checks for service worker support
 * - Registers service worker
 * - Handles updates
 * - Provides registration status
 */

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  // Check if service workers are supported
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.log('[ServiceWorker] Service workers are not supported');
    return null;
  }

  // Only register in production or when explicitly enabled
  if (process.env.NODE_ENV !== 'production' && process.env.NEXT_PUBLIC_ENABLE_SW !== 'true') {
    console.log('[ServiceWorker] Service worker disabled in development');
    return null;
  }

  try {
    // Wait for page load
    if (document.readyState === 'loading') {
      await new Promise((resolve) => {
        window.addEventListener('load', resolve, { once: true });
      });
    }

    // Register service worker
    const registration = await navigator.serviceWorker.register('/service-worker.js', {
      scope: '/',
    });

    console.log('[ServiceWorker] Registration successful:', registration.scope);

    // Check for updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (!newWorker) return;

      console.log('[ServiceWorker] Update found');

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          console.log('[ServiceWorker] New version available');
          
          // Notify user about update
          if (window.confirm('A new version is available. Reload to update?')) {
            newWorker.postMessage({ type: 'SKIP_WAITING' });
            window.location.reload();
          }
        }
      });
    });

    // Handle controller change
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('[ServiceWorker] Controller changed');
      window.location.reload();
    });

    // Check for updates periodically (every hour)
    setInterval(() => {
      registration.update();
    }, 60 * 60 * 1000);

    return registration;
  } catch (error) {
    console.error('[ServiceWorker] Registration failed:', error);
    return null;
  }
}

/**
 * Unregister Service Worker
 * 
 * Unregisters the service worker and clears caches
 */
export async function unregisterServiceWorker(): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      await registration.unregister();
      console.log('[ServiceWorker] Unregistered successfully');
      
      // Clear all caches
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((name) => caches.delete(name)));
      console.log('[ServiceWorker] Caches cleared');
      
      return true;
    }
    return false;
  } catch (error) {
    console.error('[ServiceWorker] Unregistration failed:', error);
    return false;
  }
}

/**
 * Check Service Worker Status
 * 
 * Returns the current service worker status
 */
export async function getServiceWorkerStatus(): Promise<{
  supported: boolean;
  registered: boolean;
  active: boolean;
  scope?: string;
}> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return { supported: false, registered: false, active: false };
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    
    return {
      supported: true,
      registered: !!registration,
      active: !!registration?.active,
      scope: registration?.scope,
    };
  } catch (error) {
    console.error('[ServiceWorker] Status check failed:', error);
    return { supported: true, registered: false, active: false };
  }
}

/**
 * Send Message to Service Worker
 * 
 * Sends a message to the active service worker
 */
export async function sendMessageToServiceWorker(message: any): Promise<void> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration?.active) {
      registration.active.postMessage(message);
    }
  } catch (error) {
    console.error('[ServiceWorker] Failed to send message:', error);
  }
}

