'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface Shortcut {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  description: string;
  action: () => void;
}

/**
 * Keyboard Shortcuts Provider
 * 
 * Provides global keyboard shortcuts for common actions
 */
export function KeyboardShortcutsProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const shortcuts: Shortcut[] = [
      // Global shortcuts
      {
        key: 'k',
        ctrl: true,
        meta: true,
        description: 'Open search',
        action: () => {
          // TODO: Implement global search modal
          console.log('Search shortcut triggered');
        },
      },
      {
        key: '/',
        description: 'Focus search',
        action: () => {
          const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement;
          if (searchInput) {
            searchInput.focus();
          }
        },
      },
      {
        key: '?',
        shift: true,
        description: 'Show keyboard shortcuts',
        action: () => setShowHelp(true),
      },
      {
        key: 'Escape',
        description: 'Close modal/dialog',
        action: () => {
          // Trigger escape event for modals
          document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
          setShowHelp(false);
        },
      },

      // Navigation shortcuts
      {
        key: 'd',
        ctrl: true,
        meta: true,
        description: 'Go to Dashboard',
        action: () => router.push('/dashboard'),
      },
      {
        key: 'c',
        ctrl: true,
        meta: true,
        description: 'Go to Customers',
        action: () => router.push('/customers'),
      },
      {
        key: 'j',
        ctrl: true,
        meta: true,
        description: 'Go to Jobs',
        action: () => router.push('/jobs'),
      },
      {
        key: 'i',
        ctrl: true,
        meta: true,
        description: 'Go to Invoices',
        action: () => router.push('/invoices'),
      },

      // Context-aware "New" shortcuts
      {
        key: 'n',
        ctrl: true,
        meta: true,
        description: 'Create new (context-aware)',
        action: () => {
          if (pathname.startsWith('/customers')) {
            router.push('/customers/new');
          } else if (pathname.startsWith('/jobs')) {
            router.push('/jobs/new');
          } else if (pathname.startsWith('/invoices')) {
            router.push('/invoices/new');
          } else {
            // Default to customer
            router.push('/customers/new');
          }
        },
      },
    ];

    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        // Allow Escape to work in inputs
        if (event.key !== 'Escape') {
          return;
        }
      }

      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrl ? (event.ctrlKey || event.metaKey) : !event.ctrlKey;
        const metaMatch = shortcut.meta ? (event.ctrlKey || event.metaKey) : !event.metaKey;
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const altMatch = shortcut.alt ? event.altKey : !event.altKey;
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();

        if (keyMatch && ctrlMatch && metaMatch && shiftMatch && altMatch) {
          event.preventDefault();
          shortcut.action();
          break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [router, pathname]);

  return (
    <>
      {children}
      
      {/* Keyboard Shortcuts Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Keyboard Shortcuts</h2>
                <button
                  onClick={() => setShowHelp(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Global Shortcuts */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Global</h3>
                <div className="space-y-2">
                  <ShortcutRow keys={['Ctrl', 'K']} description="Open search" />
                  <ShortcutRow keys={['/']} description="Focus search" />
                  <ShortcutRow keys={['?']} description="Show this help" />
                  <ShortcutRow keys={['Esc']} description="Close modal/dialog" />
                </div>
              </div>

              {/* Navigation Shortcuts */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Navigation</h3>
                <div className="space-y-2">
                  <ShortcutRow keys={['Ctrl', 'D']} description="Go to Dashboard" />
                  <ShortcutRow keys={['Ctrl', 'C']} description="Go to Customers" />
                  <ShortcutRow keys={['Ctrl', 'J']} description="Go to Jobs" />
                  <ShortcutRow keys={['Ctrl', 'I']} description="Go to Invoices" />
                </div>
              </div>

              {/* Actions */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Actions</h3>
                <div className="space-y-2">
                  <ShortcutRow keys={['Ctrl', 'N']} description="Create new (context-aware)" />
                </div>
              </div>

              {/* Note */}
              <div className="text-xs text-gray-500 pt-4 border-t border-gray-200">
                <p>On Mac, use ⌘ (Cmd) instead of Ctrl</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ShortcutRow({ keys, description }: { keys: string[]; description: string }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-gray-700">{description}</span>
      <div className="flex gap-1">
        {keys.map((key, index) => (
          <kbd
            key={index}
            className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-300 rounded"
          >
            {key}
          </kbd>
        ))}
      </div>
    </div>
  );
}

