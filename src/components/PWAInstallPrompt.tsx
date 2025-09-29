// src/components/PWAInstallPrompt.tsx
import { useState, useEffect } from 'react';
import { XMarkIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';

/**
 * 📱 PWA INSTALLATION PROMPT COMPONENT
 * 
 * Provides a user-friendly prompt to install the StreamFlow app
 * on their device. Handles the beforeinstallprompt event and
 * provides platform-specific installation instructions.
 */

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PWAInstallPromptProps {
  className?: string;
}

export default function PWAInstallPrompt({ className = '' }: PWAInstallPromptProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop' | 'unknown'>('unknown');

  useEffect(() => {
    // Check if app is already installed
    const checkIfInstalled = () => {
      // Check for display-mode: standalone
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      // Check for iOS standalone mode
      const isIOSStandalone = (window.navigator as any).standalone === true;
      
      setIsInstalled(isStandalone || isIOSStandalone);
    };

    // Detect platform
    const detectPlatform = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      if (/iphone|ipad|ipod/.test(userAgent)) {
        setPlatform('ios');
      } else if (/android/.test(userAgent)) {
        setPlatform('android');
      } else {
        setPlatform('desktop');
      }
    };

    checkIfInstalled();
    detectPlatform();

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Show prompt after a delay (don't be too aggressive)
      setTimeout(() => {
        if (!isInstalled) {
          setShowPrompt(true);
        }
      }, 10000); // Show after 10 seconds
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isInstalled]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    try {
      // Show the install prompt
      await deferredPrompt.prompt();
      
      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      
      // Clear the deferredPrompt
      setDeferredPrompt(null);
      setShowPrompt(false);
    } catch (error) {
      console.error('Error showing install prompt:', error);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Don't show again for this session
    sessionStorage.setItem('pwa-prompt-dismissed', 'true');
  };

  // Don't show if already installed or dismissed this session
  if (isInstalled || sessionStorage.getItem('pwa-prompt-dismissed')) {
    return null;
  }

  // Don't show if no prompt available and not iOS
  if (!deferredPrompt && platform !== 'ios') {
    return null;
  }

  if (!showPrompt) {
    return null;
  }

  const getInstallInstructions = () => {
    switch (platform) {
      case 'ios':
        return (
          <div className="text-sm text-slate-300">
            <p className="mb-2">To install StreamFlow on your iPhone/iPad:</p>
            <ol className="list-decimal list-inside space-y-1 text-xs">
              <li>Tap the Share button in Safari</li>
              <li>Scroll down and tap "Add to Home Screen"</li>
              <li>Tap "Add" to confirm</li>
            </ol>
          </div>
        );
      case 'android':
        return (
          <div className="text-sm text-slate-300">
            <p className="mb-2">Install StreamFlow for quick access and offline features.</p>
          </div>
        );
      case 'desktop':
        return (
          <div className="text-sm text-slate-300">
            <p className="mb-2">Install StreamFlow as a desktop app for better performance and offline access.</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`fixed bottom-4 left-4 right-4 z-50 ${className}`}>
      <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-lg p-4 max-w-sm mx-auto">
        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 text-slate-400 hover:text-slate-300 transition-colors"
          aria-label="Dismiss install prompt"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>

        {/* Content */}
        <div className="pr-6">
          <div className="flex items-center mb-3">
            <div className="flex-shrink-0 mr-3">
              <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <ArrowDownTrayIcon className="h-6 w-6 text-white" />
              </div>
            </div>
            <div>
              <h3 className="text-white font-medium">Install StreamFlow</h3>
              <p className="text-xs text-slate-400">Get the full app experience</p>
            </div>
          </div>

          {getInstallInstructions()}

          {/* Install Button (for supported browsers) */}
          {deferredPrompt && (
            <button
              onClick={handleInstallClick}
              className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800"
            >
              Install App
            </button>
          )}

          {/* Benefits */}
          <div className="mt-3 text-xs text-slate-400">
            <p>Benefits:</p>
            <ul className="list-disc list-inside mt-1 space-y-0.5">
              <li>Work offline</li>
              <li>Faster loading</li>
              <li>Desktop notifications</li>
              <li>No browser UI</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
